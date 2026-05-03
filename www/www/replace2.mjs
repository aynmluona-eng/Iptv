import fs from 'fs';
import path from 'path';

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Change bg-brand text-white -> bg-brand text-black
  content = content.replace(/bg-brand text-white/g, 'bg-brand text-black');
  
  // Also any bg-brand group-hover:text-white -> ...text-black
  content = content.replace(/group-hover:bg-brand group-hover:text-white/g, 'group-hover:bg-brand group-hover:text-black');
  
  // any border-brand/ something
  content = content.replace(/hover:bg-brand text-white/g, 'hover:bg-brand text-white hover:text-black');

  // Let's remove rounded-3xl and use standard flat or slightly rounded to fit the modern sports look
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  content = content.replace(/rounded-2xl/g, 'rounded-sm');
  content = content.replace(/rounded-xl/g, 'rounded-sm');
  content = content.replace(/rounded-lg/g, 'rounded-sm');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
