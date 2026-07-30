// Query engine over index.json.
//
// Deliberately deterministic and explainable: scoring is exact/prefix/substring
// matching over tags, aliases, id, and description — no embeddings. Two reasons
// beyond simplicity: (1) the whole plugin promises reproducible receipts and a
// hard-offline `--local-only` path, which a model dependency would break; (2) an
// agent can see WHY a candidate matched and fix a bad result by editing tags
// instead of tuning a threshold. index entries carry an optional `vector` field
// so semantic search can be added later without a re-index.
//
// This module decides NOTHING. It returns ranked candidates with reasons; the
// vidmuse-assets agent picks and media-use freezes. Same split as the rest of
// the skill.

const SPLIT = /[^\p{L}\p{N}]+/u;
const HAS_CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

/**
 * Shortest field that may match inside a longer query term.
 *
 * Latin needs 3+ so "a"/"an" don't match everything. CJK is information-dense
 * and unsegmented: a 2-character word is a full concept ("波浪" = wave), and
 * requiring 3 would make Chinese queries fail where English ones succeed.
 */
function minFieldMatch(text) {
  return HAS_CJK.test(text) ? 2 : 3;
}

/** Split a query into comparable terms. CJK has no spaces, so keep runs whole. */
export function terms(query) {
  return [
    ...new Set(
      String(query || "")
        .toLowerCase()
        .split(SPLIT)
        .filter(Boolean),
    ),
  ];
}

/**
 * Expand a query through the Chinese lexicon.
 *
 * Upstream tag metadata (Lucide, Phosphor, Simple Icons) is English-only, so a
 * Chinese query would otherwise miss thousands of correctly-tagged assets.
 * Expansion happens HERE, at query time, rather than by writing Chinese aliases
 * into every index entry: one lexicon covers every pack including ones added
 * later, and the index stays small.
 *
 * Substring matching handles unsegmented input — "购物车图标" contains "购物车"
 * with no separator to split on. Expansions are marked so a hit through the
 * lexicon is visible in the match reasons rather than looking like a direct hit.
 */
export function expandTerms(queryTerms, lexicon) {
  const table = lexicon?.terms;
  if (!table) return { terms: queryTerms, expansions: new Map() };
  const expansions = new Map();
  const out = [...queryTerms];

  // Longest key first, and once a term is consumed by a key, shorter keys
  // contained in it are skipped. "购物车" must expand as "shopping cart" only —
  // without this it also fires the "购物" entry and drags in bag/store/basket,
  // which dilutes the query until shopping-cart ties with shopping-bag.
  const keys = Object.keys(table).sort((a, b) => b.length - a.length);
  const consumed = new Map(queryTerms.map((term) => [term, []]));
  for (const zh of keys) {
    const key = zh.toLowerCase();
    for (const term of queryTerms) {
      if (term !== key && !term.includes(key)) continue;
      // Skip when a longer key already covered this part of the term.
      if (consumed.get(term).some((taken) => taken.includes(key))) continue;
      consumed.get(term).push(key);
      for (const token of table[zh]) {
        const lower = token.toLowerCase();
        if (!out.includes(lower)) out.push(lower);
        if (!expansions.has(lower)) expansions.set(lower, zh);
      }
    }
  }
  return { terms: out, expansions };
}

function haystack(item) {
  const fields = [];
  const push = (value, weight, label) => {
    if (!value) return;
    const list = Array.isArray(value) ? value : [value];
    for (const entry of list) {
      if (typeof entry !== "string" || !entry) continue;
      fields.push({ text: entry.toLowerCase(), weight, label });
    }
  };
  // Name outranks tags: an asset literally named "trash" must beat one merely
  // tagged "trash" (eraser and shredder both carry that synonym upstream). The
  // name is canonical identity; tags are recall.
  const stem = item.name || item.id?.split("/").pop();
  push(stem, 14, "name");
  // Asset names are overwhelmingly hyphenated compounds ("shopping-cart"), so
  // each part must be matchable on its own. Without this, "cart" only
  // substring-matches the compound and loses to a sibling that happens to carry
  // "cart" as an upstream synonym.
  if (stem && /[-_]/.test(stem)) push(stem.split(/[-_]+/).filter(Boolean), 12, "name-part");
  push(item.tags, 10, "tag");
  push(item.aliases_zh, 10, "alias");
  push(item.aliases, 10, "alias");
  push(item.pack, 3, "pack");
  push(item.group, 3, "group");
  push(item.description, 2, "description");
  return fields;
}

