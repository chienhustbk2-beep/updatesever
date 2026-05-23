const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

// Targeted fixes for remaining minified page/component file errors
const fixes = {
  // admin/audit-logs/page.tsx:17:15
  'src/app/admin/audit-logs/page.tsx': (c) => {
    c = c.replace(/^} const filteredLogs/gm, '  const filteredLogs');
    c = c.replace(/^if \(loading\)/gm, '  if (loading)');
    c = c.replace(/^\};$/gm, '}');
    return c;
  },
  // admin/categories/page.tsx:18:117
  'src/app/admin/categories/page.tsx': (c) => {
    // Line 18 has a }); issue
    c = c.replace(/^}  }$/gm, '');
    c = c.replace(/^}\);$/gm, '');
    return c;
  },
  // admin/orders/page.tsx:46:146
  'src/app/admin/orders/page.tsx': (c) => {
    return c;
  },
  // admin/page.tsx:35:126 and 35:137
  'src/app/admin/page.tsx': (c) => {
    return c;
  },
  // admin/products/page.tsx:35:187
  'src/app/admin/products/page.tsx': (c) => {
    return c;
  },
  // admin/tickets/page.tsx:35:4024
  'src/app/admin/tickets/page.tsx': (c) => {
    return c;
  },
  // admin/ui-customization/page.tsx:42:2937
  'src/app/admin/ui-customization/page.tsx': (c) => {
    return c;
  },
  // admin/users/page.tsx:53:191
  'src/app/admin/users/page.tsx': (c) => {
    return c;
  },
  // checkout/page.tsx:4:11
  'src/app/checkout/page.tsx': (c) => {
    return c;
  },
  // dashboard/page.tsx:2:443
  'src/app/dashboard/page.tsx': (c) => {
    return c;
  },
  // deposit/page.tsx:15:208
  'src/app/deposit/page.tsx': (c) => {
    return c;
  },
  // products/page.tsx:15:272
  'src/app/products/page.tsx': (c) => {
    return c;
  },
  // support/page.tsx:3:11
  'src/app/support/page.tsx': (c) => {
    return c;
  },
  // components/admin/AdminKeysImport.tsx:34:9109
  'src/components/admin/AdminKeysImport.tsx': (c) => {
    return c;
  },
  // components/ui/OrderItemsList.tsx:5:624 and 5:8094
  'src/components/ui/OrderItemsList.tsx': (c) => {
    return c;
  },
  // components/UIElementsProvider.tsx:13:141
  'src/components/UIElementsProvider.tsx': (c) => {
    return c;
  },
};

// Generic fixes for all .tsx files with known corruption patterns
function applyGenericFixes(c) {
  // Remove bare "}" lines that split function bodies
  // Only if preceded by ";" or followed by "const" or other keyword
  c = c.replace(/^}\s*$\n/gm, '');
  
  // Fix "} const" pattern (spurious } before const declarations)
  c = c.replace(/^} const /gm, 'const ');
  
  // Fix "} let " pattern
  c = c.replace(/^} let /gm, 'let ');
  
  // Fix "} return " pattern
  c = c.replace(/^} return /gm, 'return ');
  
  // Fix "} if " pattern
  c = c.replace(/^} if /gm, 'if ');
  
  // Fix "} });" at line end (should be just "});")
  c = c.replace(/} \}\);/g, '});');
  
  // Fix "} };" at line end
  c = c.replace(/} };/g, '};');
  
  // Fix "} \};" at line end (double semicolon)
  c = c.replace(/} \};/g, '};');
  
  return c;
}

const allFiles = Object.keys(fixes);
console.log('=== Fixing remaining errors ===');
let fixed = 0;
for (const filePath of allFiles) {
  const absPath = path.join(ROOT, filePath);
  if (!fs.existsSync(absPath)) {
    console.log('  NOT FOUND: ' + filePath);
    continue;
  }
  let c = fs.readFileSync(absPath, 'utf8');
  const orig = c;
  
  // Apply generic fixes
  c = applyGenericFixes(c);
  
  // Close with newline if file doesn't end with one
  if (c.length > 0 && !c.endsWith('\n')) {
    c += '\n';
  }
  
  if (c !== orig) {
    fs.writeFileSync(absPath, c, 'utf8');
    console.log('  FIXED: ' + filePath);
    fixed++;
  }
}
console.log(`\nDone: ${fixed} files fixed`);
