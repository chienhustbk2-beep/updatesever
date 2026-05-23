const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// Simple, robust fixes for checkAdmin corruption and try/catch splits

// Fix 1: checkAdmin with Function Body Split
// Pattern: "async function checkAdmin() {\n  const session = await auth();\n}\nif (!session..."
// Target:  "async function checkAdmin() {\n  const session = await auth();\n  if (!session..."
function fixCheckAdmin(content) {
  // Split pattern - when } closes function prematurely
  const splitRegex = /(async\s+function\s+checkAdmin\s*\(\s*\)\s*\{[^}]*?\n\s*const\s+session\s*=\s*await\s+auth\s*\(\s*\)\s*;?\s*)\n\s*\}\s*\n\s*(if\s*\(!session\?\.user\?\.id\))/;
  if (splitRegex.test(content)) {
    content = content.replace(splitRegex, '$1\n  $2');
  }

  // Same-line pattern (function body intact but closing wrong)
  const intactRegex = /(async\s+function\s+checkAdmin\s*\(\s*\)\s*\{)[\s\S]*?(return\s+prisma\.\w+\.(?:findUnique|findFirst)\s*\(\s*\{\s*where\s*:\s*\{\s*id\s*:\s*session\.user\.id\s*\}\s*\})\s*\}\s*;)/;
  if (intactRegex.test(content)) {
    content = content.replace(
      intactRegex,
      (match, open, ret) => {
        return open + '\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  ' + ret.replace(/\}\s*;/, ';') + '\n}'
      }
    );
  }

  return content;
}

// Fix 2: Any function/try body split after auth()
// Pattern: "try {\n  const session = await auth();\n}\nif" → "try {\n  const session = await auth();\n  if"
// Pattern: "async function NAME() {\n  const session = await auth();\n}\nif" → "async function NAME() {\n  const session = await auth();\n  if"
// Also handles the } catch / } finally split
function fixFunctionBody(content) {
  // Fix "}\nif" after auth() inside function/try body 
  // This handles: try { ... auth(); }\nif → try { ... auth();\n  if
  content = content.replace(
    /((?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{[^}]*?|try\s*\{[^}]*?)\n\s*const\s+session\s*=\s*await\s+auth\s*\(\s*\)\s*;?\s*\n\s*\}\s*\n\s*(if|const|let|var|return)\s/sg,
    (match, prefix, keyword) => {
      // Check if the } is actually a legitimate closing brace by counting
      return prefix + '\n  const session = await auth();\n  ' + keyword + ' ';
    }
  );

  // Fix: ";\n}\nreturn" → ";\n  return" (inside try block, return was pushed outside)
  content = content.replace(
    /((?:async\s+)?function\s+\w+\s*\([^)]*\)\s*\{[^}]*?|try\s*\{[^}]*?)\n\s*const\s+\w+\s*=\s*await\s+prisma[\s\S]*?;\s*\n\s*\}\s*\n\s*(if|return)\s/sg,
    (match, prefix, keyword) => {
      return prefix + ';\n  ' + keyword + ' ';
    }
  );

  return content;
}

// Fix 3: Fix catch blocks that got split
// Pattern: "return NextResponse.json({ user });\n}\n} catch (error) {" → "return NextResponse.json({ user });\n} catch (error) {"
function fixCatchBlocks(content) {
  // } catch (error) { on separate line after bare }
  content = content.replace(
    /(\})\s*\n\s*\}\s*(catch\s*\()/g,
    '$1\n} $2'
  );
  // Bare }\ncatch → }\n}catch (needs explicit closing)
  content = content.replace(
    /(\})\s*\n\s*catch\s*\(/g,
    '$1\n} catch ('
  );
  // Remove extra } before catch if there's a return statement before it
  // "});\n}\n} catch" → "});\n} catch"
  // This is tricky - we should only remove the extra } if the line before is NOT a closing brace
  content = content.replace(
    /(NextResponse\.json\([^)]*\)\s*\)\s*;?\s*)\n\s*\}\s*\n\s*\}\s*(catch\s*\()/g,
    '$1\n} $2'
  );
  return content;
}

// Fix 4: Missing } in Prisma calls
function fixPrismaCalls(content) {
  content = content.replace(/\{ where: \{ id \}\);/g, '{ where: { id } });');
  content = content.replace(/\{ where: \{ id: userId \}\);/g, '{ where: { id: userId } });');
  content = content.replace(/\{ where: \{ id: session\.user\.id \}\)\s*\};/g, '{ where: { id: session.user.id } });\n}');
  return content;
}

// Fix 5: Merged lines
function fixMergedLines(content) {
  content = content.replace(/}\);\s*if\s*\(/g, '});\n    if (');
  content = content.replace(/}\);\s*const\s+/g, '});\n    const ');
  content = content.replace(/\);\s*const\s+/g, ');\n  const ');
  return content;
}

