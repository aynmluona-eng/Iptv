import fs from 'fs';
import path from 'path';
import https from 'https';

const downloadFile = (url: string, dest: string) => {
  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  const resourcesDir = path.join(process.cwd(), 'resources');
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir);
  }
  
  await downloadFile('https://dummyimage.com/1024x1024/d4f933/000000.png&text=Tfaarj', path.join(resourcesDir, 'icon.png'));
  await downloadFile('https://dummyimage.com/2732x2732/d4f933/000000.png&text=Tfaarj', path.join(resourcesDir, 'splash.png'));
  
  console.log('Images downloaded.');
}

main().catch(console.error);
