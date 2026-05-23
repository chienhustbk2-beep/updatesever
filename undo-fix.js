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

  // 1. Remove ; after export when followed by keyword
  content = content.replace(/export;\s*(async|default|const|function|class|interface|type|enum|let|var|import|namespace|abstract)\b/g, 'export $1');

  // 2. Remove ; after default when followed by keyword  
  content = content.replace(/default;\s*(function|async|class|const|let|var|export)\b/g, 'default $1');

  // 3. Remove ; after async when followed by function
  content = content.replace(/async;\s*function\b/g, 'async function');

  // 4. Fix if(...);return -> if(...) return
  content = content.replace(/if\s*\(([^)]*)\)\s*;\s*(return|null|throw|continue|break)\b/g, 'if ($1) $2');

  // 5. Fix });keyword -> });\nkeyword (restore newlines after return statements)
  content = content.replace(/}\)\s*;(async|export|const|let|var|function|if|for|while|switch|try|return|throw|class|import)\b/g, '});\n$1');

  // 6. Fix )};keyword -> )};\nkeyword
  content = content.replace(/\)\};\s*(async|export|const|let|var|function|if|for|while|switch|try|return|throw|class|import)\b/g, ')};\n$1');

  // 7. Fix );keyword when it's a return statement -> )\nkeyword  
  content = content.replace(/return\s+([^;]+)\)\s*;(const|let|var|if|for|while|switch|try|async|export|function)\b/g, 'return $1);\n$2');

  // 8. Fix }) keyword -> }); keyword (proper semicolon before next statement)
  content = content.replace(/}\)\s+(const|let|var|async|export|function|if|for|while|switch|try|return|throw|class|import)\b/g, '}); $1');

  // 9. Remove duplicate semicolons
  while (content.includes(';;')) content = content.replace(';;', ';');

  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    fixed++;
    console.log('Fixed: ' + fp);
  }
}

console.log('Fixed ' + fixed + ' files.');
