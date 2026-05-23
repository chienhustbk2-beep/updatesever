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

function fixFile(content) {
  let r = content;

  // 1. Fix comment-eats-code: "// text; function/const/export keyword" → separate lines
  r = r.replace(/\/\/[^;]*?;\s*(function|const|let|var|export|async|interface|type|class|import|return)\b/g,
    (match) => {
      // If the comment is just a comment with a semicolon in it, split it
      const semiIdx = match.indexOf(';');
      const comment = match.substring(0, semiIdx);
      const rest = match.substring(semiIdx + 1);
      return comment + '\n' + rest.trim();
    }
  );

  // Also fix: comment that ate a statement without semicolon between them
  // "// text\nconst" that was merged to "// text; const"
  r = r.replace(/\/\/\s*([^;]+);\s+(function|const|let|var|export|async|interface|type)\b/g,
    '// $1\n$2');

  // 2. Fix "as; const" → "as const"
  r = r.replace(/as;\s+const/g, 'as const');

  // 3. Fix "await; import" → "await import"
  r = r.replace(/await;\s+import/g, 'await import');

  // 4. Fix "});if" → "}); if" (add space)
  r = r.replace(/\}\);if\b/g, '}); if');

  // 5. Fix ") };if" → "}); if"
  r = r.replace(/\)\s*\};\s*if\b/g, '}); if');

  // 6. Fix ");if" → "); if" (add space)
  r = r.replace(/\);if\b/g, '); if');

  // 7. Fix statements that should have ; between them on the same line
  // Pattern: "expression) expression(" or "]} expression("
  // These need careful handling - add semicolons between independent statements

  // 8. Fix interface/type members that are missing semicolons
  // This is tricky because we don't want to break JSX or function parameters
  // Pattern inside interfaces: "name: string name2:" → "name: string; name2:"
  // Only inside interface/type blocks
  r = r.replace(/(interface\s+\w+\s*\{[^}]*?)(\w+\s*:\s*(?:string|number|boolean|Date|any|void|null|undefined|never|unknown|\[\]|\{[^}]*\}|Record\s*<[^>]*>|\w+(?:<[^>]*>)?))\s+(\w+\s*:)/g,
    '$1$2; $3');

  // 9. Fix }) followed by keyword on same line → add newline
  r = r.replace(/\)\s*\}\s+(const|let|var|function|async|export|if|for|while|switch|try|return|throw|class|import)\b/g,
    '});\n$1');

  // 10. Fix )}const (no space) → )};\nconst
  r = r.replace(/\)\}const/g, '});\nconst');
  r = r.replace(/\)\}let/g, '});\nlet');
  r = r.replace(/\)\}if/g, '});\nif');
  r = r.replace(/\)\}return/g, '});\nreturn');
  r = r.replace(/\)\}export/g, '});\nexport');
  r = r.replace(/\)\}async/g, '});\nasync');

  // 11. Fix return ... } where there's no semicolon on the same line
  r = r.replace(/return\s+([^;]+?)\}\s+(const|let|var|if|for|while|switch|try|async|export|function|return|throw|class)\b/g,
    'return $1}\n$2');

  // 12. Remove duplicate semicolons
  while (r.includes(';;')) r = r.replace(';;', ';');

  // 13. Fix specific patterns in the corrupted comment+code merges
  // "// ...; function name() {" → comment and function on separate lines
  r = r.replace(/\/\/[^;]*?;\s*(function\s+\w+\s*\([^)]*\)\s*(?::{[\s\S]*?)?\{)/g,
    (match) => {
      const semiIdx = match.indexOf(';');
      return match.substring(0, semiIdx) + '\n' + match.substring(semiIdx + 1).trim();
    });

  return r;
}

let fixed = 0;
for (const fp of files) {
  let content = fs.readFileSync(fp, 'utf8');
  const orig = content;
  content = fixFile(content);
  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    fixed++;
    console.log('Fixed: ' + fp);
  }
}

console.log('Fixed ' + fixed + ' files.');
