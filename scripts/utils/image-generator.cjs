const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

// Paths
const resourcesDir = path.join(__dirname, '..', 'resources');
const fontsDir = path.join(resourcesDir, 'fonts');

// Using Zen Kaku Gothic New Bold for higher quality Japanese typography
const FONT_URL = "https://github.com/google/fonts/raw/main/ofl/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf";
const FONT_PATH = path.join(fontsDir, 'zen-kaku-gothic-new-bold.ttf');

// Helper to download a file
async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
  console.log(`Successfully downloaded: ${destPath}`);
}

// Ensure fonts resource exists and register it
async function ensureResources() {
  if (!fs.existsSync(FONT_PATH)) {
    console.log("Font not found. Downloading Zen Kaku Gothic New Bold...");
    await downloadFile(FONT_URL, FONT_PATH);
  }
  
  // Register font for canvas use
  try {
    GlobalFonts.registerFromPath(FONT_PATH, 'ZenKakuGothicNew');
  } catch (err) {
    console.error("Failed to register font:", err);
  }
}

// Rounded rectangle helper
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generates an eyecatch image with text overlay on a beautiful gradient background.
 * @param {string} category - The category of the article (e.g. "プロンプト")
 * @param {string} text - Catchphrase with optional newlines (e.g. "AIとプロンプトで瞬時に\n箇条書きが\n「神文章」に！")
 * @param {string} outputPath - Path to write the output image (e.g. "public/images/output.png")
 */
async function generateEyecatch(category, text, outputPath) {
  await ensureResources();

  // 1. Create canvas (standard OGP size)
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // 2. Draw Premium Dark Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#0b0f19');   // Deepest dark blue
  bgGrad.addColorStop(0.5, '#1e1b4b'); // Deep indigo
  bgGrad.addColorStop(1, '#2e1065');   // Dark violet
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // 3. Draw Glow effects (Screen blend)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // Cyan neon glow at top-right
  const cyanGlow = ctx.createRadialGradient(1050, 150, 0, 1050, 150, 500);
  cyanGlow.addColorStop(0, 'rgba(6, 182, 212, 0.12)'); // Cyan 500
  cyanGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = cyanGlow;
  ctx.beginPath();
  ctx.arc(1050, 150, 500, 0, Math.PI * 2);
  ctx.fill();

  // Violet neon glow at bottom-left
  const violetGlow = ctx.createRadialGradient(150, 480, 0, 150, 480, 500);
  violetGlow.addColorStop(0, 'rgba(168, 85, 247, 0.15)'); // Purple 500
  violetGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = violetGlow;
  ctx.beginPath();
  ctx.arc(150, 480, 500, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();

  // 4. Draw Central Glassmorphism Card
  const cardW = 980;
  const cardH = 440;
  const cardX = (1200 - cardW) / 2;
  const cardY = (630 - cardH) / 2;

  // Card shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 20;

  // Semi-transparent card fill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; // Dark Slate semi-transparent
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.fill();
  ctx.restore();

  // Subtle gradient border on card
  const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  borderGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.1)'); // Indigo
  borderGrad.addColorStop(1, 'rgba(6, 182, 212, 0.35)');   // Cyan
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
  ctx.stroke();

  // 5. Draw Category Pill
  const catText = category.trim();
  
  // Set font temporarily to measure
  ctx.font = 'bold 18px ZenKakuGothicNew';
  const textWidth = ctx.measureText(catText).width;
  const pillW = textWidth + 36;
  const pillH = 38;
  const pillX = 600 - pillW / 2;
  const pillY = cardY + 45;

  // Pill background
  ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 19);
  ctx.fill();
  
  // Pill border (Cyan)
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 19);
  ctx.stroke();

  // Pill text
  ctx.fillStyle = '#22d3ee'; // Cyan 400
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(catText, 600, pillY + pillH / 2);

  // 6. Draw Catchphrase Text with Wrapping & Auto-scaling
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const maxWidth = 860; // Max width for text lines inside card
  let fontSize = 48;
  ctx.font = `bold ${fontSize}px ZenKakuGothicNew`;

  let processedLines = [];
  
  // Wrapping logic
  function computeWrappedLines(linesArray, size) {
    ctx.font = `bold ${size}px ZenKakuGothicNew`;
    const wrapped = [];
    for (const rawLine of linesArray) {
      const chars = rawLine.split('');
      let line = '';
      for (let n = 0; n < chars.length; n++) {
        let testLine = line + chars[n];
        let testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && n > 0) {
          wrapped.push(line);
          line = chars[n];
        } else {
          line = testLine;
        }
      }
      wrapped.push(line);
    }
    return wrapped;
  }

  processedLines = computeWrappedLines(rawLines, fontSize);

  // Dynamically shrink font size if text takes too many lines
  if (processedLines.length > 3) {
    fontSize = 40;
    processedLines = computeWrappedLines(rawLines, fontSize);
  }
  if (processedLines.length > 4) {
    fontSize = 32;
    processedLines = computeWrappedLines(rawLines, fontSize);
  }

  // Draw final wrapped lines
  ctx.font = `bold ${fontSize}px ZenKakuGothicNew`;
  ctx.fillStyle = '#ffffff';
  
  const lineHeight = fontSize * 1.45;
  const totalHeight = processedLines.length * lineHeight;
  
  // Vertical center of the remaining space in the card
  const textSpaceTop = pillY + pillH + 25;
  const textSpaceBottom = cardY + cardH - 45;
  const textSpaceCenter = textSpaceTop + (textSpaceBottom - textSpaceTop) / 2;
  const startY = textSpaceCenter - (totalHeight / 2) + lineHeight / 2;

  for (let i = 0; i < processedLines.length; i++) {
    const lineY = startY + i * lineHeight;
    ctx.fillText(processedLines[i], 600, lineY);
  }

  // 7. Write output file
  const buffer = canvas.toBuffer('image/png');
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated eyecatch: ${outputPath}`);
}

module.exports = {
  generateEyecatch,
  ensureResources
};
