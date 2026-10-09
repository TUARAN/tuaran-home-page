const test = require("node:test");
const assert = require("node:assert/strict");

const Vision = require("./canvas-vision.js");

function frame(width, height, painter) {
  const pixels = Array.from({ length: width * height }, (_, index) => painter(index % width, Math.floor(index / width)));
  return { width, height, pixels };
}

test("finds a calibrated visual template near its expected relative position", () => {
  const source = frame(80, 50, (x, y) => {
    if (x >= 42 && x < 52 && y >= 21 && y < 29) return (x + y) % 2 ? 20 : 230;
    return 245;
  });
  const template = Vision.captureTemplate(source, 47, 25, 10, 8);
  const moved = frame(80, 50, (x, y) => {
    if (x >= 46 && x < 56 && y >= 24 && y < 32) return (x - 4 + y - 3) % 2 ? 20 : 230;
    return 245;
  });
  const match = Vision.findBestTemplateMatch(moved, template, 47, 25, { radiusX: 12, radiusY: 10, step: 1 });

  assert.ok(match.score > 0.99);
  assert.equal(match.x, 51);
  assert.equal(match.y, 28);
});

test("rejects material canvas aspect ratio changes", () => {
  assert.equal(Vision.aspectRatioCompatible(1248, 828, 1000, 663), true);
  assert.equal(Vision.aspectRatioCompatible(1248, 828, 1000, 800), false);
});

test("measures stable frames independently of size-compatible objects", () => {
  const first = frame(20, 20, () => 100);
  const same = frame(20, 20, () => 100);
  const changed = frame(20, 20, (x) => x < 10 ? 0 : 255);
  assert.equal(Vision.frameDifference(first, same), 0);
  assert.ok(Vision.frameDifference(first, changed) > 0.3);
});
