const fs = require('fs');
const path = require('path');

const files = [];
function walk(dir) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.tsx')) files.push(p);
  }
}
walk('src');

// All statement-starting keywords in TypeScript
const allKeywords = ['import', 'export', 'interface', 'const', 'let', 'var', 'function', 'if', 'for', 'while', 'switch', 'try', 'catch', 'return', 'throw', 'class', 'async', 'default', 'type', 'enum'];

let fixed = 0;
for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  const orig = content;

  // Fix: closing single-quote followed by keyword (with possible whitespace)
  for (const kw of allKeywords) {
    const re = new RegExp("'\\s*" + kw + "\\b", 'g');
    content = content.replace(re, "';" + kw);
  }

  // Fix: closing double-quote followed by keyword
  for (const kw of allKeywords) {
    const re = new RegExp('"\\s*' + kw + '\\b', 'g');
    content = content.replace(re, '";' + kw);
  }

  // Fix: } followed by keyword  
  for (const kw of allKeywords) {
    const re = new RegExp('\\}\\s*' + kw + '\\b', 'g');
    content = content.replace(re, '};' + kw);
  }

  // Fix: ) followed by const/let/var/return
  for (const kw of ['const', 'let', 'var', 'return']) {
    const re = new RegExp('\\)\\s*' + kw + '\\b', 'g');
    content = content.replace(re, ');' + kw);
  }

  // Fix: closing backtick followed by keyword
  for (const kw of allKeywords) {
    const re = new RegExp('`\\s*' + kw + '\\b', 'g');
    content = content.replace(re, '`;' + kw);
  }

  // Remove double semicolons
  while (content.includes(';;')) content = content.replace(';;', ';');

  if (content !== orig) {
    fs.writeFileSync(f, content, 'utf8');
    fixed++;
    console.log('Fixed: ' + f.replace(/^.*[\\\/]/, ''));
  }
}
console.log('Done. Fixed ' + fixed + ' files.');