/**
 * Score one item against query terms. Exact field match beats prefix, prefix
 * beats substring. Every term that hits contributes; matching more distinct
 * terms always outranks matching one term very well.
 */
export function scoreItem(item, queryTerms, expansions) {
  if (queryTerms.length === 0) return { score: 0, reasons: [], matched: 0 };
  const fields = haystack(item);
  const reasons = [];
  const concepts = new Map();
  let score = 0;
  let matched = 0;

  for (const term of queryTerms) {
    const via = expansions?.get(term);
    let best = null;
    for (const field of fields) {
      let multiplier = 0;
      if (field.text === term) multiplier = 1;
      // Lexicon tokens are already a recall expansion. Letting a short expanded
      // token fuzzy-match again compounds uncertainty: 垃圾桶 -> bin used to
      // surface binary, binoculars, and non-binary. Exact tags/name-parts retain
      // useful synonyms without that second fuzzy jump.
      else if (!via && field.text.startsWith(term)) multiplier = 0.7;
      else if (!via && field.text.includes(term)) multiplier = 0.45;
      else if (
        !via &&
        term.includes(field.text) &&
        field.text.length >= minFieldMatch(field.text)
      ) {
        // Reverse containment: the query is a compound the field appears in.
        // Essential for CJK, which has no word separator — "波浪分隔" arrives as
        // one term and must still reach the "波浪" and "分隔" aliases. Scaled by
        // how much of the term the field covers so a 2-char hit inside a long
        // compound scores below a fuller match.
        multiplier = 0.3 * Math.min(1, (field.text.length / term.length) * 1.5);
      }
      if (multiplier === 0) continue;
      const value = field.weight * multiplier;
      if (!best || value > best.value) {
        best = { value, label: field.label, text: field.text, exact: multiplier === 1 };
      }
    }
    if (best) {
      matched += 1;
      // Score per CONCEPT, keeping only its best field match — not per token.
      // "锁定" expands to both "lock" and "locked", so an item carrying both
      // (user-lock: name-part "lock" + tag "locked") must not bank two payouts
      // for one idea, or it outranks the icon actually named lock.
      const key = via || term;
      const prior = concepts.get(key);
      // A lexicon expansion is a weaker signal than a term the caller typed:
      // "删除" -> [trash, delete, remove] casts a wider net, so it should not
      // outrank a direct hit on the original query.
      const value = best.value * (via ? 0.85 : 1);
      const reason = `${best.label}${best.exact ? "=" : "~"}${best.text}${via ? ` (via ${via})` : ""}`;
      if (!prior || value > prior.value) concepts.set(key, { value, reason });
    }
  }

  for (const { value, reason } of concepts.values()) {
    score += value;
    reasons.push(reason);
  }
  // Reward covering more of the query, so a two-concept hit beats a lucky one.
  if (concepts.size > 1) score *= 1 + 0.35 * (concepts.size - 1);

  // Specificity: among items matching the same terms, prefer the one carrying
  // the least extra baggage. "arrow right" should land on arrow-right, not
  // arrow-big-right; "trash" on trash, not trash-2. They match every term
  // equally well, so without this the tie falls to alphabetical order.
  //
  // Measured against terms this item actually MATCHED, not the query length: a
  // lexicon expansion ("锁定" -> lock, locked, secure) inflates the term count,
  // and comparing against that would stop penalizing extra name parts exactly
  // when Chinese queries need it most.
  const stem = item.name || item.id?.split("/").pop() || "";
  const parts = stem.split(/[-_]+/).filter(Boolean).length;
  if (parts > concepts.size) score -= 2.5 * (parts - concepts.size);

  return { score: Math.round(score * 100) / 100, reasons, matched };
}

