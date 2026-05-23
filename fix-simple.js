const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

function fixFile(filePath) {
  const absPath = path.join(ROOT, filePath);
  if (!fs.existsSync(absPath)) return false;
  let c = fs.readFileSync(absPath, 'utf8');
  const orig = c;
  const p = filePath.replace(/\\/g, '/');

  // === CHECKADMIN FIX: Merge the split function body ===
  // Before: async function checkAdmin() {\n  const session = await auth();\n}\nif (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } })};
  // After:  async function checkAdmin() {\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } });\n}
  c = c.replace(
    'async function checkAdmin() {\n  const session = await auth();\n}\nif (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } })};',
    'async function checkAdmin() {\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } });\n}'
  );

  // === CHECKADMIN FIX 2: Already intact but with wrong closing ===
  c = c.replace(
    'async function checkAdmin() {\n  const session = await auth();\nif (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } })};',
    'async function checkAdmin() {\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } });\n}'
  );

  // === CHECKADMIN FIX 3: with function on same line ===  
  c = c.replace(
    'async function checkAdmin() {\n  const session = await auth();\nif (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } })\n};',
    'async function checkAdmin() {\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } });\n}'
  );

  // === TRY BLOCK SPLIT FIX: rejoins try/METHOD body broken by } ===
  // Pattern: try {\n  const session = await auth();\n}\nif (!session?.user?.id) {
  // Becomes: try {\n  const session = await auth();\n  if (!session?.user?.id) {
  c = c.replace(
    /(try\s*\{)\s*\n\s+const\s+session\s*=\s*await\s+auth\s*\(\s*\)\s*;?\s*\n\s*\}\s*\n\s+if\s*\(!session\?\.user\?\.id\)/g,
    '$1\n    const session = await auth();\n    if (!session?.user?.id)'
  );

  // === Try block: const user = await prisma... \n}\nif (!user) → ;\n  if (!user) ===
  c = c.replace(
    /(const\s+\w+\s*=\s*await\s+prisma\.[\s\S]*?;\s*)\n\s*\}\s*\n\s+(if\s*\(!\w+\))/g,
    '$1\n    $2'
  );

  // === Try block: return NextResponse... \n}\nreturn → \n  return ===
  c = c.replace(
    /(return\s+NextResponse\.json[\s\S]*?;\s*)\n\s*\}\s*\n\s+(return\s+NextResponse)/g,
    '$1\n    $2'
  );

  // === Try block: }\n} catch → \n} catch (removes extra }) ===
  c = c.replace(
    /(NextResponse\.json\s*\([^)]*\)\s*\)\s*)\s*\n\s*\}\s*\n\s*\}\s*(catch\s*\()/g,
    '$1\n  } $2'
  );

  // === Try block: bare }\n} catch pattern ===
  c = c.replace(
    /(\n\s*[^}]\s*;)\s*\n\s*\}\s*\n\s*\}\s*(catch)/g,
    '$1\n} $2'
  );

  // Remove stray extra } before catch
  c = c.replace(
    /(\n\s*return\s+NextResponse\.json[\s\S]*?\)\s*\)\s*;?)\s*\n\s*\}\s*\n\s*\}\s*(catch)/g,
    '$1\n} $2'
  );

  // === Merge } catch on same line (fix "}\ncatch" → "}\n} catch") ===
  c = c.replace(/\}\s*\n\s*catch\s*\(/g, '}\n} catch (');

  // === Merge } finally ===
  c = c.replace(/\}\s*\n\s*finally\s*\{/g, '}\n} finally {');

  // === Remove extra `;` at line ends in function bodies ===
  // Fix "return ... }) }" → "return ... });\n}"
  c = c.replace(/return\s+NextResponse\.json\(([^)]*)\)\s*\}\s*\)\s*\}\s*$/gm, 'return NextResponse.json($1);\n}');

  // === FIX: ; after function closing bracket ===
  c = c.replace(/\);}\s*$/gm, ';\n}');
  c = c.replace(/\)\};\s*$/gm, ');\n}');

  // === FIX: missing "}" before ")" in Prisma calls ===
  c = c.replace(/\{\s*where\s*:\s*\{\s*id\s*\}\s*\)\s*;/g, '{ where: { id } });');
  c = c.replace(/\{\s*where\s*:\s*\{\s*id:\s*userId\s*\}\s*\)\s*;/g, '{ where: { id: userId } });');
  c = c.replace(/\{\s*where\s*:\s*\{\s*id:\s*session\.user\.id\s*\}\s*\)\s*\}\s*;/g, '{ where: { id: session.user.id } });\n}');

  // === FIX: comment text leaked ===
  c = c.replace(/^if payment was made$/gm, '// if payment was made');
  c = c.replace(/^for field updates$/gm, '// for field updates');
  c = c.replace(/^for the keys that were actually assigned$/gm, '// for the keys that were actually assigned');
  c = c.replace(/^to process balance payment$/gm, '// to process balance payment');
  c = c.replace(/^if user is admin\/staff$/gm, '// if user is admin/staff');

  // === FIX: missing } in interface ===
  if (p.includes('public/ui-elements/route.ts')) {
    c = c.replace('position: string }', 'position: string;\n      }');
  }
  if (p.includes('cart/sync/route.ts')) {
    c = c.replace('} }[]] }', '}}[]] }');
    c = c.replace('} }}[]] }', '}}[]] }');
    c = c.replace('} }[] }', '}}[] }');
  }

  // === FIX: checkout generateTransactionCode ===
  if (p.includes('checkout/route.ts')) {
    c = c.replace(
      'function generateTransactionCode(): string {\n  const timestamp = Date.now().toString(36).toUpperCase();\n} const random = Math.random().toString(36).substring(2, 6).toUpperCase();\n}\nreturn `TXN-${timestamp}-${random}`};',
      'function generateTransactionCode(): string {\n  const timestamp = Date.now().toString(36).toUpperCase();\n  const random = Math.random().toString(36).substring(2, 6).toUpperCase();\n  return `TXN-${timestamp}-${random}`;\n}'
    );
  }

  if (c !== orig) {
    fs.writeFileSync(absPath, c, 'utf8');
    console.log('  FIXED: ' + filePath);
    return true;
  }
  return false;
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

console.log('=== Fixing files ===');
let fixed = 0;
for (const f of allFiles) {
  if (fixFile(f)) fixed++;
}
console.log(`\nDone: ${fixed} files fixed`);
