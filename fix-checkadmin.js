const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// === FIX 1: checkAdmin() function - rejoin body that was split by "}" ===
// Pattern: async function checkAdmin() {\n  const session = await auth();\n}\nif (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } })};
// Should be: async function checkAdmin() {\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.user.findUnique({ where: { id: session.user.id } });\n}

function fixCheckAdminSplit(content) {
  // Pattern: After checkAdmin() {, closing brace on its own line after auth(), then rest of body outside
  return content.replace(
    /(async function checkAdmin\(\)\s*\{)\s*\n\s*const session = await auth\(\);\s*\n\s*\}\s*\n\s*if\s*\(!session\?\.user\?\.id\)\s*return null;\s*\n\s*return prisma\.(\w+)\.(findUnique|findFirst)\(\{ where: \{ id: session\.user\.id \} \)\s*\};/g,
    '$1\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.$2.$3({ where: { id: session.user.id } });\n'
  );
}

// === FIX 1b: checkAdmin() - already on same line (not split), just fix closing brace ===
// Pattern: });\nexport or };\nexport
function fixCheckAdminClosing(content) {
  return content.replace(
    /(async function checkAdmin\(\)\s*\{)\s*\n\s*const session = await auth\(\);\s*\n\s*if\s*\(!session\?\.user\?\.id\)\s*return null;\s*\n\s*return prisma\.(\w+)\.(findUnique|findFirst)\(\{ where: \{ id: session\.user\.id \} \}\)\s*\};\s*\n/g,
    '$1\n  const session = await auth();\n  if (!session?.user?.id) return null;\n  return prisma.$2.$3({ where: { id: session.user.id } });\n}\n'
  );
}



// === FIX 3: Fix exact Prisma call patterns with missing "}" ===
function fixExactPrismaCalls(content) {
  content = content.replace(
    /\{ where: \{ id \}\);/g,
    '{ where: { id } });'
  );
  content = content.replace(
    /\{ where: \{ id: userId \}\);/g,
    '{ where: { id: userId } });'
  );
  content = content.replace(
    /\{ where: \{ id: session\.user\.id \}\)\s*\};/g,
    '{ where: { id: session.user.id } });\n}'
  );
  return content;
}

// === FIX 4: Fix "});if" merged ===
function fixMergedLines(content) {
  // });if → });\nif
  content = content.replace(/}\);\s*if\s*\(/g, '});\nif (');
  // });const → });\nconst
  content = content.replace(/}\);\s*const\s+/g, '});\nconst ');
  return content;
}

// === FIX 5: Add comment markers to leaked comment text ===
function fixCommentLeaks(content) {
  content = content.replace(
    /^if payment was made$/gm,
    '// if payment was made'
  );
  content = content.replace(
    /^for field updates$/gm,
    '// for field updates'
  );
  content = content.replace(
    /^for the keys that were actually assigned$/gm,
    '// for the keys that were actually assigned'
  );
  content = content.replace(
    /^to process balance payment$/gm,
    '// to process balance payment'
  );
  return content;
}

// File-specific fixes
const fileSpecificFixes = {
  // === checkout/route.ts ===
  'src/app/api/checkout/route.ts': (c) => {
    // Fix generateTransactionCode() function - rejoin body
    c = c.replace(
      /(function generateTransactionCode\(\):\s*string\s*\{)\s*\n\s*const timestamp = Date\.now\(\)\.toString\(36\)\.toUpperCase\(\);\s*\n\}\s*const random =/,
      '$1\n  const timestamp = Date.now().toString(36).toUpperCase();\n  const random ='
    );
    // Fix return { order });
    c = c.replace(/return \{ order \}\);/g, 'return { order };');
    return c;
  },
  // === cart/sync/route.ts: interface fix ===
  'src/app/api/cart/sync/route.ts': (c) => {
    c = c.replace(/} }\[\]\] \}/g, '}}[]] }');
    c = c.replace(/} \}\[\] \}/g, '}}[] }');
    return c;
  },
  // === public/ui-elements/route.ts: interface fix ===
  'src/app/api/public/ui-elements/route.ts': (c) => {
    c = c.replace(/position: string \}/g, 'position: string;\n      }');
    return c;
  },
  // === checkout fix: return { order }); → return { order }; ===
  // Combined with the function fix above

  // === webhook/sepay/route.ts ===
  'src/app/api/webhook/sepay/route.ts': (c) => {
    return c
      .replace(/return \{\s*\n\s*transaction,\s*\n\s*newBalance: updatedUser\.balance,\s*\n\s*\}\);/, 
        'return {\n        transaction,\n        newBalance: updatedUser.balance,\n      };')
      .replace(/return \{\s*transaction,\s*newBalance:\s*updatedUser\.balance\}\);/, 
        'return { transaction, newBalance: updatedUser.balance };');
  },
  // === bank-transfer/route.ts: chain broken ===
  'src/app/api/payment/bank-transfer/route.ts': (c) => {
    c = c.replace(/\.replace\("\\{content\\}", encodeURIComponent\(content\)\);/g, '.replace("{content}", encodeURIComponent(content))');
    // Also fix the broken chain
    c = c.replace(/order\.finalAmount\.toString\(\)\);\s*\n\s*\.replace/g, 'order.finalAmount.toString())\n      .replace');
    return c;
  },
  // === admin/dashboard-stats/route.ts: revenueByMethod.map closing ===
  'src/app/api/admin/dashboard-stats/route.ts': (c) => {
    c = c.replace(/total: r\._sum\.finalAmount \|\| 0,\s*\n\s*count: r\._count\.id,\s*\n\s*}\);/g, 
      'total: r._sum.finalAmount || 0,\n        count: r._count.id,\n      }));\n    });\n  }');
    return c;
  },
  // === admin/import-keys/route.ts: missing closing for createMany ===
  'src/app/api/admin/import-keys/route.ts': (c) => {
    c = c.replace(/status: "AVAILABLE",\s*\n\s*}\);/gm, 'status: "AVAILABLE",\n        },\n      }));');
    // Fix the import-keys which has inline checkAdmin (no separate function)
    return c;
  },
};

const allFiles = [
  // Admin route files with checkAdmin
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
  // Other route files
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
  'src/app/api/admin/transactions/route.ts',
];

function fixFile(filePath) {
  const absPath = path.join(ROOT, filePath);
  if (!fs.existsSync(absPath)) {
    console.log('  NOT FOUND: ' + filePath);
    return false;
  }
  let content = fs.readFileSync(absPath, 'utf8');
  const orig = content;

  // Apply file-specific fixes first
  const relPath = filePath.replace(/\\/g, '/');
  for (const [pattern, fixer] of Object.entries(fileSpecificFixes)) {
    if (relPath === pattern) {
      content = fixer(content);
    }
  }

  // Apply general fixes
  content = fixCheckAdminSplit(content);
  content = fixCheckAdminClosing(content);
  content = fixExactPrismaCalls(content);
  content = fixMergedLines(content);
  content = fixCommentLeaks(content);

  if (content !== orig) {
    fs.writeFileSync(absPath, content, 'utf8');
    console.log('  FIXED: ' + filePath);
    return true;
  }
  return false;
}

console.log('=== Fixing checkAdmin and route file corruption ===');
let fixed = 0;
for (const f of allFiles) {
  if (fixFile(f)) fixed++;
}
console.log(`\nDone: ${fixed} files fixed`);