/**
 * License state for an item, falling back to its pack header.
 *
 * The index normalizes per-pack constants into `index.packs` to keep the file
 * small, so a license filter must consult the header rather than assume the
 * field is on the item.
 */
function licenseStateOf(item, index) {
  return item.license_state ?? (item.pack ? index?.packs?.[item.pack]?.license_state : null) ?? null;
}

function applyFilters(items, filters = {}, index = null) {
  return items.filter((item) => {
    if (filters.type && item.type !== filters.type) return false;
    if (filters.pack && item.pack !== filters.pack) return false;
    if (filters.root && item.root !== filters.root) return false;
    if (filters.tileable === true && item.geometry?.tileable !== true) return false;
    if (filters.tileable === false && item.geometry?.tileable === true) return false;
    if (filters.alpha === true && item.geometry?.alpha !== true) return false;
    if (filters.licenseState && licenseStateOf(item, index) !== filters.licenseState) return false;
    if (filters.commercialOnly && licenseStateOf(item, index) !== "verified-commercial") {
      return false;
    }
    return true;
  });
}

/**
 * Run a query. `mode` comes from the type's declared discovery when a single
 * type is filtered; a cross-type query always ranks by keyword because there is
 * no single table or sheet to return.
 *
 * table -> every matching item, ordered but not truncated: the set is small
 *          enough for the agent to reason across the whole thing.
 * keyword -> ranked top-N.
 * sheet -> ranked top-N, and the caller renders a contact sheet from the paths.
 */
export function queryIndex(
  index,
  { query = "", top = 10, mode = "keyword", lexicon = null, ...filters } = {},
) {
  const items = applyFilters(Array.isArray(index?.items) ? index.items : [], filters, index);
  const { terms: queryTerms, expansions } = expandTerms(terms(query), lexicon);

  if (mode === "table" && queryTerms.length === 0) {
    return { mode, total: items.length, truncated: false, results: items.map((item) => ({ item })) };
  }

  const scored = queryTerms.length
    ? items
        .map((item) => ({ item, ...scoreItem(item, queryTerms, expansions) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    : items.map((item) => ({ item, score: 0, reasons: [], matched: 0 }));

  if (mode === "table") {
    return { mode, total: scored.length, truncated: false, results: scored };
  }
  const limit = Math.max(1, Number(top) || 10);
  let results = scored.slice(0, limit);

  // Identity types get a relevance floor rather than a plain top-N.
  //
  // For an icon a near-miss is a stylistic choice; for a brand mark it is a
  // factual error in the film. A query for "阿里云" lexically brushes every
  // other cloud brand (云 -> cloud), and offering those as candidates invites
  // exactly the wrong-identity substitution the semantic pass forbids. So once
  // there is a strong match, weak ones are dropped instead of padding the list.
  if (filters.type === "offline-logo" && results.length > 1) {
    const best = results[0].score;
    if (best > 0) results = results.filter((row) => row.score >= best * 0.6);
  }

  return {
    mode,
    total: scored.length,
    truncated: scored.length > results.length,
    results,
  };
}

/**
 * Pick one entry deterministically from interchangeable candidates.
 *
 * Variants inside a homogeneous pack (grain-01 vs grain-07 off the same film
 * scan) are often visually interchangeable. Spending model tokens — or a random
 * draw — to separate them is waste that also breaks reproducibility. Keyed by a
 * caller-supplied seed (an asset id or beat id) so the same request always
 * lands on the same file.
 */
export function stableChoice(candidates, seed = "") {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  let hash = 2166136261;
  const key = String(seed);
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return candidates[Math.abs(hash) % candidates.length];
}
