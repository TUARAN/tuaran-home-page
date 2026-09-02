import { authors as featuredAuthors, poems as curatedPoems } from "./data.js";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;
const CURATED_SEED_COUNT = curatedPoems.length;
const SAFE_OBJECT_KEY = /^[A-Za-z0-9][A-Za-z0-9/_.,:@+=-]{0,1023}$/;

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function publicMetadata(row) {
  const categories = parseJson(row.categories_json);
  const excerpt = parseJson(row.excerpt_json).filter((line) => typeof line === "string" && line.length > 0);
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    dynasty: row.dynasty,
    genre: row.genre,
    form: row.form,
    category: categories[0] || row.genre,
    tags: categories.filter((item) => ![row.dynasty, row.genre, row.form].includes(item)),
    excerpt,
    bodyKey: row.body_key || null,
    datasetVersion: row.dataset_version || "legacy",
  };
}

function legacyMetadata(row) {
  return publicMetadata({
    ...row,
    excerpt_json: JSON.stringify(parseJson(row.content_json).slice(0, 4)),
    body_key: null,
    dataset_version: "legacy",
  });
}

function publicBody(metadata, body) {
  const full = Array.isArray(body?.full) ? body.full : Array.isArray(body?.paragraphs) ? body.paragraphs : [];
  return {
    ...metadata,
    excerpt: metadata.excerpt.length ? metadata.excerpt : full.slice(0, 4),
    full,
    translation: body?.translation || null,
    note: body?.note || null,
    appreciation: body?.appreciation || null,
    source: body?.source || { key: "", url: "", license: "" },
  };
}

