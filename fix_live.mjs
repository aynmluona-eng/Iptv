import fs from 'fs';

let f = fs.readFileSync('src/pages/Live.tsx', 'utf8');
f = f.replace('bg-brand text-black text-white shadow-lg', 'bg-brand text-black shadow-lg');
f = f.replace('rounded-full text-sm', 'rounded-sm text-sm');
fs.writeFileSync('src/pages/Live.tsx', f);

console.log('Fixed Live');
