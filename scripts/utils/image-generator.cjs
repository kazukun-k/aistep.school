const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

// Paths
const resourcesDir = path.join(__dirname, '..', 'resources');
const fontsDir = path.join(resourcesDir, 'fonts');
const bgDir = path.join(resourcesDir, 'backgrounds');

const FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/sawarabigothic/SawarabiGothic-Regular.ttf";
const FONT_PATH = path.join(fontsDir, 'SawarabiGothic-Regular.ttf');

const BG_URLS = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&h=630&q=80", // Tech workspace
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80", // Charts/Laptop
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&h=630&q=80", // Working at laptop
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&h=630&q=80", // Team working
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=630&q=80", // Network/Abstract tech
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=630&q=80", // Microchip/Technology
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&h=630&q=80", // Code on screen/Digital
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&h=630&q=80", // Laptop/Modern workspace
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&h=630&q=80", // Cyber security/Tech
  "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1200&h=630&q=80"  // Tech equipment/Programming
];

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

// Ensure fonts and backgrounds exist
async function ensureResources() {
  // 1. Download Font if missing
  if (!fs.existsSync(FONT_PATH)) {
    console.log("Font not found. Downloading Sawarabi Gothic...");
    await downloadFile(FONT_URL, FONT_PATH);
  }
  
  // Register font
  GlobalFonts.registerFromPath(FONT_PATH, 'SawarabiGothic');

  // 2. Download Backgrounds if missing
  if (!fs.existsSync(bgDir) || fs.readdirSync(bgDir).length < BG_URLS.length) {
    console.log("Background templates not found. Downloading backgrounds from Unsplash...");
    for (let i = 0; i < BG_URLS.length; i++) {
      const bgPath = path.join(bgDir, `bg-${i + 1}.jpg`);
      if (!fs.existsSync(bgPath)) {
        await downloadFile(BG_URLS[i], bgPath);
      }
    }
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
 * Generates an eyecatch image with text overlay on a random background.
 * @param {string} category - The category of the article (e.g. "プロンプト")
 * @param {string} text - Catchphrase with optional newlines (e.g. "AIとプロンプトで瞬時に\n箇条書きが\n「神文章」に！")
 * @param {string} outputPath - Path to write the output image (e.g. "public/images/output.png")
 */
async function generateEyecatch(category, text, outputPath) {
  await ensureResources();

  // 1. Pick a random background
  const bgFiles = fs.readdirSync(bgDir).filter(file => file.endsWith('.jpg'));
  if (bgFiles.length === 0) throw new Error("No background images available.");
  const randomBg = bgFiles[Math.floor(Math.random() * bgFiles.length)];
  const bgPath = path.join(bgDir, randomBg);

  // 2. Load background image
  const bgImg = await loadImage(bgPath);

  // 3. Create canvas
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Draw background image
  ctx.drawImage(bgImg, 0, 0, 1200, 630);

  // 4. Draw central white card with shadow
  const cardW = 820;
  const cardH = 390;
  const cardX = (1200 - cardW) / 2;
  const cardY = (630 - cardH) / 2 + 10; // Slightly shifted down for a balanced look

  ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  // Disable shadow for text/inner elements
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Add subtle border to the card
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // 5. Draw Category Pill
  ctx.font = 'bold 20px SawarabiGothic';
  const catText = category.trim();
  const textWidth = ctx.measureText(catText).width;
  const pillW = textWidth + 36;
  const pillH = 40;
  const pillX = 600 - pillW / 2;
  const pillY = cardY + 40;

  ctx.fillStyle = 'rgba(99, 102, 241, 0.1)'; // Light indigo
  drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 20);
  ctx.fill();

  ctx.fillStyle = 'rgb(79, 70, 229)'; // Indigo 600
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(catText, 600, pillY + pillH / 2);

  // 6. Draw Catchphrase Text lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (lines.length === 3) {
    // Line 1: Sub-header (Amber)
    ctx.font = 'bold 28px SawarabiGothic';
    ctx.fillStyle = 'rgb(217, 119, 6)'; // Amber 600
    ctx.fillText(lines[0], 600, cardY + 145);

    // Line 2: Main title (Slate)
    ctx.font = 'bold 46px SawarabiGothic';
    ctx.fillStyle = 'rgb(15, 23, 42)'; // Slate 900
    ctx.fillText(lines[1], 600, cardY + 225);

    // Line 3: Main title (Slate)
    ctx.fillText(lines[2], 600, cardY + 300);
  } 
  else if (lines.length === 2) {
    // Line 1: Sub-header (Amber)
    ctx.font = 'bold 28px SawarabiGothic';
    ctx.fillStyle = 'rgb(217, 119, 6)'; // Amber 600
    ctx.fillText(lines[0], 600, cardY + 160);

    // Line 2: Main title (Slate)
    ctx.font = 'bold 50px SawarabiGothic';
    ctx.fillStyle = 'rgb(15, 23, 42)'; // Slate 900
    ctx.fillText(lines[1], 600, cardY + 255);
  } 
  else if (lines.length > 0) {
    // Single line or default: Center it vertically (Slate)
    ctx.font = 'bold 50px SawarabiGothic';
    ctx.fillStyle = 'rgb(15, 23, 42)'; // Slate 900
    ctx.fillText(lines[0], 600, cardY + 215);
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
