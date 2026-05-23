const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// These files need the checkAdmin function fixed (lines 5-9 pattern)
const apiFiles = [
  'src/app/api/admin/categories/[id]/route.ts',
  'src/app/api/admin/categories/route.ts',
  'src/app/api/admin/dashboard-stats/route.ts',
  'src/app/api/admin/import-keys/route.ts',
  'src/app/api/admin/orders/[id]/assign-keys/route.ts',
  'src/app/api/admin/orders/[id]/route.ts',
  'src/app/api/admin/parse-keys/route.ts',
  'src/app/api/admin/products/[id]/keys/route.ts',
  'src/app/api/admin/products/[id]/route.ts',
  'src/app/api/admin/transactions/route.ts',
  'src/app/api/admin/ui-elements/[id]/route.ts',
  'src/app/api/admin/ui-elements/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/tickets/[id]/messages/route.ts',
  'src/app/api/tickets/[id]/route.ts',
  'src/app/api/user/orders/[id]/pay/route.ts',
  'src/app/api/user/orders/[id]/route.ts',
  'src/app/api/user/profile/route.ts',
  'src/app/api/webhook/sepay/route.ts',
  'src/app/api/coupon/validate/route.ts',
  'src/app/api/register/route.ts',
  'src/app/api/checkout/route.ts',
  'src/app/api/cart/sync/route.ts',
  'src/app/api/public/ui-elements/route.ts',
  'src/app/api/payment/bank-transfer/route.ts',
  'src/app/api/payment/momo/route.ts',
  'src/app/api/payment/zalopay/route.ts',
];

function fixCheckAdmin(content) {
  // Fix the checkAdmin function that was broken into:
  // async function checkAdmin() {
  //   const session = await auth();
  // }
  // if (!session?.user?.id) return null;
  //   return prisma.user.findUnique(...) };
  //
  // Should be:
  // async function checkAdmin() {
  //   const session = await auth();
  //   if (!session?.user?.id) return null;
  //   return prisma.user.findUnique(...);
  // }
  
  // Pattern: the } after auth() that closes the function prematurely
  content = content.replace(
    /(async function checkAdmin\s*\(\)\s*\{[^}]*\n\s*const\s+\w+\s+=\s+await\s+\w+\(\);\s*)\n\s*\}\s*\n\s*if\b/g,
    '$1\n  if'
  );
  
  return content;
}

function fixContent(filePath, content) {
  let result = content;
  
  // === Fix 1: checkAdmin function ===
  result = fixCheckAdmin(result);
  
  // === Fix 2: Fix "});" at end of checkAdmin (return ... })};
  result = result.replace(
    /(return\s+\w+\.\w+\(\{[^}]*\}\)\s*)\}\s*\)\s*};/g,
    '$1});'
  );
  result = result.replace(
    /(return\s+\w+\.\w+\(\{[^}]*\}\)\s*)\}\)\s*};/g,
    '$1});'
  );
  // More general: fix "})};" -> "});"
  result = result.replace(/}\)};/g, '});');
  
  // === Fix 3: Fix "}};" at end of non-return statements ===
  result = result.replace(/}}\);/g, '});');
  result = result.replace(/\)\s*\}\s*\}\);/g, '});');
  
  // === Fix 4: Fix findUnique missing closing brace ===
  result = result.replace(
    /(findUnique|findFirst)\(\{\s*where\s*:\s*\{\s*(\w+)\s*\}\s*\}\);/g,
    '$1({ where: { $2 } });'
  );
  
  // === Fix 5: Fix missing "}" in { where: { id }); ===
  result = result.replace(
    /\{\s*where\s*:\s*\{\s*(\w+)\s*\}\s*\);/g,
    '{ where: { $1 } });'
  );
  
  // === Fix 6: Fix "} )" at end of function -> "});" ===
  // Pattern: .findUnique({ ... })}; -> .findUnique({ ... });
  result = result.replace(/\.\w+\(\{([^}]*)\}\s*\}\);/g, '.$1({$2});');
  result = result.replace(/\.\w+\(\{([^}]*)\}\s*\}\);/g, (m) => {
    // Already fixed
    return m;
  });
  
  // Simpler: fix common patterns
  result = result.replace(/findUnique\(\{([^}]*)\}\s*\}\);/g, 'findUnique({$1});');
  
  // === Fix 7: Add missing ";" before "}" that closes a try block ===
  // Pattern: return NextResponse.json({...}) } -> return NextResponse.json({...}); }
  result = result.replace(
    /(return\s+\w+\.\w+\([^)]*\))\s*\}(?!\s*catch)/g,
    '$1; }'
  );
  
  // === Fix 8: Fix "} catch" without newline ===
  result = result.replace(/(\S)\s*\}\s*catch/g, '$1\n} catch');
  
  // === Fix 9: Fix "}export async function" without newline ===
  result = result.replace(/}\s*export\s+async\s+function/g, '}\nexport async function');
  
  // === Fix 10: Fix "}return" without newline ===
  result = result.replace(/}\s*return\s+/g, '}\nreturn ');
  
  // === Fix 11: Fix method chain semicolons ===
  result = result.replace(/\.replace\([^)]*\);\s*\n\s*\.replace/g, (match) => {
    return match.replace(/;\s*\n\s*\./, '\n      .');
  });
  
  // === Fix 12: Remove stray backslash-semicolons ===
  result = result.replace(/\\;/g, ';');
  result = result.replace(/\\'/g, "'");
  
  // === Fix 13: Fix "});," ===
  result = result.replace(/\)};,/g, '});');
  
  // === Fix 14: Fix missing "}" in findUnique({ where: { id }); --> findUnique({ where: { id } }); ===
  result = result.replace(
    /(\w+)\(\{\s*where\s*:\s*\{\s*(\w+)\s*\}\s*\);/g,
    '$1({ where: { $2 } });'
  );
  
  // === Fix 15: Fix ")\n   if" pattern where "}" is missing between them ===
  // This handles: return NextResponse.json({...}, {...})\n);\nif
  result = result.replace(
    /(return\s+\w+\.\w+\([^)]*\))\s*;\s*\n\s*if\b/g,
    '$1;\n} if'
  );
  
  return result;
}

