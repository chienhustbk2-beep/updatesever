const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const pageFiles = [
  'src/app/admin/categories/page.tsx', 'src/app/admin/orders/page.tsx',
  'src/app/admin/tickets/page.tsx', 'src/app/admin/users/page.tsx',
  'src/app/dashboard/page.tsx', 'src/app/support/page.tsx',
  'src/app/checkout/page.tsx', 'src/app/products/page.tsx',
  'src/app/admin/audit-logs/page.tsx', 'src/app/admin/page.tsx',
  'src/app/admin/products/page.tsx', 'src/app/admin/settings/page.tsx',
  'src/app/admin/transactions/page.tsx', 'src/app/admin/ui-customization/page.tsx',
  'src/app/cart/page.tsx', 'src/app/deposit/page.tsx', 'src/app/login/page.tsx',
  'src/components/home/HomePageContent.tsx', 'src/components/ui/CartModal.tsx',
  'src/components/UIElementsProvider.tsx', 'src/components/admin/AdminKeysImport.tsx',
  'src/components/admin/AdminThemeToggle.tsx', 'src/components/layout/Header.tsx',
];

function fixPageContent(content) {
  let result = content;

  // FIX 1: Remove incorrectly inserted "}" before "const" / "if" / "function" at line start
  // Pattern: "} const" at start of a line -> "const" (remove the } that closes function body)
  result = result.replace(/^} const /gm, '  const ');
  result = result.replace(/^\s*} const /gm, '  const ');
  result = result.replace(/^} const/gm, '  const');
  
  // Also fix "} if" at start of line
  result = result.replace(/^} if /gm, '  if ');
  result = result.replace(/^} (if|let|var|function|return)/gm, '  $1');
  
  // More general: remove "}" that precedes "const/let/var/function" on same line
  result = result.replace(/}\s+(const|let|var|function|if)\s/g, '  $1 ');

  // FIX 2: Fix "}" followed by "try" / "catch" 
  // "} try" should stay as is (closing one block before try)
  // But "} catch" that was preceded by a correctly structured try block is fine
  
  // FIX 3: Fix interface member separators in minified interfaces
  // Pattern: "number }  children?" -> "number }; children?"
  result = result.replace(/(\w+(?:<[^>]*>)?)\s*\}\s+(\w+)(\??)\s*:/g, (match, type, name, optional) => {
    return `${type}}; ${name}${optional}:`;
  });
  
  // Pattern: missing ";" between simple type members like "number    price" -> "number; price"  
  result = result.replace(/(\w+(?:\|(?:\s*null\s*)?)?)\s{3,}(\w+)(\??)\s*:/g, (match, type, name, optional) => {
    // Don't match if it's already separated by ";"
    if (match.includes(';') || match.includes(',') || match.includes('\n')) return match;
    return `${type}; ${name}${optional}:`;
  });
  
  // Fix: "quantity: number      price:" -> "quantity: number; price:"
  result = result.replace(/(\w+)\s*:\s*(\w+(?:\s*\|\s*\w+)?)\s{3,}(\w+)\s*:/g, (match, key, type, nextKey) => {
    if (match.includes(';') || match.includes(',')) return match;
    return `${key}: ${type}; ${nextKey}:`;
  });

  // FIX 4: Fix "}};" at end of interface (extra brace)
  result = result.replace(/}\s*};/g, '};');
  
  // FIX 5: Fix "}}," at end of object literal (extra brace)
  result = result.replace(/},\s*},/g, '},');
  
  // FIX 6: Fix trailing ";}" before ")" in function call
  // e.g., "});" is correct, but "}};)" is not
  result = result.replace(/}\s*}\s*\);/g, '});');

  // FIX 7: Fix "} });" -> "});" in specific patterns
  result = result.replace(/}\s*\}\);/g, '});');

  // FIX 8: General interface member separator fix
  // Between interface members separated by 2+ spaces instead of ";"
  result = result.replace(/(\w+(?:\[\])?)\s{2,}(\w+)(\??)\s*:/g, (match, type, name, optional) => {
    if (match.includes(';') || match.includes(',') || match.includes('|')) return match;
    return `${type}; ${name}${optional}:`;
  });

  return result;
}

console.log('=== Fixing page/component files ===');
let fixed = 0;
for (const f of pageFiles) {
  const absPath = path.join(ROOT, f);
  if (!fs.existsSync(absPath)) continue;
  let content = fs.readFileSync(absPath, 'utf8');
  const orig = content;
  content = fixPageContent(content);
  if (content !== orig) {
    fs.writeFileSync(absPath, content, 'utf8');
    console.log(`  FIXED: ${f}`);
    fixed++;
  }
}
console.log(`\nDone: ${fixed} files fixed`);
