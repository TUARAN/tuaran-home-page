const REPOSITORY = "chinese-poetry/chinese-poetry";
const BRANCH = "master";
const BATCH_SIZE = 200;
const LICENSE = "MIT（原始古典作品为公共领域；结构化数据集采用 MIT）";
const USER_AGENT = "ChinaPoetryBot/1.0 (https://poemcn.2aran.com/)";
const FILE_SERIES = {
  "tang-poetry": { prefix: "poet.tang", max: 57000 },
  "song-poetry": { prefix: "poet.song", max: 254000 },
  "song-ci": { prefix: "ci.song", max: 21000 },
};
const FIXED_FILES = {
  "yuan-qu": ["yuanqu.json"],
  shijing: ["shijing.json"],
  chuci: ["chuci.json"],
  "cao-cao": ["caocao.json"],
  nalan: ["纳兰性德诗集.json"],
  huajianji: [
    "huajianji-1-juan.json",
    "huajianji-2-juan.json",
    "huajianji-3-juan.json",
    "huajianji-4-juan.json",
    "huajianji-5-juan.json",
    "huajianji-6-juan.json",
    "huajianji-7-juan.json",
    "huajianji-8-juan.json",
    "huajianji-9-juan.json",
    "huajianji-x-juan.json",
  ],
  "nantang-ci": ["poetrys.json"],
};

const THEME_RULES = [
  ["山水", /山|水|江|河|湖|海|峰|岭|溪|泉/],
  ["思乡", /故乡|故园|乡关|归家|客心|乡心|家书/],
  ["送别", /送|赠|别|相送|折柳/],
  ["爱情", /相思|红豆|鸳鸯|恋|情人|闺|良人/],
  ["田园", /田|园|柴门|桑麻|耕|农|村|篱/],
  ["边塞", /塞|边城|胡马|玉门|烽火|戍|将军/],
  ["咏物", /梅|兰|竹|菊|牡丹|荷|松|柳|花/],
  ["怀古", /怀古|故国|古迹|兴亡|前朝|旧都/],
  ["节令", /元日|清明|端午|中秋|重阳|除夕/],
  ["人生", /人生|生死|浮生|白发|岁月|年华/],
];

export function classifyForm(paragraphs, genre) {
  if (genre === "词" || genre === "曲" || genre === "文") return genre;
  const clauses = paragraphs
    .flatMap((line) => String(line).split(/[，。！？；]/u))
    .map((line) => line.replace(/[\s、,.!?；：:“”‘’（）()《》]/gu, ""))
    .filter(Boolean);
  const lengths = clauses.map((line) => [...line].length);
  const uniform = (length) => lengths.length > 0 && lengths.every((value) => value === length);

  if (clauses.length === 4 && uniform(5)) return "五言绝句";
  if (clauses.length === 4 && uniform(7)) return "七言绝句";
  if (clauses.length === 8 && uniform(5)) return "五言律诗";
  if (clauses.length === 8 && uniform(7)) return "七言律诗";
  if (uniform(5)) return "五言古诗";
  if (uniform(7)) return "七言古诗";
  return "古体诗";
}

export function classifyThemes(title, paragraphs) {
  const text = `${title}\n${paragraphs.join("\n")}`;
  return THEME_RULES.filter(([, pattern]) => pattern.test(text))
    .map(([theme]) => theme)
    .slice(0, 4);
}

