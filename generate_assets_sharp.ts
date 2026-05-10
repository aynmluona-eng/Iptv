import sharp from 'sharp';
import fs from 'fs';

const tvSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="200" fill="#D4F933" />
  <g transform="translate(262, 312)" stroke="#000" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="50" y="100" width="400" height="250" rx="40" />
    <path d="M150 100 L250 20 M350 100 L250 20" />
  </g>
</svg>`;

const splashSvg = `<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#D4F933" />
  <g transform="translate(1116, 1166)" stroke="#000" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <rect x="50" y="100" width="400" height="250" rx="40" />
    <path d="M150 100 L250 20 M350 100 L250 20" />
  </g>
</svg>`;

async function main() {
  fs.mkdirSync('resources', { recursive: true });
  
  await sharp(Buffer.from(tvSvg))
    .png()
    .toFile('resources/icon.png');
    
  await sharp(Buffer.from(splashSvg))
    .png()
    .toFile('resources/splash.png');
    
  console.log("Images generated with sharp successfully!");
}

main().catch(console.error);
