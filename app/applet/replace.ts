import fs from 'fs';
import path from 'path';

const walk = (dir: string) => {
  let results: string[] = [];
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

  // Colors
  content = content.replace(/bg-\[#0D111A\]/g, 'bg-dark');
  content = content.replace(/from-\[#0D111A\]/g, 'from-dark');
  content = content.replace(/via-\[#0D111A\]/g, 'via-dark');
  content = content.replace(/to-\[#0D111A\]/g, 'to-dark');
  content = content.replace(/bg-\[#131824\]/g, 'bg-panel');
  content = content.replace(/bg-gradient-to-[a-z]+ from-\[#0D111A\] via-\[#0D111A\]\/[0-9]+ to-transparent/g, 'bg-gradient-to-t from-dark to-transparent');
  content = content.replace(/bg-gradient-to-[a-z]+ from-\[#0D111A\] via-transparent to-transparent/g, 'bg-gradient-to-t from-dark to-transparent');
  content = content.replace(/bg-gradient-to-[a-z]+ from-\[#1A2235\] to-\[#131824\]/g, 'bg-panel');
  content = content.replace(/bg-gradient-brand/g, 'bg-brand');
  content = content.replace(/bg-gradient-to-br from-blue-500\/20 to-blue-600\/5/g, 'bg-panel-hover');
  content = content.replace(/bg-gradient-to-br from-purple-500\/20 to-purple-600\/5/g, 'bg-panel-hover');
  content = content.replace(/from-\[#1A2235\] to-\[#131824\]/g, 'bg-panel');
  content = content.replace(/bg-\[#1A2235\]/g, 'bg-panel');
  content = content.replace(/bg-\[#131824\]\/50/g, 'bg-panel hover:bg-panel-hover');
  content = content.replace(/bg-\[#131824\]\/80/g, 'bg-panel hover:bg-panel-hover');
  content = content.replace(/mix-blend-screen/g, '');
  content = content.replace(/mix-blend-multiply/g, '');
  content = content.replace(/mix-blend-overlay/g, '');
  content = content.replace(/bg-gradient-to-r from-brand\/20 to-blue-600\/20/g, 'bg-black/30');
  content = content.replace(/text-brand-light/g, 'text-gray-300'); // Netflix uses a lot of white/gray text instead of colored
  content = content.replace(/drop-shadow-lg/g, '');
  content = content.replace(/drop-shadow-xl/g, '');
  content = content.replace(/drop-shadow-md/g, '');
  content = content.replace(/drop-shadow-sm/g, '');
  content = content.replace(/shadow-\[0_0_20px_rgba\(123,63,242,0\.3\)\]/g, '');
  content = content.replace(/shadow-\[0_0_30px_rgba\(123,63,242,0\.3\)\]/g, '');
  content = content.replace(/shadow-\[0_0_30px_rgba\(123,63,242,0\.4\)\]/g, '');
  content = content.replace(/shadow-\[0_10px_30px_-15px_rgba\(123,63,242,0\.4\)\]/g, '');
  content = content.replace(/shadow-lg shadow-brand\/10/g, '');
  content = content.replace(/shadow-lg shadow-brand\/20/g, '');
  content = content.replace(/shadow-lg shadow-[a-z]+\/10/g, '');
  content = content.replace(/shadow-lg/g, 'shadow-md');
  content = content.replace(/border-brand\/30/g, 'border-brand');
  content = content.replace(/border-brand\/40/g, 'border-brand');
  content = content.replace(/border-brand\/50/g, 'border-brand');
  
  // Replace the big background blur circles (AI style) which are defined with blur-[120px] and blur-[100px]
  content = content.replace(/<div className="absolute top-0 right-0 w-\[40rem\] h-\[40rem\].*?><\/div>\s*/g, '');
  content = content.replace(/<div className="absolute top-1\/2 left-0 w-\[30rem\] h-\[30rem\].*?><\/div>\s*/g, '');
  content = content.replace(/<div className="absolute top-0 right-0 w-32 h-32 bg-[a-z]+-500\/10 rounded-full blur-\[40px\].*?><\/div>\s*/g, '');
  content = content.replace(/<div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-[a-z-]+ from-[a-z]+\/10 to-transparent pointer-events-none"><\/div>\s*/g, '');

  // specific gradient on profile header
  content = content.replace(/bg-gradient-to-br from-brand\/80 to-secondary\/80/g, 'bg-dark border-b border-panel');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