export function fingerprint(value) {
  let hash = 0xcbf29ce484222325n;
  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0));
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function normalizeRecord(raw, source, fileName, rowIndex) {
  const rawParagraphs = raw.paragraphs || raw.content || raw.para;
  const paragraphs = Array.isArray(rawParagraphs)
    ? rawParagraphs.map((line) => String(line).trim()).filter(Boolean)
    : [];
  if (!paragraphs.length) return null;

  const title = String(raw.title || raw.rhythmic || "无题").trim();
  const author = String(raw.author || "佚名").trim();
  const contentText = paragraphs.join("\n");
  const sourceRecordId = String(raw.id || `${fileName}:${rowIndex}`);
  const themes = classifyThemes(title, paragraphs);
  const form = classifyForm(paragraphs, source.genre);
  const sourceCategories = [raw.chapter, raw.section, raw.rhythmic].filter(Boolean).map(String);
  const note = Array.isArray(raw.notes) ? raw.notes.join("\n") : null;

  return {
    id: raw.id ? `cp-${raw.id}` : `cp-${source.source_key}-${fileName}-${rowIndex}`,
    title,
    author,
    dynasty: source.dynasty,
    genre: source.genre,
    form,
    paragraphs,
    contentText,
    categories: [...new Set([source.dynasty, source.genre, form, ...sourceCategories, ...themes])],
    note,
    sourceKey: `chinese-poetry:${source.source_key}`,
    sourceUrl: `https://github.com/${REPOSITORY}/blob/${source.commit || BRANCH}/${encodePath(source.directory)}/${encodeURIComponent(fileName)}`,
    sourceLicense: LICENSE,
    sourceRecordId,
    fingerprint: fingerprint(`${title}\n${author}\n${contentText}`),
    qualityScore: Math.min(60, 20 + (themes.length * 4) + (raw.id ? 4 : 0)),
  };
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function listSourceFiles(source) {
  const series = FILE_SERIES[source.source_key];
  const names = series
    ? Array.from({ length: (series.max / 1000) + 1 }, (_, index) => `${series.prefix}.${index * 1000}.json`)
    : FIXED_FILES[source.source_key] || [];
  return names.map((name) => ({
    name,
    download_url: `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${encodePath(source.directory)}/${encodeURIComponent(name)}`,
  }));
}

async function fetchRecords(file) {
  const response = await fetch(file.download_url, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!response.ok) throw new Error(`数据文件读取失败：${file.name} (${response.status})`);
  const records = await response.json();
  if (!Array.isArray(records)) throw new Error(`数据文件格式异常：${file.name}`);
  return records;
}

function insertStatement(db, poem) {
  return db.prepare(`
    INSERT OR IGNORE INTO poems (
      id, title, author, dynasty, genre, form, content_json, content_text,
      categories_json, note, source_key, source_url, source_license, source_record_id,
      fingerprint, quality_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    poem.id,
    poem.title,
    poem.author,
    poem.dynasty,
    poem.genre,
    poem.form,
    JSON.stringify(poem.paragraphs),
    poem.contentText,
    JSON.stringify(poem.categories),
    poem.note,
    poem.sourceKey,
    poem.sourceUrl,
    poem.sourceLicense,
    poem.sourceRecordId,
    poem.fingerprint,
    poem.qualityScore,
  );
}

export async function insertPoems(db, poems) {
  let imported = 0;
  for (let index = 0; index < poems.length; index += 50) {
    const batch = poems.slice(index, index + 50);
    const results = await db.batch(batch.map((poem) => insertStatement(db, poem)));
    imported += results.reduce((total, result) => total + Math.max(0, Number(result?.meta?.changes || 0)), 0);
  }
  return imported;
}

async function selectSource(db) {
  return db.prepare(`
    SELECT * FROM crawler_sources
    WHERE status = 'active'
    ORDER BY COALESCE(last_run_at, '') ASC, source_key ASC
    LIMIT 1
  `).first();
}

async function recordRun(db, run) {
  await db.prepare(`
    INSERT INTO crawl_runs (
      source_key, file_name, imported_count, skipped_count, status,
      message, started_at, finished_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    run.sourceKey,
    run.fileName || null,
    run.imported || 0,
    run.skipped || 0,
    run.status,
    run.message || null,
    run.startedAt,
    new Date().toISOString(),
  ).run();
}

export async function runCrawler(env) {
  const startedAt = new Date().toISOString();
  const source = await selectSource(env.DB);
  if (!source) return { status: "idle", message: "所有数据源均已完成" };

  let fileName = null;
  try {
    const files = listSourceFiles(source);
    if (!files.length) throw new Error("没有匹配的数据文件");

    if (source.file_index >= files.length) {
      await env.DB.prepare(`
        UPDATE crawler_sources
        SET status = 'complete', last_run_at = ?, last_error = NULL, updated_at = ?
        WHERE source_key = ?
      `).bind(startedAt, startedAt, source.source_key).run();
      const result = { sourceKey: source.source_key, status: "complete", startedAt, message: "数据源导入完成" };
      await recordRun(env.DB, result);
      return result;
    }

    const file = files[source.file_index];
    fileName = file.name;
    const rawRecords = await fetchRecords(file);
    const slice = rawRecords.slice(source.row_index, source.row_index + BATCH_SIZE);
    const normalized = slice
      .map((record, index) => normalizeRecord(record, source, file.name, source.row_index + index))
      .filter(Boolean);
    const imported = await insertPoems(env.DB, normalized);
    const skipped = slice.length - imported;
    const nextRow = source.row_index + slice.length;
    const fileComplete = nextRow >= rawRecords.length;
    const nextFileIndex = fileComplete ? source.file_index + 1 : source.file_index;
    const nextRowIndex = fileComplete ? 0 : nextRow;
    const sourceComplete = nextFileIndex >= files.length;

    await env.DB.prepare(`
      UPDATE crawler_sources SET
        file_index = ?, row_index = ?, imported_count = imported_count + ?,
        status = ?, last_file = ?, last_run_at = ?, last_error = NULL, updated_at = ?
      WHERE source_key = ?
    `).bind(
      nextFileIndex,
      nextRowIndex,
      imported,
      sourceComplete ? "complete" : "active",
      file.name,
      startedAt,
      startedAt,
      source.source_key,
    ).run();

    const result = {
      sourceKey: source.source_key,
      fileName: file.name,
      imported,
      skipped,
      status: sourceComplete ? "complete" : "success",
      startedAt,
      message: `处理 ${slice.length} 条，新增 ${imported} 条`,
    };
    await recordRun(env.DB, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await env.DB.prepare(`
      UPDATE crawler_sources
      SET last_run_at = ?, last_error = ?, updated_at = ?
      WHERE source_key = ?
    `).bind(startedAt, message.slice(0, 500), startedAt, source.source_key).run();
    const result = {
      sourceKey: source.source_key,
      fileName,
      status: "error",
      startedAt,
      message,
    };
    await recordRun(env.DB, result);
    throw error;
  }
}
