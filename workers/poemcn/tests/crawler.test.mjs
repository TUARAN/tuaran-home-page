import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyForm,
  classifyThemes,
  fingerprint,
  normalizeRecord,
} from "../src/crawler.js";

test("classifyForm identifies common regulated verse forms", () => {
  assert.equal(classifyForm(["千山鸟飞绝，万径人踪灭。", "孤舟蓑笠翁，独钓寒江雪。"], "诗"), "五言绝句");
  assert.equal(classifyForm(["云想衣裳花想容，春风拂槛露华浓。", "若非群玉山头见，会向瑶台月下逢。"], "诗"), "七言绝句");
  assert.equal(classifyForm(["莫听穿林打叶声。"], "词"), "词");
});

test("classifyThemes applies multiple stable taxonomy labels", () => {
  const themes = classifyThemes("送友人", ["青山横北郭，白水绕东城。", "挥手自兹去，萧萧班马鸣。"]);
  assert.ok(themes.includes("送别"));
  assert.ok(themes.includes("山水"));
});

test("fingerprint is deterministic and content-sensitive", () => {
  assert.equal(fingerprint("同一首诗"), fingerprint("同一首诗"));
  assert.notEqual(fingerprint("同一首诗"), fingerprint("另一首诗"));
});

test("normalizeRecord preserves provenance and classification", () => {
  const source = {
    source_key: "tang-poetry",
    directory: "全唐诗",
    dynasty: "唐代",
    genre: "诗",
  };
  const poem = normalizeRecord({
    id: "demo-id",
    title: "江雪",
    author: "柳宗元",
    paragraphs: ["千山鸟飞绝，万径人踪灭。", "孤舟蓑笠翁，独钓寒江雪。"],
  }, source, "poet.tang.0.json", 0);

  assert.equal(poem.id, "cp-demo-id");
  assert.equal(poem.form, "五言绝句");
  assert.equal(poem.sourceKey, "chinese-poetry:tang-poetry");
  assert.match(poem.sourceUrl, /chinese-poetry/);
  assert.ok(poem.categories.includes("唐代"));
});

test("normalizeRecord accepts alternate collection schemas", () => {
  const source = {
    source_key: "shijing",
    directory: "诗经",
    dynasty: "先秦",
    genre: "诗",
  };
  const poem = normalizeRecord({
    title: "关雎",
    chapter: "国风",
    section: "周南",
    content: ["关关雎鸠，在河之洲。窈窕淑女，君子好逑。"],
  }, source, "shijing.json", 0);

  assert.deepEqual(poem.paragraphs, ["关关雎鸠，在河之洲。窈窕淑女，君子好逑。"]);
  assert.ok(poem.categories.includes("国风"));
  assert.ok(poem.categories.includes("周南"));
});
