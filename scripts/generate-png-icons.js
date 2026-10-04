const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function encodePNG(width, height, rgbaBuffer) {
  // 1. PNG Signature
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

  // 2. IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: 6 = RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // 3. IDAT Chunk (Scanlines with filter byte 0)
  const rowBytes = width * 4;
  const rawScanlines = Buffer.alloc((1 + rowBytes) * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (1 + rowBytes);
    rawScanlines[rawOffset] = 0; // Filter None
    const rgbaOffset = y * rowBytes;
    rgbaBuffer.copy(rawScanlines, rawOffset + 1, rgbaOffset, rgbaOffset + rowBytes);
  }
  const compressedData = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);

  // 4. IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderRitmoIcon(size) {
  const buf = Buffer.alloc(size * size * 4);

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

  // Rounded rectangle signed distance
  function roundedRectDist(x, y, rx, ry, rw, rh, rad) {
    const cx = Math.max(rx + rad, Math.min(x, rx + rw - rad));
    const cy = Math.max(ry + rad, Math.min(y, ry + rh - rad));
    const dx = x - cx;
    const dy = y - cy;
    return Math.sqrt(dx * dx + dy * dy) - rad;
  }

  const cornerRadius = size * (112 / 512);

  // 1. Draw PURE WHITE Base Squircle Canvas
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = roundedRectDist(x, y, 0, 0, size, size, cornerRadius);
      if (d <= 0.5) {
        const factor = Math.max(0, Math.min(1, 0.5 - d));
        // Pure crisp white canvas with subtle border near edge
        if (d > -2.0) {
          // Subtle border #e6e8f0
          setPixel(x, y, 230, 232, 240, Math.round(255 * factor));
        } else {
          setPixel(x, y, 255, 255, 255, Math.round(255 * factor));
        }
      }
    }
  }

  // 2. Calendar Card Coordinates
  const cardX = size * (84 / 512);
  const cardY = size * (100 / 512);
  const cardW = size * (344 / 512);
  const cardH = size * (320 / 512);
  const cardRad = size * (38 / 512);

  // Soft Drop Shadow on White Canvas
  const shadowSpread = size * (22 / 512);
  for (let y = Math.floor(cardY - 4); y < Math.ceil(cardY + cardH + shadowSpread + 8); y++) {
    for (let x = Math.floor(cardX - shadowSpread); x < Math.ceil(cardX + cardW + shadowSpread); x++) {
      const d = roundedRectDist(x, y - (size * (12 / 512)), cardX, cardY, cardW, cardH, cardRad);
      if (d > 0 && d <= shadowSpread) {
        const intensity = Math.pow(1 - d / shadowSpread, 2) * 0.16;
        // Shadow with a touch of Ritmo purple: #1e1644
        setPixel(x, y, 30, 22, 68, Math.round(255 * intensity));
      }
    }
  }

  // 3. Elevated Calendar Card Body (Sleek Deep Ink Container that makes colors shine)
  for (let y = Math.floor(cardY); y < Math.ceil(cardY + cardH); y++) {
    for (let x = Math.floor(cardX); x < Math.ceil(cardX + cardW); x++) {
      const d = roundedRectDist(x, y, cardX, cardY, cardW, cardH, cardRad);
      if (d <= 0.5) {
        const alpha = Math.max(0, Math.min(1, 0.5 - d));
        const isHeader = y < cardY + size * (72 / 512);
        if (isHeader) {
          // Header banner accent #2c255c
          setPixel(x, y, 44, 37, 92, Math.round(255 * alpha));
        } else {
          // Card body #121028
          setPixel(x, y, 18, 16, 40, Math.round(255 * alpha));
        }
      }
    }
  }

  // Helper for pills / rounded rects
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

  // 4. Binder Rings at top: Ritmo Purple (#6558f5) & Mint Green (#46a978)
  drawPill(size * (154 / 512), size * (82 / 512), size * (22 / 512), size * (38 / 512), size * (11 / 512), 101, 88, 245);
  drawPill(size * (336 / 512), size * (82 / 512), size * (22 / 512), size * (38 / 512), size * (11 / 512), 70, 169, 120);

  // 5. Semantic Color Dots (Red, Orange, Yellow, Green, Blue)
  drawCircle(size * (196 / 512), size * (136 / 512), size * (6.5 / 512), 255, 93, 99);   // #ff5d63 Red
  drawCircle(size * (226 / 512), size * (136 / 512), size * (6.5 / 512), 242, 166, 65);  // #f2a641 Orange
  drawCircle(size * (256 / 512), size * (136 / 512), size * (6.5 / 512), 231, 201, 74);  // #e7c94a Yellow
  drawCircle(size * (286 / 512), size * (136 / 512), size * (6.5 / 512), 70, 169, 120);  // #46a978 Green
  drawCircle(size * (316 / 512), size * (136 / 512), size * (6.5 / 512), 76, 154, 245);  // #4c9af5 Blue

  // 6. Subtle Matrix of Activity Chips
  drawPill(size * (116 / 512), size * (196 / 512), size * (76 / 512), size * (16 / 512), size * (8 / 512), 255, 93, 99, 0.22);
  drawPill(size * (204 / 512), size * (196 / 512), size * (104 / 512), size * (16 / 512), size * (8 / 512), 101, 88, 245, 0.22);
  drawPill(size * (320 / 512), size * (196 / 512), size * (76 / 512), size * (16 / 512), size * (8 / 512), 70, 169, 120, 0.22);

  // 7. Dynamic Rhythm Pulse Wave Overlay
  const points = [
    [size * (106 / 512), size * (294 / 512)],
    [size * (178 / 512), size * (294 / 512)],
    [size * (204 / 512), size * (256 / 512)],
    [size * (228 / 512), size * (344 / 512)],
    [size * (264 / 512), size * (200 / 512)],
    [size * (298 / 512), size * (356 / 512)],
    [size * (324 / 512), size * (294 / 512)],
    [size * (406 / 512), size * (294 / 512)],
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

  const lineWidth = size * (9.5 / 512);
  const glowWidth = size * (24 / 512);

  for (let y = Math.floor(cardY); y < Math.ceil(cardY + cardH); y++) {
    for (let x = Math.floor(cardX); x < Math.ceil(cardX + cardW); x++) {
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

  // 8. Luminous Apex Pulse Highlight on Peak
  drawCircle(size * (264 / 512), size * (200 / 512), size * (9 / 512), 255, 255, 255, 1);
  drawCircle(size * (264 / 512), size * (200 / 512), size * (5 / 512), 70, 169, 120, 1);

  return encodePNG(size, size, buf);
}

// Generate PNG Icons
const icon192 = renderRitmoIcon(192);
const icon512 = renderRitmoIcon(512);

fs.writeFileSync(path.join(__dirname, '../public/icons/icon-192.png'), icon192);
fs.writeFileSync(path.join(__dirname, '../public/icons/icon-512.png'), icon512);
fs.writeFileSync(path.join(__dirname, '../public/icon-192.png'), icon192);
fs.writeFileSync(path.join(__dirname, '../public/icon-512.png'), icon512);

console.log('PNG Icons successfully generated with white canvas background!');
