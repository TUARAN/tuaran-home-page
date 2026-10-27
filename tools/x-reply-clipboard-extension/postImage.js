(function (root) {
  "use strict";

  const WIDTH = 1200;
  const HEIGHT = 675;
  const FONT = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
  const PALETTES = [
    ["#142b45", "#294f70", "#8ed8f8"],
    ["#193a34", "#286259", "#9ce4c4"],
    ["#3a284a", "#604777", "#e0b9f2"],
    ["#49301f", "#79543a", "#f1c99d"]
  ];

  function cardHeadline(postText) {
    const first = String(postText || "").replace(/\r/gu, "").split(/\n+/u).map((line) => line.trim()).find(Boolean) || "";
    const sentence = first.match(/^.{8,90}?[。！？!?]/u)?.[0] || first;
    return Array.from(sentence).slice(0, 76).join("").trim();
  }

  function wrapLines(context, text, maxWidth, maxLines = 4) {
    const lines = [];
    let line = "";
    for (const character of Array.from(text)) {
      if (context.measureText(`${line}${character}`).width > maxWidth && line) {
        lines.push(line);
        line = character;
        if (lines.length === maxLines) break;
      } else {
        line += character;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length === maxLines && lines.join("").length < text.length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[，,。！？!?\s]+$/u, "")}…`;
    }
    return lines;
  }

  async function createPostCard(postText, topic = "") {
    const headline = cardHeadline(postText);
    if (!headline) throw new Error("帖子没有可用于配图的文字");
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器无法绘制配图");
    const palette = PALETTES[Array.from(headline).reduce((sum, char) => sum + char.codePointAt(0), 0) % PALETTES.length];
    const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, palette[0]);
    background.addColorStop(1, palette[1]);
    context.fillStyle = background;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.globalAlpha = 0.12;
    context.fillStyle = palette[2];
    context.beginPath();
    context.arc(1050, 70, 280, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(1130, 660, 200, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = palette[2];
    context.fillRect(86, 88, 72, 8);
    context.font = `600 30px ${FONT}`;
    const label = String(topic || "话题观察").replace(/\s+/gu, " ").trim().slice(0, 24) || "话题观察";
    context.fillText(label, 86, 157, 880);
    context.fillStyle = "#ffffff";
    context.font = `700 ${headline.length > 42 ? 58 : 66}px ${FONT}`;
    const lines = wrapLines(context, headline, 1010, 4);
    const lineHeight = headline.length > 42 ? 82 : 92;
    const firstY = Math.max(270, 365 - (lines.length - 1) * lineHeight / 2);
    lines.forEach((line, index) => context.fillText(line, 86, firstY + index * lineHeight, 1020));
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob || blob.size < 1000) throw new Error("配图生成失败");
    return new File([blob], `post-card-${Date.now()}.png`, { type: "image/png" });
  }

  const api = { cardHeadline, wrapLines, createPostCard };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionPostImage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
