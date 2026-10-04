const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(typeStr, dataBuf) {
    const typeBuf = Buffer.from(typeStr, 'ascii');
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUInt32BE(dataBuf.length, 0);

    const typeAndData = Buffer.concat([typeBuf, dataBuf]);
    const crc = zlib.crc32(typeAndData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([lengthBuf, typeBuf, dataBuf, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowBytes = width * 4;
  const rawScanlines = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (1 + rowBytes);
    rawScanlines[rawOffset] = 0;
    const rgbaOffset = y * rowBytes;
    rgbaBuffer.copy(rawScanlines, rawOffset + 1, rgbaOffset, rgbaOffset + rowBytes);
  }
  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderRitmoIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

  // 1. Initialize Full-Bleed Solid White Canvas (#ffffff)
  for (let i = 0; i < size * size * 4; i += 4) {
    buf[i] = 255;
    buf[i + 1] = 255;
    buf[i + 2] = 255;
    buf[i + 3] = 255;
  }

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = (y * size + x) * 4;
    const bgA = buf[idx + 3] / 255;
    const fgA = a / 255;
    const outA = fgA + bgA * (1 - fgA);
    if (outA <= 0) return;

    buf[idx] = Math.round((r * fgA + buf[idx] * bgA * (1 - fgA)) / outA);
    buf[idx + 1] = Math.round((g * fgA + buf[idx + 1] * bgA * (1 - fgA)) / outA);
    buf[idx + 2] = Math.round((b * fgA + buf[idx + 2] * bgA * (1 - fgA)) / outA);
    buf[idx + 3] = Math.round(outA * 255);
  }

  function roundedRectDist(x, y, rx, ry, rw, rh, rad) {
    const cx = Math.max(rx + rad, Math.min(x, rx + rw - rad));
    const cy = Math.max(ry + rad, Math.min(y, ry + rh - rad));
    const dx = x - cx;
    const dy = y - cy;
    return Math.sqrt(dx * dx + dy * dy) - rad;
  }

  // 2. Harmonious, Symmetrically Centered Calendar Card Dimensions
  const cardW = size * (316 / 512); // 316 px
  const cardH = size * (276 / 512); // 276 px
  const cardX = (size - cardW) / 2; // 98 px
  const cardY = size * (126 / 512); // 126 px
  const cardRad = size * (36 / 512); // 36 px

  // 3. Smooth Drop Shadow (drawn BEFORE the card so card covers interior, NO white gap)
  const shadowOffsetY = size * (12 / 512);
  const shadowSpread = size * (28 / 512);
  const sigma = size * (12 / 512);

  const shadowMinY = Math.max(0, Math.floor(cardY));
  const shadowMaxY = Math.min(size, Math.ceil(cardY + cardH + shadowOffsetY + shadowSpread));
  const shadowMinX = Math.max(0, Math.floor(cardX - shadowSpread));
  const shadowMaxX = Math.min(size, Math.ceil(cardX + cardW + shadowSpread));

  for (let y = shadowMinY; y < shadowMaxY; y++) {
    for (let x = shadowMinX; x < shadowMaxX; x++) {
      const d = roundedRectDist(x, y - shadowOffsetY, cardX, cardY, cardW, cardH, cardRad);
      if (d <= shadowSpread) {
        const dist = Math.max(0, d);
        // Gaussian blur falloff
        const intensity = Math.exp(-(dist * dist) / (2 * sigma * sigma)) * 0.18;
        // Soft deep navy shadow
        setPixel(x, y, 20, 16, 52, Math.round(255 * intensity));
      }
    }
  }

  // 4. Elevated Calendar Card Body (Drawn ON TOP of shadow, flush and crisp)
  const cardMinY = Math.floor(cardY);
  const cardMaxY = Math.ceil(cardY + cardH);
  const cardMinX = Math.floor(cardX);
  const cardMaxX = Math.ceil(cardX + cardW);

  for (let y = cardMinY; y < cardMaxY; y++) {
    for (let x = cardMinX; x < cardMaxX; x++) {
      const d = roundedRectDist(x, y, cardX, cardY, cardW, cardH, cardRad);
      if (d <= 0.5) {
        const alpha = Math.max(0, Math.min(1, 0.5 - d));
        const isHeader = y < cardY + size * (68 / 512);

        if (d > -1.2) {
          // Subtle crisp card rim border
          setPixel(x, y, 70, 65, 120, Math.round(200 * alpha));
        } else if (isHeader) {
          // Header banner accent #2c255e
          setPixel(x, y, 44, 37, 94, Math.round(255 * alpha));
        } else {
          // Deep ink card interior #13112a
          setPixel(x, y, 19, 17, 42, Math.round(255 * alpha));
        }
      }
    }
  }

  // Helper for rounded pills
  function drawPill(px, py, pw, ph, pr, r, g, b, alpha = 1) {
    for (let y = Math.floor(py); y < Math.ceil(py + ph); y++) {
      for (let x = Math.floor(px); x < Math.ceil(px + pw); x++) {
        const d = roundedRectDist(x, y, px, py, pw, ph, pr);
        if (d <= 0.5) {
          const a = Math.max(0, Math.min(1, 0.5 - d)) * alpha;
          setPixel(x, y, r, g, b, Math.round(255 * a));
        }
      }
    }
  }

  // Helper for circles
  function drawCircle(cx, cy, radius, r, g, b, opacity = 1) {
    const minX = Math.floor(cx - radius - 1);
    const maxX = Math.ceil(cx + radius + 1);
    const minY = Math.floor(cy - radius - 1);
    const maxY = Math.ceil(cy + radius + 1);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d = Math.hypot(x - cx, y - cy) - radius;
        if (d <= 0.5) {
          const a = Math.max(0, Math.min(1, 0.5 - d)) * opacity;
          setPixel(x, y, r, g, b, Math.round(255 * a));
        }
      }
    }
  }

  // 5. Top Binder Rings (Ritmo Purple #6558f5 & Mint Green #46a978)
  drawPill(cardX + size * (64 / 512), cardY - size * (18 / 512), size * (22 / 512), size * (38 / 512), size * (11 / 512), 101, 88, 245);
  drawPill(cardX + cardW - size * (86 / 512), cardY - size * (18 / 512), size * (22 / 512), size * (38 / 512), size * (11 / 512), 70, 169, 120);

  // 6. Semantic Color Dots (Ritmo Palette: Red, Orange, Yellow, Green, Blue)
  const dotsCenterY = cardY + size * (34 / 512);
  const dotsStartX = size * (200 / 512);
  const dotSpacing = size * (28 / 512);

  drawCircle(dotsStartX, dotsCenterY, size * (6 / 512), 255, 93, 99);                       // #ff5d63 Red
  drawCircle(dotsStartX + dotSpacing, dotsCenterY, size * (6 / 512), 242, 166, 65);        // #f2a641 Orange
  drawCircle(dotsStartX + dotSpacing * 2, dotsCenterY, size * (6 / 512), 231, 201, 74);    // #e7c94a Yellow
  drawCircle(dotsStartX + dotSpacing * 3, dotsCenterY, size * (6 / 512), 70, 169, 120);    // #46a978 Green
  drawCircle(dotsStartX + dotSpacing * 4, dotsCenterY, size * (6 / 512), 76, 154, 245);    // #4c9af5 Blue

  // 7. Subtle Background Activity Matrix
  drawPill(cardX + size * (28 / 512), cardY + size * (86 / 512), size * (70 / 512), size * (14 / 512), size * (7 / 512), 255, 93, 99, 0.22);
  drawPill(cardX + size * (108 / 512), cardY + size * (86 / 512), size * (96 / 512), size * (14 / 512), size * (7 / 512), 101, 88, 245, 0.22);
  drawPill(cardX + size * (214 / 512), cardY + size * (86 / 512), size * (74 / 512), size * (14 / 512), size * (7 / 512), 70, 169, 120, 0.22);

  // 8. Dynamic Rhythm Pulse Wave Overlay
  const points = [
    [cardX + size * (18 / 512), cardY + size * (176 / 512)],
    [cardX + size * (86 / 512), cardY + size * (176 / 512)],
    [cardX + size * (110 / 512), cardY + size * (142 / 512)],
    [cardX + size * (132 / 512), cardY + size * (224 / 512)],
    [cardX + size * (166 / 512), cardY + size * (92 / 512)],
    [cardX + size * (198 / 512), cardY + size * (236 / 512)],
    [cardX + size * (222 / 512), cardY + size * (176 / 512)],
    [cardX + size * (298 / 512), cardY + size * (176 / 512)],
  ];

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  const lineWidth = size * (9 / 512);
  const glowWidth = size * (24 / 512);

  for (let y = cardMinY; y < cardMaxY; y++) {
    for (let x = cardMinX; x < cardMaxX; x++) {
      let minDist = 999999;
      let segProgress = 0;

      for (let i = 0; i < points.length - 1; i++) {
        const d = distToSegment(x, y, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
        if (d < minDist) {
          minDist = d;
          segProgress = (i + 0.5) / (points.length - 1);
        }
      }

      // Palette Interpolation across wave: Purple (#6558f5) -> Blue (#4c9af5) -> Green (#46a978)
      let pr, pg, pb;
      if (segProgress < 0.5) {
        const t = segProgress * 2;
        pr = Math.round(101 * (1 - t) + 76 * t);
        pg = Math.round(88 * (1 - t) + 154 * t);
        pb = Math.round(245 * (1 - t) + 245 * t);
      } else {
        const t = (segProgress - 0.5) * 2;
        pr = Math.round(76 * (1 - t) + 70 * t);
        pg = Math.round(154 * (1 - t) + 169 * t);
        pb = Math.round(245 * (1 - t) + 120 * t);
      }

      // Ambient Glow
      if (minDist <= glowWidth) {
        const glowFactor = Math.pow(1 - minDist / glowWidth, 2) * 0.40;
        setPixel(x, y, pr, pg, pb, Math.round(255 * glowFactor));
      }

      // Crisp Core Line
      const halfWidth = lineWidth / 2;
      if (minDist <= halfWidth + 0.5) {
        const a = Math.max(0, Math.min(1, halfWidth + 0.5 - minDist));
        setPixel(x, y, pr, pg, pb, Math.round(255 * a));
      }
    }
  }

  // 9. Luminous Apex Pulse Highlight on Peak
  const apexX = cardX + size * (166 / 512);
  const apexY = cardY + size * (92 / 512);
  drawCircle(apexX, apexY, size * (8.5 / 512), 255, 255, 255, 1);
  drawCircle(apexX, apexY, size * (4.5 / 512), 70, 169, 120, 1);

  return encodePNG(size, size, buf);
}

// Generate PNG Icons
const icon192 = renderRitmoIcon(192);
const icon512 = renderRitmoIcon(512);

fs.writeFileSync(path.join(__dirname, '../public/icons/icon-192.png'), icon192);
fs.writeFileSync(path.join(__dirname, '../public/icons/icon-512.png'), icon512);
fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), icon192);
fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), icon512);

console.log('PNG Icons successfully generated with zero white gap and flush shadow!');
