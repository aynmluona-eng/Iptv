import fs from 'fs';
import path from 'path';

const resDir = path.join(process.cwd(), 'android/app/src/main/res');

fs.readdirSync(resDir).forEach(dir => {
  if (dir.startsWith('mipmap-')) {
    fs.rmSync(path.join(resDir, dir), { recursive: true, force: true });
  }
});
console.log('Mipmap directories deleted.');
