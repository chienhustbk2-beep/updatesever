const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/Chien Hust/ecommerce-digital/src';

const stmtKeywords = [
  'const', 'let', 'var', 'function', 'async', 'class',
  'export', 'import', 'return', 'throw', 'if', 'switch',
  'while', 'for', 'try', 'do', 'yield', 'await', 'default'
];

// Interface/type member separator patterns (pre-existing)
const memberSepPatterns = [
  // { id: string name: string }  →  { id: string; name: string }
  /(\{)\s*([a-zA-Z_$][\w$]*\s*:\s*(?:string|number|boolean|Date|any|void|null|undefined|never|unknown|bigint|symbol|React\.\w+|Record\s*<[^>]+>|\[\]|[a-zA-Z_$][\w$]*)(?:\s*\|\s*[^}]+)?)\s+([a-zA-Z_$][\w$]*\s*:)/g,
  // \[key: string\]: type  →  [key: string]: type (leave alone)
];

function fixMissingSemicolons(content) {
  let result = content;

  // 1. Fix if(...);something() → if(...) something() (logic bug - semicolon should NOT be there)
  result = result.replace(/if\s*\([^)]*\)\s*;\s*([a-zA-Z_]\w*)\s*\(/g, (match, fn) => {
    if (['if', 'while', 'for', 'switch', 'catch'].includes(fn)) return match;
    return match.replace(/\)\s*;\s*/, ') ');
  });

  // 2. After ) when followed by identifier( → add ;   (new statement)
  //    BUT NOT if it's a chained call (.then, .catch, etc.)
  //    AND NOT for control flow (if, while, for, switch, catch)
  result = result.replace(/\)\s+([a-zA-Z_]\w*)\s*\(/g, (match, ident) => {
    if (['if', 'while', 'for', 'switch', 'catch', 'else', 'then'].includes(ident)) return match;
    if (match.includes(';')) return match;
    return match.replace(/\)\s+/, ');');
  });

  // 3. After ) followed by statement keyword (not followed by ()
  result = result.replace(/\)\s+(async|function|class|export|import|const|let|var|return|throw|try|do|yield|default)\b/g, (match) => {
    if (match.includes(';')) return match;
    return match.replace(/\)\s+/, ');');
  });

  // 4. After } when followed by statement keyword (except catch/else/finally/while in do-while)
  result = result.replace(/}\s+(const|let|var|function|async|class|export|import|return|throw|try|if|switch|for|while|do|yield|default)\b/g, (match) => {
    if (match.includes(';')) return match;
    return match.replace(/}\s+/, '};');
  });

  // 5. After ] when followed by statement keyword
  result = result.replace(/\]\s+(const|let|var|function|async|class|export|import|return|throw|try|if|switch|for|while|do|yield|default)\b/g, (match) => {
    if (match.includes(';')) return match;
    return match.replace(/\]\s+/, '];');
  });

  // 6. After string literal ending with ' when followed by statement keyword
  //    Pattern: ...identifier' keyword  →  ...identifier'; keyword
  //    Be careful with imports: "from 'react'" should NOT get ; after react'
  result = result.replace(/'\s+(const|let|var|function|async|class|export|import|return|throw|try|if|switch|for|while|do|yield|default)\b/g, (match) => {
    if (match.includes(';')) return match;
    return match.replace(/'\s+/, "';");
  });

  // 7. After identifier/value when followed by statement keyword
  //    e.g., "product.price  const discount" → "product.price; const discount"
  //         "null  return" → "null; return"
  //    BUT exclude common patterns like "export default", "typeof x"
  const valueFollowedByKeyword = new RegExp(
    '([\\w\\])\\)])\\s+(const|let|var|function|async|class|export(?!\\s+default)|import|return|throw|if|switch|for|while|try|do|yield|default)\\b',
    'g'
  );
  result = result.replace(valueFollowedByKeyword, (match, before, kw) => {
    if (match.includes(';')) return match;
    return match.replace(/(\S)\s+/, '$1; ');
  });

  // 8. { symbol followed by identifier(newline or space) → handle interface members
  //    This adds ; between member declarations in interfaces/type literals
  //    Pattern: type name: string nextName:  →  type name: string; nextName:
  result = result.replace(/(\w+\s*:\s*(?:string|number|boolean|Date|any|void|React\.\w+|Record\s*<[^>]+>|\[\]|[a-zA-Z_$]\w*(?:<[^>]*>)?))\s+([a-zA-Z_$]\w*\s*:)/g, (match, m1, m2) => {
    if (match.includes(';') || match.includes(',') || match.includes('}')) return match;
    // Skip if inside JSX
    return m1 + '; ' + m2;
  });

  return result;
}

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walkDir(SRC);
let fixed = 0;
let totalErrors = 0;

for (const fp of files) {
  let content = fs.readFileSync(fp, 'utf-8');
  const orig = content;

  content = fixMissingSemicolons(content);

  if (content !== orig) {
    fs.writeFileSync(fp, content);
    fixed++;
    const added = (content.match(/;/g) || []).length - (orig.match(/;/g) || []).length;
    totalErrors += added;
  }
}

console.log(`Files modified: ${fixed}`);
console.log(`Total semicolons added: ${totalErrors}`);
