const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;

export async function getSitemapBuckets(db, size) {
  const result = await db.prepare("SELECT DISTINCT CAST((rowid - 1) / ? AS INTEGER) AS bucket FROM poems ORDER BY bucket").bind(size).all();
  return result.results.map(row => row.bucket);
}

export async function getSitemapPoems(db, bucket, size) {
  const result = await db.prepare("SELECT id, updated_at FROM poems WHERE rowid > ? AND rowid <= ? ORDER BY rowid LIMIT ?")
    .bind(bucket * size, (bucket + 1) * size, size).all();
  return result.results;
}

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toPublicPoem(row) {
  const full = parseJson(row.content_json);
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    dynasty: row.dynasty,
    genre: row.genre,
    form: row.form,
    category: parseJson(row.categories_json)[0] || row.genre,
    tags: parseJson(row.categories_json).filter((item) => ![row.dynasty, row.genre, row.form].includes(item)),
    excerpt: full.slice(0, 4),
    full,
    translation: row.translation,
    note: row.note,
    appreciation: row.appreciation,
    source: {
      key: row.source_key,
      url: row.source_url,
      license: row.source_license,
    },
  };
}

function safeFtsQuery(query) {
  const clean = query.replace(/["'*:^(){}[\]]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? `"${clean.replaceAll('"', '""')}"` : "";
}

export async function queryPoems(db, searchParams) {
  const query = (searchParams.get("q") || "").trim();
  const dynasty = searchParams.get("dynasty") || "全部";
  const genre = searchParams.get("genre") || "全部";
  const category = searchParams.get("category") || "全部";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  const conditions = [];
  const bindings = [];
  let from = "poems p";

  if (query) {
    from += " JOIN poems_fts f ON f.poem_id = p.id";
    conditions.push("poems_fts MATCH ?");
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
    conditions.push("p.categories_json LIKE ?");
    bindings.push(`%"${category.replaceAll('"', '')}"%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const statement = db.prepare(`
    SELECT p.* FROM ${from}
    ${where}
    ORDER BY p.quality_score DESC, p.id ASC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset);
  const result = await statement.all();
  return result.results.map(toPublicPoem);
}

export async function getPoem(db, id) {
  const row = await db.prepare("SELECT * FROM poems WHERE id = ?").bind(id).first();
  return row ? toPublicPoem(row) : null;
}

export async function getAuthors(db) {
  const result = await db.prepare(`
    SELECT author AS name, dynasty, COUNT(*) AS count
    FROM poems
    GROUP BY author, dynasty
    ORDER BY count DESC, author ASC
    LIMIT 12
  `).all();
  return result.results;
}

export async function getStats(db) {
  const [summary, sources, dynasties, genres] = await db.batch([
    db.prepare("SELECT COUNT(*) AS poem_count, COUNT(DISTINCT author) AS author_count FROM poems"),
    db.prepare("SELECT source_key, label, imported_count, status, last_file, last_run_at, last_error FROM crawler_sources ORDER BY source_key"),
    db.prepare("SELECT dynasty, COUNT(*) AS count FROM poems GROUP BY dynasty ORDER BY count DESC"),
    db.prepare("SELECT genre, COUNT(*) AS count FROM poems GROUP BY genre ORDER BY count DESC"),
  ]);
  return {
    poemCount: summary.results[0]?.poem_count || 0,
    authorCount: summary.results[0]?.author_count || 0,
    sources: sources.results,
    dynasties: dynasties.results,
    genres: genres.results,
  };
}
