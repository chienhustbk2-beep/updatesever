const fs = require('fs');
const path = require('path');

const SRC = 'C:/Users/Chien Hust/ecommerce-digital/src';

const files = [];
function walk(dir) {
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) files.push(p);
    }
  } catch (e) { }
}
walk(SRC);

function fixContent(r) {
  // 1. Xóa dấu ; sau export, async, default (nếu sót)
  r = r.replace(/\bexport\s*;\s*(async|default|const|function|interface|type|class|let|var)/g, 'export $1');
  r = r.replace(/\bexport\s*;\s*$/gm, 'export');
  r = r.replace(/\bdefault\s*;\s*(function|async|class|const|let|var)/g, 'default $1');
  r = r.replace(/\basync\s*;\s*function/g, 'async function');
  r = r.replace(/;\s*export\s+default\s+(async\s+)?function/g, '\nexport default $1function');

  // 2. Fix }}); -> });\n}  (key pattern - extra brace before ))
  r = r.replace(/return\s+(NextResponse\.json|NextResponse\.redirect|NextResponse\.error)\(([^;]*?)\}\s*\)\s*\)/g,
    'return $1($2});');

  // 3. Fix cụ thể: "status: XXX}});" -> "status: XXX});\n}"
  r = r.replace(/status:\s*\d+\s*\}\s*\}\s*\)\s*;/g, (match) => {
    return match.replace(/\}\s*\}\s*\)\s*;/, '});\n}');
  });

  // 4. Fix "}});" where followed by if/const on same line
  r = r.replace(/status:\s*\d+\s*\}\s*\}\s*\)\s*;?\s*(if|const|let|var|export|async|function|return)\b/g,
    (match) => {
      const m = match.replace(/\}\s*\}\s*\)\s*;?/, '});\n}');
      const after = match.match(/(if|const|let|var|export|async|function|return)\b/);
      return m + '\n' + (after ? after[1] === match.trim().match(/(if|const|let|var|export|async|function|return)\b/)?.[1] ? '' : '' : '');
    });

  // Simpler version - just replace }}); pattern
  r = r.replace(/\}\s*\}\s*\)\s*;/g, '});\n}');

  // 5. Fix "} catch" -> ensure proper newline
  r = r.replace(/\)\s*\}\s*catch/g, ');\n} catch');
  r = r.replace(/;\s*\}\s*catch/g, ';\n}\ncatch');

  // 6. Fix "} export" on one line
  r = r.replace(/}\s*export\s+async\s+function/g, '}\nexport async function');
  r = r.replace(/}\s*export\s+function/g, '}\nexport function');
  r = r.replace(/}\s*export\s+const/g, '}\nexport const');

  // 7. Fix hàm bị dính: "return ORD-... }export" -> "return ORD-... };\nexport"  
  r = r.replace(/return\s+([^;]+?)\s*\}\s*export/g, 'return $1};\nexport');

  // 8. Fix comment ăn code: "// text; func" -> "// text\nfunc"
  r = r.replace(/^(\s*)\/\/\s*([A-Za-z].*?);\s*(async\s+)?function\s/m, '$1// $2\n$1$3function ');

  // 9. Xử lý dư } trước ) khi return NextResponse
  r = r.replace(/NextResponse\.json\(\s*\{([^}]*)\}\s*,\s*\{([^}]*)\}\s*\}\s*\)/g,
    'NextResponse.json({$1}, {$2})');

  // 10. Fix các dòng comment đã bị vỡ
  // "for bank transfer" -> "// for bank transfer"  
  r = r.replace(/^for\s+bank\s+transfer\s*;?\s*$/gm, '// for bank transfer');
  // "if user owns this ticket" -> "// if user owns this ticket"
  r = r.replace(/^if\s+user\s+owns\s+this\s+ticket\s*;?\s*$/gim, '// if user owns this ticket');
  // "if order belongs to user" -> "// if order belongs to user"
  r = r.replace(/^if\s+order\s+belongs\s+to\s+user\s*;?\s*$/gim, '// if order belongs to user');
  // "if cancellation action is requested" -> "// if cancellation action is requested"
  r = r.replace(/^if\s+cancellation\s+action\s+is\s+requested\s*\([^)]*\)\s*;?\s*$/gm, '// if cancellation action is requested (via action or status transition)');

  // 11. Xóa `;;`
  while (r.includes(';;;')) r = r.replace(';;;', ';');
  while (r.includes(';;')) r = r.replace(';;', ';');

  // 12. Thêm ; cuối câu return
  r = r.replace(/return\s+(NextResponse\.[\w]+\([^;]*?\))\s*\n/g, 'return $1;\n');

  return r;
}

let fixed = 0;
for (const fp of files) {
  let content = fs.readFileSync(fp, 'utf8');
  const orig = content;
  content = fixContent(content);
  if (content !== orig) {
    fs.writeFileSync(fp, content, 'utf8');
    fixed++;
    console.log('Fixed: ' + path.relative(SRC.replace('/src', ''), fp));
  }
}

console.log('Fixed ' + fixed + ' files.');