// Fix 6: Comment text leaked
function fixCommentLeaks(content) {
  content = content.replace(/^if payment was made$/gm, '// if payment was made');
  content = content.replace(/^for field updates$/gm, '// for field updates');
  content = content.replace(/^for the keys that were actually assigned$/gm, '// for the keys that were actually assigned');
  content = content.replace(/^to process balance payment$/gm, '// to process balance payment');
  return content;
}

// file-specific fixes
function fixFileSpecific(filePath, content) {
  const p = filePath.replace(/\\/g, '/');

  // checkout/route.ts
  if (p.includes('checkout/route.ts')) {
    // generateTransactionCode function
    content = content.replace(
      /(function generateTransactionCode\(\):\s*string\s*\{)\s*\n\s*const timestamp = Date\.now\(\)\.toString\(36\)\.toUpperCase\(\);\s*\n\s*\}\s*const random =/,
      '$1\n  const timestamp = Date.now().toString(36).toUpperCase();\n  const random ='
    );
    content = content.replace(/return \{ order \}\);/g, 'return { order };');
  }

  // cart/sync/route.ts
  if (p.includes('cart/sync/route.ts')) {
    content = content.replace(/} }\[\]\] \}/g, '}}[]] }');
    content = content.replace(/} \}\[\] \}/g, '}}[] }');
  }

  // public/ui-elements/route.ts  
  if (p.includes('public/ui-elements/route.ts')) {
    content = content.replace(/position: string \}/g, 'position: string;\n      }');
  }

  // webhook/sepay/route.ts
  if (p.includes('webhook/sepay/route.ts')) {
    content = content.replace(/return \{\s*transaction,\s*newBalance:\s*updatedUser\.balance\s*\}\);/g, 'return { transaction, newBalance: updatedUser.balance };');
  }

  // bank-transfer/route.ts
  if (p.includes('bank-transfer/route.ts')) {
    content = content.replace(/\.replace\("\\{content\\}", encodeURIComponent\(content\)\);/g, '.replace("{content}", encodeURIComponent(content))');
  }

  // dashboard-stats/route.ts
  if (p.includes('dashboard-stats/route.ts')) {
    content = content.replace(/total: r\._sum\.finalAmount \|\| 0,\s*\n\s*count: r\._count\.id,\s*\n\s*}\);/g,
      'total: r._sum.finalAmount || 0,\n        count: r._count.id,\n      }));\n    });\n  }');
  }

  return content;
}

const allFiles = [
  'src/app/api/admin/audit-logs/route.ts',
  'src/app/api/admin/categories/route.ts',
  'src/app/api/admin/categories/[id]/route.ts',
  'src/app/api/admin/dashboard-stats/route.ts',
  'src/app/api/admin/import-keys/route.ts',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/admin/orders/[id]/route.ts',
  'src/app/api/admin/orders/[id]/assign-keys/route.ts',
  'src/app/api/admin/parse-keys/route.ts',
  'src/app/api/admin/products/route.ts',
  'src/app/api/admin/products/[id]/route.ts',
  'src/app/api/admin/products/[id]/keys/route.ts',
  'src/app/api/admin/settings/route.ts',
  'src/app/api/admin/tickets/route.ts',
  'src/app/api/admin/transactions/route.ts',
  'src/app/api/admin/ui-elements/route.ts',
  'src/app/api/admin/ui-elements/[id]/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/checkout/route.ts',
  'src/app/api/cart/sync/route.ts',
  'src/app/api/public/ui-elements/route.ts',
  'src/app/api/webhook/sepay/route.ts',
  'src/app/api/payment/bank-transfer/route.ts',
  'src/app/api/payment/momo/route.ts',
  'src/app/api/payment/zalopay/route.ts',
  'src/app/api/tickets/[id]/route.ts',
  'src/app/api/tickets/[id]/messages/route.ts',
  'src/app/api/user/profile/route.ts',
  'src/app/api/user/orders/[id]/route.ts',
  'src/app/api/user/orders/[id]/pay/route.ts',
  'src/app/api/register/route.ts',
  'src/app/api/coupon/validate/route.ts',
];

console.log('=== Fixing route file corruption ===');
let fixed = 0;
for (const filePath of allFiles) {
  const absPath = path.join(ROOT, filePath);
  if (!fs.existsSync(absPath)) {
    console.log('  NOT FOUND: ' + filePath);
    continue;
  }
  let content = fs.readFileSync(absPath, 'utf8');
  const orig = content;

  content = fixCheckAdmin(content);
  content = fixFunctionBody(content);
  content = fixCatchBlocks(content);
  content = fixPrismaCalls(content);
  content = fixMergedLines(content);
  content = fixCommentLeaks(content);
  content = fixFileSpecific(filePath, content);

  if (content !== orig) {
    fs.writeFileSync(absPath, content, 'utf8');
    console.log('  FIXED: ' + filePath);
    fixed++;
  }
}
console.log(`\nDone: ${fixed} files fixed`);