function safeFtsQuery(query) {
  const clean = query.replace(/["'*:^(){}[\]]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? `"${clean.replaceAll('"', '""')}"` : "";
}

export async function getDatasetState(db) {
  const row = await db.prepare(`
    SELECT active_version, source_repository, source_commit, stats_json,
           sitemap_index_key, sitemap_prefix, published_at
    FROM dataset_state WHERE id = 1
  `).first();
  return row || {
    active_version: "legacy",
    source_repository: "chinese-poetry/chinese-poetry",
    source_commit: "",
    stats_json: "{}",
    sitemap_index_key: null,
    sitemap_prefix: null,
    published_at: null,
  };
}

export async function getSitemapBuckets(db, size) {
  const state = await getDatasetState(db);
  const row = state.active_version === "legacy"
    ? await db.prepare("SELECT MAX(rowid) AS max_ordinal FROM poems").first()
    : await db.prepare(`
        SELECT MAX(sitemap_ordinal) AS max_ordinal
        FROM poem_search_index WHERE dataset_version = ?
      `).bind(state.active_version).first();
  const maxOrdinal = Math.max(0, Number(row?.max_ordinal || 0));
  return Array.from({ length: Math.ceil(maxOrdinal / size) }, (_, bucket) => bucket);
}

export async function getSitemapPoems(db, bucket, size) {
  const state = await getDatasetState(db);
  const result = state.active_version === "legacy"
    ? await db.prepare("SELECT id, updated_at FROM poems WHERE rowid > ? AND rowid <= ? ORDER BY rowid LIMIT ?")
      .bind(bucket * size, (bucket + 1) * size, size).all()
    : await db.prepare(`
        SELECT id, updated_at FROM poem_search_index
        WHERE dataset_version = ? AND sitemap_ordinal > ? AND sitemap_ordinal <= ?
        ORDER BY sitemap_ordinal LIMIT ?
      `).bind(state.active_version, bucket * size, (bucket + 1) * size, size).all();
  return result.results;
}

export async function getStaticReleaseObject(bucket, key) {
  if (!bucket || !key || !SAFE_OBJECT_KEY.test(key) || key.includes("..")) return null;
  const object = await bucket.get(key);
  if (!object?.body) return null;
  return object;
}

export async function queryPoems(db, searchParams) {
  const query = (searchParams.get("q") || "").trim();
  const dynasty = searchParams.get("dynasty") || "全部";
  const genre = searchParams.get("genre") || "全部";
  const category = searchParams.get("category") || "全部";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  const state = await getDatasetState(db);
  const versioned = state.active_version !== "legacy";
  const conditions = versioned ? ["p.dataset_version = ?"] : [];
  const bindings = [];
  if (versioned) bindings.push(state.active_version);
  let from = versioned ? "poem_search_index p" : "poems p";

  if (query) {
    from += versioned
      ? " JOIN poem_search_fts f ON f.dataset_version = p.dataset_version AND f.poem_id = p.id"
      : " JOIN poems_fts f ON f.poem_id = p.id";
    conditions.push(versioned ? "poem_search_fts MATCH ?" : "poems_fts MATCH ?");
    bindings.push(safeFtsQuery(query));
  }
  if (dynasty !== "全部") {
    conditions.push("p.dynasty = ?");
    bindings.push(dynasty);
  }
  if (genre !== "全部") {
    conditions.push("p.genre = ?");
    bindings.push(genre);
  }
  if (category !== "全部") {
    const cleanCategory = category.replaceAll('"', "");
    if (versioned) {
      from += " JOIN poem_search_categories c ON c.dataset_version = p.dataset_version AND c.poem_id = p.id";
      conditions.push("c.category = ?");
      bindings.push(cleanCategory);
    } else {
      conditions.push("p.categories_json LIKE ?");
      bindings.push(`%"${cleanCategory}"%`);
    }
  }

  const selectedColumns = versioned
    ? "p.id, p.title, p.author, p.dynasty, p.genre, p.form, p.categories_json, p.excerpt_json, p.body_key, p.dataset_version"
    : "p.id, p.title, p.author, p.dynasty, p.genre, p.form, p.categories_json, p.content_json";
  const result = await db.prepare(`
    SELECT ${selectedColumns}
    FROM ${from}
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY p.quality_score DESC, p.id ASC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();
  return result.results.map(versioned ? publicMetadata : legacyMetadata);
}

export async function getPoem(db, contentBucket, id) {
  const state = await getDatasetState(db);
  if (state.active_version === "legacy") {
    const row = await db.prepare(`
      SELECT id, title, author, dynasty, genre, form, categories_json, content_json,
             translation, note, appreciation, source_key, source_url, source_license
      FROM poems WHERE id = ?
    `).bind(id).first();
    if (!row) return null;
    return publicBody(legacyMetadata(row), {
      full: parseJson(row.content_json), translation: row.translation, note: row.note,
      appreciation: row.appreciation,
      source: { key: row.source_key, url: row.source_url, license: row.source_license },
    });
  }

  const row = await db.prepare(`
    SELECT id, title, author, dynasty, genre, form, categories_json,
           excerpt_json, body_key, dataset_version
    FROM poem_search_index WHERE dataset_version = ? AND id = ?
  `).bind(state.active_version, id).first();
  if (!row) return null;

  const metadata = publicMetadata(row);
  const object = await getStaticReleaseObject(contentBucket, row.body_key);
  if (!object) throw new Error(`R2 正文分片不存在：${row.body_key}`);
  const shard = await object.json();
  const body = Array.isArray(shard?.poems)
    ? shard.poems.find((item) => item?.id === id)
    : shard?.poems?.[id];
  if (!body) throw new Error(`R2 正文分片未包含诗文：${id}`);
  return publicBody(metadata, body);
}

export async function getAuthors() {
  return featuredAuthors;
}

export async function getStats(db) {
  const state = await getDatasetState(db);
  const releaseStats = parseJson(state.stats_json, {});
  if (Number.isFinite(Number(releaseStats.poemCount))) {
    return {
      ...releaseStats,
      poemCount: Number(releaseStats.poemCount),
      ingestionMode: "versioned-release",
      datasetVersion: state.active_version,
      sourceCommit: state.source_commit,
      publishedAt: state.published_at,
    };
  }

  const sources = await db.prepare(
    "SELECT source_key, label, imported_count, status, last_file, last_run_at, last_error FROM crawler_sources ORDER BY source_key",
  ).all();
  const poemCount = sources.results.reduce(
    (total, source) => total + Math.max(0, Number(source.imported_count || 0)),
    CURATED_SEED_COUNT,
  );
  return { poemCount, ingestionMode: "legacy-snapshot", sources: sources.results };
}
