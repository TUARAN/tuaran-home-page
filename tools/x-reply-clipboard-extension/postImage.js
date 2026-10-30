(function (root) {
  "use strict";

  const WIDTH = 1200;
  const HEIGHT = 675;
  const FONT = '"PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
  const SERIF = '"Songti SC", "Noto Serif CJK SC", "STSong", serif';
  const CARD_VARIANTS = ["paper", "editorial", "highlight", "gradient"];

  function cardHeadline(postText) {
    const first = String(postText || "").replace(/\r/gu, "").split(/\n+/u).map((line) => line.trim()).find(Boolean) || "";
    const sentence = first.match(/^.{8,90}?[。！？!?]/u)?.[0] || first;
    return Array.from(sentence).slice(0, 76).join("").trim();
  }

  function cardBody(postText, headline = cardHeadline(postText)) {
    const parts = String(postText || "").replace(/\r/gu, "").split(/\n+/u).map((line) => line.trim()).filter(Boolean);
    if (parts[0]?.startsWith(headline)) parts[0] = parts[0].slice(headline.length).trim();
    return parts.filter(Boolean).slice(0, 3).join("  ");
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

  function roundBox(context, x, y, width, height, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    if (typeof context.roundRect === "function") context.roundRect(x, y, width, height, radius);
    else context.rect(x, y, width, height);
    context.fill();
  }

  function drawLines(context, text, x, y, width, size, lineHeight, maxLines, color, family = FONT, weight = 500) {
    context.font = `${weight} ${size}px ${family}`;
    context.fillStyle = color;
    const lines = wrapLines(context, text, width, maxLines);
    lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight, width));
    return y + (lines.length - 1) * lineHeight;
  }

  function titleSize(headline) {
    return headline.length > 44 ? 48 : headline.length > 26 ? 57 : 66;
  }

  function exactlyTwoLines(postText) {
    const parts = String(postText || "").replace(/\r/gu, "").split(/\n+/u).map((line) => line.trim()).filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts[1]];
    const chars = Array.from(parts[0] || "");
    if (chars.length <= 12) return [chars.join(""), ""];
    const pivot = Math.round(chars.length / 2);
    let split = pivot;
    for (let offset = 0; offset <= 6; offset += 1) {
      const found = [pivot + offset, pivot - offset].find((position) => position > 4 && position < chars.length - 4 && /[，。！？、]/u.test(chars[position - 1] || ""));
      if (found) {
        split = found;
        break;
      }
    }
    return [
      chars.slice(0, split).join("").replace(/[，。、\s]+$/u, ""),
      chars.slice(split).join("").replace(/^[，。、\s]+/u, "")
    ];
  }

  function drawCenteredBlock(context, lines, centerX, midY, maxWidth, color, family, weight, maxSize) {
    const visible = lines.filter(Boolean);
    if (!visible.length) return;
    const previousAlign = context.textAlign;
    context.textAlign = "center";
    const longest = visible.reduce((left, right) => (Array.from(left).length >= Array.from(right).length ? left : right));
    let size = maxSize;
    while (size > 32) {
      context.font = `${weight} ${size}px ${family}`;
      if (context.measureText(longest).width <= maxWidth) break;
      size -= 2;
    }
    const lineHeight = Math.round(size * 1.45);
    const start = midY - ((visible.length - 1) * lineHeight) / 2;
    context.fillStyle = color;
    visible.forEach((line, index) => context.fillText(line, centerX, start + index * lineHeight));
    context.textAlign = previousAlign;
  }

  function drawPaper(context, headline, body, label, options = {}) {
    context.fillStyle = "#dce6dc";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    roundBox(context, 43, 42, 1114, 592, 30, "#cbd7cb");
    roundBox(context, 48, 30, 1104, 594, 28, "#fffdf8");
    roundBox(context, 88, 73, 68, 68, 34, "#2e4839");
    context.font = `700 35px ${SERIF}`;
    context.fillStyle = "#fffdf8";
    context.fillText("观", 105, 119);
    context.font = `700 27px ${FONT}`;
    context.fillStyle = "#25392c";
    context.fillText("观点手记", 175, 104);
    context.font = `400 19px ${FONT}`;
    context.fillStyle = "#758574";
    context.fillText("一条有观点的记录", 175, 133);
    context.textAlign = "right";
    context.fillText(label, 1094, 110, 250);
    context.textAlign = "left";
    context.fillStyle = "#c9d2c5";
    context.fillRect(88, 164, 1022, 2);
    context.fillStyle = "#75916f";
    context.fillRect(88, 163, 65, 4);
    if (options.centered) {
      drawCenteredBlock(context, options.lines, 600, 390, 960, "#203529", SERIF, 700, 58);
    } else {
      const bottom = drawLines(context, headline, 90, 260, 1010, titleSize(headline), 75, 3, "#203529", SERIF, 700);
      const bodyY = bottom + 65;
      if (body && bodyY < 510) drawLines(context, body, 92, bodyY, 980, 31, 44, Math.min(2, Math.floor((540 - bodyY) / 44) + 1), "#3e4a3e");
    }
    context.fillStyle = "#dce3d8";
    context.fillRect(88, 560, 1022, 2);
    context.font = `600 19px ${FONT}`;
    context.fillStyle = "#5b755a";
    context.fillText("观点手记 · 原创", 90, 595);
    context.textAlign = "right";
    context.fillText("随手记录", 1105, 595);
    context.textAlign = "left";
  }

  function drawEditorial(context, headline, body, label, options = {}) {
    context.fillStyle = "#f5f0e7";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#263e36";
    context.fillRect(0, 0, 468, HEIGHT);
    context.fillStyle = "#d3bc89";
    context.fillRect(62, 71, 78, 7);
    context.font = `700 23px ${FONT}`;
    context.fillStyle = "#dbe7d7";
    context.fillText("观点 / OPINION", 62, 122);
    if (!options.centered) {
      const leftSize = Math.max(40, titleSize(headline) - 11);
      drawLines(context, headline, 62, 222, 350, leftSize, 67, 5, "#fffdf6", SERIF, 700);
    }
    context.fillStyle = "#91a798";
    context.fillRect(62, 590, 333, 2);
    context.font = `500 20px ${FONT}`;
    context.fillStyle = "#dae6da";
    context.fillText("随手一记 · 原创", 62, 631);
    context.fillStyle = "#bd8063";
    context.fillRect(520, 76, 8, 61);
    context.font = `700 26px ${FONT}`;
    context.fillStyle = "#805b47";
    context.fillText(label, 550, 115, 550);
    context.fillStyle = "#d8d0c4";
    context.fillRect(520, 171, 617, 2);
    if (options.centered) drawCenteredBlock(context, options.lines, 828, 400, 540, "#2b3b34", FONT, 700, 46);
    else drawLines(context, body || headline, 522, 256, 596, 38, 60, 6, "#2b3b34");
    context.fillStyle = "#c2b8a9";
    context.fillRect(520, 599, 617, 2);
    context.font = `600 19px ${FONT}`;
    context.fillStyle = "#766c5e";
    context.fillText("把话说具体", 522, 637);
  }

  function drawHighlight(context, headline, body, label, options = {}) {
    context.fillStyle = "#f8e2d8";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    roundBox(context, 48, 47, 1108, 581, 30, "#e5aa9d");
    roundBox(context, 40, 37, 1108, 581, 30, "#fffaf4");
    roundBox(context, 82, 80, 170, 47, 23, "#e7614b");
    context.font = `700 22px ${FONT}`;
    context.fillStyle = "#ffffff";
    context.fillText("今天看到", 109, 111);
    context.textAlign = "right";
    context.fillStyle = "#a86e5e";
    context.fillText(label, 1097, 112, 480);
    context.textAlign = "left";
    if (options.centered) {
      drawCenteredBlock(context, options.lines, 600, 360, 960, "#2d3531", FONT, 800, 56);
    } else {
      const bottom = drawLines(context, headline, 85, 225, 1020, titleSize(headline), 77, 3, "#2d3531", FONT, 800);
      context.fillStyle = "#f7d06d";
      context.fillRect(86, Math.min(454, bottom + 22), 420, 13);
      const bodyY = bottom + 80;
      if (body && bodyY < 530) drawLines(context, body, 89, bodyY, 1000, 31, 43, Math.min(2, Math.floor((545 - bodyY) / 43) + 1), "#4c514b");
    }
    context.fillStyle = "#ead7c9";
    context.fillRect(84, 563, 1018, 2);
    context.font = `600 19px ${FONT}`;
    context.fillStyle = "#aa6754";
    context.fillText("日常观察  /  原创观点", 86, 597);
  }

  function drawGradient(context, headline, body, label, options = {}) {
    const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, "#172e43");
    background.addColorStop(1, "#365e66");
    context.fillStyle = background;
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.globalAlpha = 0.12;
    context.fillStyle = "#aee7dc";
    context.beginPath();
    context.arc(1070, 70, 260, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = "#9ddfcf";
    context.fillRect(79, 84, 74, 8);
    context.font = `700 27px ${FONT}`;
    context.fillText(label, 79, 153, 920);
    if (options.centered) {
      drawCenteredBlock(context, options.lines, 600, 390, 980, "#ffffff", FONT, 700, 56);
    } else {
      const bottom = drawLines(context, headline, 79, 268, 1030, titleSize(headline), 80, 3, "#ffffff", FONT, 700);
      const bodyY = bottom + 70;
      if (body && bodyY < 568) drawLines(context, body, 82, bodyY, 980, 30, 43, Math.min(2, Math.floor((575 - bodyY) / 43) + 1), "#d7e9e7");
    }
    context.fillStyle = "#9ddfcf";
    context.fillRect(79, 609, 1040, 2);
    context.font = `600 19px ${FONT}`;
    context.fillText("观点手记 · 原创", 79, 642);
  }

  async function createPostCard(postText, topic = "", variant = "paper", options = {}) {
    const centered = options.align === "center";
    const lines = centered ? exactlyTwoLines(postText) : [];
    const headline = centered ? lines.find(Boolean) : cardHeadline(postText);
    if (!headline) throw new Error("帖子没有可用于配图的文字");
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器无法绘制配图");
    const body = centered ? "" : cardBody(postText, headline);
    const label = String(topic || "话题观察").replace(/\s+/gu, " ").trim().slice(0, 18) || "话题观察";
    const selected = CARD_VARIANTS.includes(variant) ? variant : "paper";
    const drawOptions = centered ? { centered: true, lines } : {};
    if (selected === "paper") drawPaper(context, headline, body, label, drawOptions);
    else if (selected === "editorial") drawEditorial(context, headline, body, label, drawOptions);
    else if (selected === "highlight") drawHighlight(context, headline, body, label, drawOptions);
    else drawGradient(context, headline, body, label, drawOptions);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob || blob.size < 1000) throw new Error("配图生成失败");
    return new File([blob], `post-card-${Date.now()}.png`, { type: "image/png" });
  }

  const api = { CARD_VARIANTS, cardHeadline, cardBody, wrapLines, createPostCard };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.XInteractionPostImage = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
