const { Jimp } = require('jimp');
const fs = require('fs');

async function main() {
  fs.mkdirSync('resources', { recursive: true });

  // Create an icon (1024x1024)
  const icon = new Jimp({ width: 1024, height: 1024, color: 0xFF0000FF });
  await icon.write('resources/icon.png');

  // Create a splash (2732x2732)
  const splash = new Jimp({ width: 2732, height: 2732, color: 0x00FF00FF });
  await splash.write('resources/splash.png');

  console.log('Images generated with Jimp!');
}

main().catch(console.error);
