const fs = require('fs');

let s = fs.readFileSync('src/components/ImageWithFallback.tsx', 'utf8');

const regexClean = `
          const cleanName = alt.replace(/^\\s*(\\d+|\\w+)[\\.\\|\\-:]\\s*/i, '').trim();
          let searchQuery = type === 'live' ? cleanName + ' (TV channel)' : alt;
`;

s = s.replace(/const searchQuery = type === 'live' \? `\$\{alt\} \(TV channel\)` : alt;/, regexClean);

s = s.replace(/const res2 = await fetch\(`https:\/\/en\.wikipedia\.org\/api\/rest_v1\/page\/summary\/\$\{encodeURIComponent\(alt\.replace\(\/ \/g, '_'\)\)\}`\);/g, "const res2 = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName.replace(/ /g, '_'))}`);");

// Just replace the final fallback part to include UI-Avatars
const newFinalFallback = `
                   const uiAvatar = \`https://ui-avatars.com/api/?name=\${encodeURIComponent(cleanName || alt)}&background=random&color=fff&size=256\`;
                   setCurrentSrc(uiAvatar);
                   setError(false);
                   setIsSearching(false);
`;

s = s.replace(/setIsSearching\(false\);\n\s*\}\n\s*\}\n\s*\} else \{\n\s*setIsSearching\(false\);\n\s*\}/g, '          ' + newFinalFallback + '\n                }\n             }\n          } else {\n             ' + newFinalFallback + '\n          }');

fs.writeFileSync('src/components/ImageWithFallback.tsx', s);
