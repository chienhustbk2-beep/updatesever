const fs = require('fs');

// Fix ONLY known specific patterns based on the exact build errors
const fixes = {
  // Comment corruption - text leaked out of comments
  'src/app/api/admin/orders/[id]/route.ts': (c) => {
    // "for the keys that were actually assigned" should be a comment
    return c.replace(/^for the keys that were actually assigned\s*$/gm, '// for the keys that were actually assigned');
  },
  'src/app/api/tickets/[id]/route.ts': (c) => {
    return c.replace(/^if user is admin\/staff\s*$/gm, '// if user is admin/staff');
  },
  'src/app/api/user/orders/[id]/route.ts': (c) => {
    return c.replace(/^for the keys that were actually assigned\s*$/gm, '// for the keys that were actually assigned');
  },

  // Missing closing brace before closing paren - fix findUnique({ where: { id } })  
  'src/app/api/admin/categories/[id]/route.ts': (c) => {
    return c.replace(/prisma\.(\w+)\.findUnique\(\{ where: \{ id \}\);/g, 'prisma.$1.findUnique({ where: { id } });');
  },
  'src/app/api/admin/products/[id]/keys/route.ts': (c) => {
    return c.replace(/prisma\.(\w+)\.findUnique\(\{ where: \{ id \}\);/g, 'prisma.$1.findUnique({ where: { id } });');
  },
  'src/app/api/admin/ui-elements/[id]/route.ts': (c) => {
    return c.replace(/prisma\.(\w+)\.findUnique\(\{ where: \{ id \}\);/g, 'prisma.$1.findUnique({ where: { id } });');
  },
  'src/app/api/admin/ui-elements/route.ts': (c) => {
    return c.replace(/prisma\.(\w+)\.findUnique\(\{ where: \{ key \}\);/g, 'prisma.$1.findUnique({ where: { key } });');
  },
  'src/app/api/admin/users/[id]/route.ts': (c) => {
    return c.replace(/prisma\.(\w+)\.findUnique\(\{ where: \{ id \}\);/g, 'prisma.$1.findUnique({ where: { id } });');
  },
  'src/app/api/cart/sync/route.ts': (c) => {
    // User findUnique + also fix missing brace in interface
    return c
      .replace(/prisma\.user\.findUnique\(\{ where: \{ id: userId \}\);/g, 'prisma.user.findUnique({ where: { id: userId } });')
      .replace(/} }\[/g, '}}[]');
  },

  // Extra closing paren: return { order }); → return { order };
  'src/app/api/checkout/route.ts': (c) => {
    return c.replace(/return \{ order \}\);/g, 'return { order };');
  },
  // === webhook/sepay/route.ts removed (deleted) ===

  // } catch on wrong line - need to properly close try block
  'src/app/api/admin/orders/[id]/assign-keys/route.ts': (c) => {
    return c
      .replace(/^catch \(error\) \{$/gm, '} catch (error) {')
      .replace(/console\.error\("Assign keys error:", error\)\s*$/m, '    console.error("Assign keys error:", error);')
      .replace(/^return NextResponse\.json\(\s*$/, '    return NextResponse.json(')
      .replace(/^\s*\) \}$/m, '    );\n  }')
      .replace(/^\s*\}\s*$/gm, (match, offset, str) => {
        // Count braces to figure out if this needs fixing
        return match;
      });
  },

  // ; after }); in array context
  'src/app/api/admin/dashboard-stats/route.ts': (c) => {
    return c.replace(/}\);,/g, '});');
  },
  'src/app/api/admin/import-keys/route.ts': (c) => {
    return c.replace(/}\);,/g, '});');
  },

  // Fix } catch/} catch patterns - try block/closing issues
  'src/app/api/user/profile/route.ts': (c) => {
    return c.replace(/^catch \(error\) \{$/gm, '} catch (error) {');
  },
  'src/app/api/admin/products/[id]/route.ts': (c) => {
    return c.replace(/^catch \(error\) \{$/gm, '} catch (error) {');
  },
  'src/app/api/tickets/[id]/messages/route.ts': (c) => {
    return c.replace(/^catch \(error\) \{$/gm, '} catch (error) {');
  },

  // bank-transfer: .replace chain broken by ;
  'src/app/api/payment/bank-transfer/route.ts': (c) => {
    return c.replace(/\.replace\("[^"]+", [^;]+\);/g, (match) => match.replace(';', ''));
  },

  // payment routes });if on same line  
  'src/app/api/payment/momo/route.ts': (c) => {
    return c.replace(/}\);\s*if\s*\(/g, '});\n  if (');
  },
  'src/app/api/payment/zalopay/route.ts': (c) => {
    return c.replace(/}\);\s*if\s*\(/g, '});\n  if (');
  },
  'src/app/api/payment/bank-transfer/route.ts': (c) => {
    return c.replace(/}\);\s*if\s*\(/g, '});\n  if (');
  },
};

const BASE = 'C:/Users/Chien Hust/ecommerce-digital';
let fixed = 0;
for (const [filePath, fixer] of Object.entries(fixes)) {
  const fullPath = `${BASE}/${filePath}`;
  if (!fs.existsSync(fullPath)) {
    console.log('Not found: ' + filePath);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const newContent = fixer(content);
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    fixed++;
    console.log('Fixed: ' + filePath);
  }
}
console.log('Fixed ' + fixed + ' files.');
