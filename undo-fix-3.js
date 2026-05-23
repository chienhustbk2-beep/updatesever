const fs = require('fs');
const path = require('path');

const SRC = 'src';

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) files.push(p);
  }
}
walk(SRC);

// Only fix route files (API routes) which have consistent corruption patterns
const routeFiles = files.filter(f => f.includes('\\route.ts') || f.includes('/route.ts'));

let fixed = 0;
for (const fp of routeFiles) {
  let content = fs.readFileSync(fp, 'utf8');
  const orig = content;
  let r = content;

  // 1. Fix comments that ate the next code line
  // Pattern: "// text; keyword" where keyword should be on next line
  r = r.replace(/\/\/[^\n]*?;\s*(function|const|let|var|export|async|interface|type|class|if|for|while|switch|return)\b/g,
    (match) => {
      const semiIdx = match.indexOf(';');
      const afterSemi = match.substring(semiIdx + 1).trim();
      // If afterSemi starts with a keyword, split
      if (/^(function|const|let|var|export|async|interface|type|class|if|for|while|switch|return)\b/.test(afterSemi)) {
        return match.substring(0, semiIdx) + '\n' + afterSemi;
      }
      return match;
    }
  );

  // 2. Fix "return ... }); if/const" → add newline
  r = r.replace(/return\s+([^;]*?\)\s*\))\s*;?\s*(if|const|let|var|async|export|function|for|while|switch|try|return|throw)\b/g,
    'return $1;\n$2');

  // 3. Fix "return ... });  if/const" (with space)
  r = r.replace(/return\s+([^;]*?\)\s*\))\s*;?\s*;\s*(if|const|let|var|async|export|function|for|while|switch|try|return|throw)\b/g,
    'return $1;\n$2');

  // 4. Fix "return ... }) }; if/const" → "return ... });\nif/const"
  r = r.replace(/return\s+([^;]*?\})\s*\)\s*;\s*(if|const|let|var|async|export|function|for|while|switch|try|return|throw)\b/g,
    'return $1);\n$2');

  // 5. Fix "}); if" → "});\nif"
  r = r.replace(/\)\};\s*(if|const|let|var|export|async|function|for|while|switch|try|return)\b/g,
    '});\n$1');

  // 6. Fix ")} if" → ")}\nif"  
  r = r.replace(/\)\}\s*(if|const|let|var|export|async|function|for|while|switch|try|return)\b/g,
    ')}\n$1');

  // 7. Fix "} if" → "}\nif" (when a closing brace is followed by if on same line)
  r = r.replace(/}\s*if\s*\(/g, '}\nif (');

  // 8. Fix ");if" → ");\nif"
  r = r.replace(/\);\s*if\s*\(/g, ');\nif (');

  // 9. Fix "return ... ) }" without semicolon → add semicolon
  r = r.replace(/return\s+([^;]+?\)\s*\))\s*\n/g, 'return $1;\n');

  // 10. Fix "} export async" → "}\nexport async"
  r = r.replace(/}\s*export\s+async\s+function/g, '}\nexport async function');

  // 11. Remove duplicate semicolons
  while (r.includes(';;;')) r = r.replace(';;;', ';');
  while (r.includes(';;')) r = r.replace(';;', ';');

  // 12. Fix "} ;" → "}"
  r = r.replace(/}\s*;/g, '}');

  if (r !== orig) {
    fs.writeFileSync(fp, r, 'utf8');
    fixed++;
    console.log('Fixed route: ' + fp);
  }
}

console.log('Fixed ' + fixed + ' route files.');