console.log('=== Fixing build errors ===');
let fixed = 0;
for (const f of apiFiles) {
  const absPath = path.join(ROOT, f);
  if (!fs.existsSync(absPath)) {
    console.log(`  SKIP (not found): ${f}`);
    continue;
  }
  let content = fs.readFileSync(absPath, 'utf8');
  const orig = content;
  content = fixContent(f, content);
  if (content !== orig) {
    fs.writeFileSync(absPath, content, 'utf8');
    console.log(`  FIXED: ${f}`);
    fixed++;
  }
}
console.log(`\nDone: ${fixed} files fixed`);

// Now handle page/component files
console.log('\n=== Fixing page/component files ===');

const pageFiles = [
  'src/app/admin/categories/page.tsx',
  'src/app/admin/orders/page.tsx',
  'src/app/admin/tickets/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/support/page.tsx',
  'src/components/home/HomePageContent.tsx',
  'src/components/ui/CartModal.tsx',
  'src/app/checkout/page.tsx',
  'src/app/products/page.tsx',
  'src/app/admin/audit-logs/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/transactions/page.tsx',
  'src/app/admin/ui-customization/page.tsx',
  'src/app/cart/page.tsx',
  'src/app/deposit/page.tsx',
  'src/app/login/page.tsx',
  'src/components/UIElementsProvider.tsx',
  'src/components/admin/AdminKeysImport.tsx',
  'src/components/admin/AdminThemeToggle.tsx',
  'src/components/layout/Header.tsx',
];

function fixPageContent(content) {
  let result = content;
  
  // Fix missing semicolons in page files
  // Pattern: "} )" followed by keyword without newline
  result = result.replace(/\)}\s*(if|const|let|var|for|return|try|function|export)\b/g, ');\n} $1');
  
  // Fix missing newline between statements
  result = result.replace(/};\s*(if|const|let|var|for|return|try|function|interface|export)\b/g, '};\n$1');
  
  // Fix "};export" -> "};\nexport"  
  result = result.replace(/};(if|const|let|var|for|return|try|function|interface|export)\b/g, '};\n$1');
  
  // Fix missing ";" before block closers in page files
  result = result.replace(/\)\s*\}\s*catch/g, ');\n} catch');
  
  // Fix interface member separators (missing comma)
  result = result.replace(/(\w+)\s*:\s*\w+(?:<[^>]*>)?\s*(\w+)\s*:/g, (match, name, type, next) => {
    // If between two interface members, add semicolon/comma  
    if (type && next && !match.includes(';') && !match.includes(',')) {
      return match.replace(new RegExp(type + '\\s*' + next), type + '; ' + next);
    }
    return match;
  });
  
  return result;
}

for (const f of pageFiles) {
  const absPath = path.join(ROOT, f);
  if (!fs.existsSync(absPath)) {
    console.log(`  SKIP (not found): ${f}`);
    continue;
  }
  let content = fs.readFileSync(absPath, 'utf8');
  const orig = content;
  content = fixPageContent(content);
  if (content !== orig) {
    fs.writeFileSync(absPath, content, 'utf8');
    console.log(`  FIXED: ${f}`);
    fixed++;
  }
}

console.log(`\nTotal fixed: ${fixed}`);
