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

let fixed = 0;
for (const fp of files) {
  let content = fs.readFileSync(fp, 'utf8');
  const orig = content;
  let r = content;

  // 1. Fix }}}); if → });\nif (triple brace corruption)
  r = r.replace(/}}}\s*\)\s*;\s*(if|const|let|var|export|async|function|for|while|switch|try|return)\b/g, '});\n$1');

  // 2. Fix }}); if → });\nif (double brace corruption) 
  r = r.replace(/}}\s*\)\s*;\s*(if|const|let|var|export|async|function|for|while|switch|try|return)\b/g, '});\n$1');

  // 3. Fix }}); → });
  r = r.replace(/}}\s*\)\s*;/g, '});');

  // 4. Fix }});const → });
  r = r.replace(/}}\s*\)\s*;?\s*const\b/g, '});\nconst');

  // 5. Fix }});if → });\nif  
  r = r.replace(/}}\s*\)\s*;?\s*if\b/g, '});\nif');

  // 6. Fix "}})" → "})" (extra closing brace)
  r = r.replace(/}}\s*\)/g, '})');

  // 7. Fix comment-eats-code: find any line that starts with // and contains ; followed by non-comment code
  // Pattern: "// some text; keyword" on same line, where keyword is not part of comment
  r = r.replace(/^(\s*\/\/[^;]*?);\s*(function|const|let|var|export|async|interface|type|class|if|for|while|switch|return)\b/gm,
    '$1\n$2');

  // 8. Fix "text;if" at start of line (comment corruption where code leaked out of comment)
  r = r.replace(/^(\s*);\s*if\s+(\w+)\s+/gm, '$1// if $2 ');

  // 9. Fix orphaned "if keyword..." at start of line (was part of comment)
  r = r.replace(/^\s*if\s+(?!\()(\w+(?:\s+\w+)*)\s*;\s*$/gm, '// if $1');

  // 10. Fix "} export async function" on same line → add newline
  r = r.replace(/}\s*export\s+async\s+function/g, '}\nexport async function');

  // 11. Fix "} export function" on same line → add newline
  r = r.replace(/}\s*export\s+function/g, '}\nexport function');

  // 12. Fix "} export const" on same line
  r = r.replace(/}\s*export\s+const/g, '}\nexport const');

  // 13. Fix "await; import" → "await import" (only if still present)
  r = r.replace(/await;\s*import/g, 'await import');

  // 14. Fix multi-line comments that lost their //
  r = r.replace(/\/\/\s*\n\s*if\s+(?!\()/g, '// if ');

  // 15. Fix "as; const" → "as const"
  r = r.replace(/as;\s+const\b/g, 'as const');

  // 16. Add missing semicolons before interface/type definitions that follow code
  r = r.replace(/}\s*interface\b/g, '};\ninterface');
  r = r.replace(/}\)\s*interface\b/g, '});\ninterface');

  // 17. Fix JSX attribute corruption: id="name";type="text" → id="name" type="text"
  r = r.replace(/=\s*"([^"]*)"\s*;\s*(\w+=)/g, '="$1" $2');

  // 18. Remove double semicolons
  while (r.includes(';;;')) r = r.replace(';;;', ';');
  while (r.includes(';;')) r = r.replace(';;', ';');

  // 19. Fix }export (no space) → }\nexport
  r = r.replace(/}(export)\b/g, '}\n$1');

  if (r !== orig) {
    fs.writeFileSync(fp, r, 'utf8');
    fixed++;
    console.log('Fixed: ' + fp);
  }
}

console.log('Fixed ' + fixed + ' files.');
