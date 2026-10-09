(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ProtalCanvasVision = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function frameFromRgba(rgba, width, height, scale = 3) {
    const nextWidth = Math.max(1, Math.floor(width / scale));
    const nextHeight = Math.max(1, Math.floor(height / scale));
    const pixels = new Uint8Array(nextWidth * nextHeight);

    for (let y = 0; y < nextHeight; y += 1) {
      for (let x = 0; x < nextWidth; x += 1) {
        const sourceX = Math.min(width - 1, x * scale + Math.floor(scale / 2));
        const sourceY = Math.min(height - 1, y * scale + Math.floor(scale / 2));
        const offset = (sourceY * width + sourceX) * 4;
        pixels[y * nextWidth + x] = Math.round(
          rgba[offset] * 0.299 + rgba[offset + 1] * 0.587 + rgba[offset + 2] * 0.114
        );
      }
    }

    return { width: nextWidth, height: nextHeight, pixels: Array.from(pixels), scale };
  }

  function captureTemplate(frame, centerX, centerY, requestedWidth = 60, requestedHeight = 22) {
    const width = Math.min(frame.width, Math.max(8, Math.round(requestedWidth)));
    const height = Math.min(frame.height, Math.max(8, Math.round(requestedHeight)));
    const left = clamp(Math.round(centerX - width / 2), 0, frame.width - width);
    const top = clamp(Math.round(centerY - height / 2), 0, frame.height - height);
    const pixels = [];

    for (let y = 0; y < height; y += 1) {
      const start = (top + y) * frame.width + left;
      pixels.push(...frame.pixels.slice(start, start + width));
    }

    return { width, height, pixels };
  }

  function correlationAt(frame, template, left, top) {
    const count = template.width * template.height;
    let templateSum = 0;
    let candidateSum = 0;

    for (let y = 0; y < template.height; y += 1) {
      for (let x = 0; x < template.width; x += 1) {
        const templateValue = template.pixels[y * template.width + x];
        const candidateValue = frame.pixels[(top + y) * frame.width + left + x];
        templateSum += templateValue;
        candidateSum += candidateValue;
      }
    }

    const templateMean = templateSum / count;
    const candidateMean = candidateSum / count;
    let numerator = 0;
    let templateNorm = 0;
    let candidateNorm = 0;

    for (let y = 0; y < template.height; y += 1) {
      for (let x = 0; x < template.width; x += 1) {
        const templateDelta = template.pixels[y * template.width + x] - templateMean;
        const candidateDelta = frame.pixels[(top + y) * frame.width + left + x] - candidateMean;
        numerator += templateDelta * candidateDelta;
        templateNorm += templateDelta * templateDelta;
        candidateNorm += candidateDelta * candidateDelta;
      }
    }

    if (templateNorm < 1 || candidateNorm < 1) return 0;
    return numerator / Math.sqrt(templateNorm * candidateNorm);
  }

  function findBestTemplateMatch(frame, template, expectedX, expectedY, options = {}) {
    if (!template?.pixels?.length) return null;
    const radiusX = Math.max(4, Math.round(options.radiusX ?? frame.width * 0.14));
    const radiusY = Math.max(4, Math.round(options.radiusY ?? frame.height * 0.14));
    const step = Math.max(1, Math.round(options.step ?? 2));
    const expectedLeft = Math.round(expectedX - template.width / 2);
    const expectedTop = Math.round(expectedY - template.height / 2);
    const minLeft = clamp(expectedLeft - radiusX, 0, frame.width - template.width);
    const maxLeft = clamp(expectedLeft + radiusX, 0, frame.width - template.width);
    const minTop = clamp(expectedTop - radiusY, 0, frame.height - template.height);
    const maxTop = clamp(expectedTop + radiusY, 0, frame.height - template.height);
    let best = null;

    for (let top = minTop; top <= maxTop; top += step) {
      for (let left = minLeft; left <= maxLeft; left += step) {
        const correlation = correlationAt(frame, template, left, top);
        if (!best || correlation > best.correlation) {
          best = {
            x: left + template.width / 2,
            y: top + template.height / 2,
            correlation,
            score: (correlation + 1) / 2
          };
        }
      }
    }

    return best;
  }

  function aspectRatioCompatible(savedWidth, savedHeight, currentWidth, currentHeight, tolerance = 0.08) {
    if (![savedWidth, savedHeight, currentWidth, currentHeight].every((value) => value > 0)) return false;
    const savedRatio = savedWidth / savedHeight;
    const currentRatio = currentWidth / currentHeight;
    return Math.abs(currentRatio / savedRatio - 1) <= tolerance;
  }

  function frameDifference(first, second, stride = 37) {
    if (!first || !second || first.width !== second.width || first.height !== second.height) return 1;
    let difference = 0;
    let samples = 0;
    for (let index = 0; index < first.pixels.length; index += stride) {
      difference += Math.abs(first.pixels[index] - second.pixels[index]);
      samples += 1;
    }
    return samples ? difference / samples / 255 : 1;
  }

  return {
    aspectRatioCompatible,
    captureTemplate,
    findBestTemplateMatch,
    frameDifference,
    frameFromRgba
  };
});
