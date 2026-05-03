import fs from 'fs';

let f = fs.readFileSync('src/pages/Favorites.tsx', 'utf8');
f = f.replace('bg-brand text-black text-white shadow-lg', 'bg-brand text-black shadow-lg');
f = f.replace('rounded-full', 'rounded-sm');
fs.writeFileSync('src/pages/Favorites.tsx', f);

console.log('Fixed Favorites');
