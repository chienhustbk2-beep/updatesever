// Comprehensive fix script for corrupted TSX files
const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\Chien Hust\\ecommerce-digital';

const files = [
  'src/app/admin/audit-logs/page.tsx',
  'src/app/admin/categories/page.tsx',
  'src/app/admin/orders/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/settings/page.tsx',
  'src/app/admin/tickets/page.tsx',
  'src/app/admin/transactions/page.tsx',
  'src/app/admin/ui-customization/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/cart/page.tsx',
  'src/app/checkout/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/deposit/page.tsx',
  'src/app/login/page.tsx',
  'src/app/products/page.tsx',
  'src/app/support/page.tsx',
  'src/components/admin/AdminKeysImport.tsx',
  'src/components/admin/AdminThemeToggle.tsx',
  'src/components/home/HomePageContent.tsx',
  'src/components/layout/Header.tsx',
  'src/components/ui/CartModal.tsx',
  'src/components/UIElementsProvider.tsx',
];

let fixedCount = 0;

for (const relPath of files) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`NOT FOUND: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  const fixes = [];

  // ===== FIX 1: Interface/type definitions with missing closing "}" =====
  // Pattern: "interface Foo { ... stuff }" with no closing "}" for the interface itself
  // This happens when the original had "}};" and our partial fix removed one "}"
  
  // Fix interface lines that end with a single "}" but need another for the enclosing object
  // e.g. "interface Transaction { ... user: { id: string; name: string; email: string }"
  // The "}" closes "user: {}", but the interface itself is missing its "}"
  content = content.replace(
    /^interface\s+\w+(?:\s+extends\s+\w+)?\s*\{([^}]*)\}\s*$/gm,
    (match, inner) => {
      // Check if there's a nested { } that might be consuming the only "}"
      const openBraces = (inner.match(/\{/g) || []).length;
      const closeBraces = (inner.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        // Missing closing braces - add them
        fixes.push('FIX1:interface-close');
        return `interface {${inner}}`;
      }
      return match;
    }
  );

  // Fix interface that has "};" at end -> change to "}"
  content = content.replace(
    /^interface\s+\w+(?:\s+extends\s+\w+)?\s*\{([^}]*)\};$/gm,
    (match, inner) => {
      fixes.push('FIX1b:interface-semicolon');
      return `interface {${inner}}`;
    }
  );

  // ===== FIX 2: Fix "};" within interface definitions =====
  // Pattern: "email: string}; items: {" -> "email: string; items: {"
  // The "}" before ";" within interface members is spurious
  // Match "};" followed by a word (next member), not at end of line
  content = content.replace(
    /(;\s*[^;{}\n]*?)(\})\s*;\s*([a-zA-Z_][a-zA-Z0-9_?]*(?:\s*[?:]\s*|\s*:))/g,
    (match, before, brace, after) => {
      fixes.push('FIX2:interface-middle');
      return before + '; ' + after;
    }
  );

  // ===== FIX 3: Remove spurious "}" at the start of lines =====
  // Pattern: "} const", "} try", "} return", "} function", etc.
  // EXCEPT "} catch", "} else", "} finally", "} while"
  const lines = content.split('\n');
  const newLines = [];
  let lineModified = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let changed = false;

    // Remove leading "}" when followed by a keyword (but not catch/else/finally/while)
    const leadingMatch = line.match(/^\}\s+/);
    if (leadingMatch) {
      const rest = line.slice(leadingMatch[0].length);
      if (!/^(catch|else|finally|while)\b/.test(rest)) {
        // Check if this "}" is actually a valid closing brace
        // Valid if the line before has an unclosed "{" 
        const prevLine = i > 0 ? lines[i - 1] : '';
        // We'll be conservative - only remove if the "}" is followed by
        // statement keywords like const/let/var/function/async/return/if/try/switch
        if (/^(const|let|var|function|async|return|if|try|switch|for|while|do)\b/.test(rest)) {
          line = leadingMatch[0].replace(/^\}\s+/, '');
          changed = true;
          fixes.push('FIX3:leading-brace');
        }
      }
    }

    // Remove bare "}" lines that are spurious
    if (/^\s*\}\s*$/.test(line) && line.trim() === '}') {
      // Check if this is likely spurious by looking at context
      // If prev line ends with ";" or "{" and next line starts with a statement keyword
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      if (
        (prevLine.endsWith(';') || prevLine.endsWith('{')) &&
        /^(const|let|var|function|import|export|return|if|switch|for)\b/.test(nextLine)
      ) {
        // Spurious bare brace - remove it
        fixes.push('FIX3b:bare-brace');
        continue; // skip this line
      }
    }

    newLines.push(line);
  }

  content = newLines.join('\n');

  // ===== FIX 4: Fix "if (cond);" followed by statement =====
  // Pattern: "if (cond);\nreturn;" -> "if (cond) return;"
  content = content.replace(
    /if\s*\(([^)]*)\);\s*\n\s*(return|set|fetch|handle|clear|sync|setTimeout|alert|confirm)/g,
    (match, cond, stmt) => {
      fixes.push('FIX4:if-semicolon');
      return `if (${cond}) ${stmt}`;
    }
  );

  // Same-line pattern: "if (cond);setState" -> "if (cond) setState"
  content = content.replace(
    /if\s*\(([^)]*)\);(set|fetch|handle|clear|sync|setTimeout|show|push|keys|log|close)/g,
    (match, cond, stmt) => {
      fixes.push('FIX4b:if-semicolon-inline');
      return `if (${cond}) ${stmt}`;
    }
  );

  // Pattern: "; return;" after if()
  content = content.replace(
    /if\s*\(([^)]*)\);\s*return;/g,
    (match, cond) => {
      fixes.push('FIX4c:if-return');
      return `if (${cond}) return;`;
    }
  );

  // ===== FIX 5: Fix "};" at end of lines =====
  // Various ending patterns: "};" -> "}" when it ends a block
  content = content.replace(/\}\s*;\s*$/gm, (match) => {
    fixes.push('FIX5:trailing-semicolon');
    return '}';
  });

  // ===== FIX 6: Fix "});" in control flow =====
  // ");  };" -> "); }"
  content = content.replace(/\);\s*\}\s*;\s*$/gm, (match) => {
    fixes.push('FIX6:closing-paren-brace');
    return '); }';
  });

  // ===== FIX 7: Fix object/array ending with comma before "}" =====
  // Pattern: ",}" at end of const declaration lines
  content = content.replace(/,\s*\}\s*$/gm, (match) => {
    fixes.push('FIX7:trailing-comma');
    return '}';
  });

  if (fixes.length > 0 && content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    fixedCount++;
    console.log(`\nFIXED: ${relPath}`);
    // Deduplicate fixes
    const uniqueFixes = [...new Set(fixes)];
    console.log(`  Fixes: ${uniqueFixes.join(', ')}`);
  } else {
    console.log(`OK: ${relPath}`);
  }
}

console.log(`\n=== Total files fixed: ${fixedCount} ===`);
