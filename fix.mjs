import fs from 'fs';

let m = fs.readFileSync('src/pages/Movies.tsx', 'utf8');
m = m.replace('bg-brand text-black text-white shadow-lg', 'bg-brand text-black shadow-lg');
m = m.replace('bg-white text-brand rounded-full', 'bg-brand text-black rounded-full');
// also fix search input to have brand border
m = m.replace('focus:border-brand', 'focus:border-brand');
fs.writeFileSync('src/pages/Movies.tsx', m);

let s = fs.readFileSync('src/pages/Series.tsx', 'utf8');
s = s.replace('bg-brand text-black text-white shadow-lg', 'bg-brand text-black shadow-lg');
s = s.replace('bg-white text-brand rounded-full', 'bg-brand text-black rounded-full');
fs.writeFileSync('src/pages/Series.tsx', s);

let sd = fs.readFileSync('src/pages/SeriesDetails.tsx', 'utf8');
sd = sd.replace('bg-white text-brand shadow-md', 'bg-brand text-black shadow-md');
fs.writeFileSync('src/pages/SeriesDetails.tsx', sd);

console.log('Fixed');
