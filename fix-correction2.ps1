# Second pass - fix remaining corruption patterns
# 1. Spurious "}" at line start (unless followed by catch/else/finally/while)
# 2. ";return" after if() on next line
# 3. Remaining "};" at end of lines where it should be "}"
# 4. "}," at end of object/const lines -> "}"
# 5. ");  };"  pattern -> "); }"

$root = "C:\Users\Chien Hust\ecommerce-digital"

$files = @(
    "src/app/admin/audit-logs/page.tsx",
    "src/app/admin/categories/page.tsx",
    "src/app/admin/orders/page.tsx",
    "src/app/admin/page.tsx",
    "src/app/admin/products/page.tsx",
    "src/app/admin/settings/page.tsx",
    "src/app/admin/tickets/page.tsx",
    "src/app/admin/transactions/page.tsx",
    "src/app/admin/ui-customization/page.tsx",
    "src/app/admin/users/page.tsx",
    "src/app/cart/page.tsx",
    "src/app/checkout/page.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/deposit/page.tsx",
    "src/app/login/page.tsx",
    "src/app/products/page.tsx",
    "src/app/support/page.tsx",
    "src/components/admin/AdminKeysImport.tsx",
    "src/components/admin/AdminThemeToggle.tsx",
    "src/components/home/HomePageContent.tsx",
    "src/components/layout/Header.tsx",
    "src/components/ui/CartModal.tsx",
    "src/components/UIElementsProvider.tsx"
)

$fixedFiles = @()
$fixDescriptions = @{}

foreach ($relPath in $files) {
    $fullPath = Join-Path $root $relPath
    if (-not (Test-Path $fullPath)) {
        Write-Warning "NOT FOUND: $fullPath"
        continue
    }

    $content = Get-Content -LiteralPath $fullPath -Raw
    $originalContent = $content
    $lines = $content -split "`r`n|`n"
    $newLines = @()
    $modified = $false
    $localFixes = @()

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $transformed = $false

        # Pattern 1: Line starts with "} " where } is spurious
        # Keep "} catch", "} else", "} finally", "} while" as legitimate
        if ($line -match '^}\s+(catch|else|finally|while)\b') {
            # Legitimate closing brace - keep as is
        } elseif ($line -match '^}\s+(\w+)') {
            # Spurious "}" at start - remove "} " prefix
            $line = $line -replace '^}\s+', ''
            $transformed = $true
            if (-not ($localFixes -contains "P1")) { $localFixes += "P1" }
        }

        # Pattern 3/4/5/6: Clean up ";}" patterns
        # "};" at end of line -> "}"
        # But not if it's part of a string or JSX expression
        # Various patterns like ");  };" -> ");}"
        # "}  };" -> "}"
        # "};" at end of object/function -> "}"

        # Subpattern: trailing "});" -> "})"
        if ($line -match '}\);\s*$') {
            $line = $line -replace '}\);\s*$', '})'
            $transformed = $true
        }

        # Subpattern: trailing "};" -> "}"
        if ($line -match '([^:]);\s*$' -and -not ($line -match '^interface\s') -and -not ($line -match '^type\s')) {
            # Only fix "};" when there's a "}" before the ";"
            if ($line -match '};?\s*$' -and -not ($line -match '["\x27];\s*$')) {
                # Check if it looks like "objectOrSomething };"
                if ($line -match '\}\s*;\s*$') {
                    $line = $line -replace '\}\s*;\s*$', '}'
                    $transformed = $true
                }
            }
        }

        # Subpattern: "}," at end of line (from const declarations)
        if ($line -match '^const\s+\w+.*,\s*$') {
            # Object ends with "," - might need fixing
            if ($line -match '},\s*$') {
                # Simple const with trailing comma - could be original, leave it
                # Actually check if line has template literal or JSX
            }
        }

        # Subpattern: bare "}" followed by "}" on next line (double closing)
        if ($line -match '^\s*\}\s*$' -and $i + 1 -lt $lines.Count) {
            $nextLine = $lines[$i + 1]
            if ($nextLine -match '^\s*\}\s*$') {
                # Two consecutive bare "}" - remove one
                # This is Pattern 2
            }
        }

        if ($transformed) {
            $modified = $true
        }

        $newLines += $line
    }

    # Join back and do whole-content patterns
    $newContent = $newLines -join "`r`n"

    # Whole-content patterns
    $wholeModified = $false

    # Fix ";setState" to " setState" in if() context
    if ($newContent -match 'if\s*\([^)]*\);(set|fetch|handle|clear|sync|setTimeout)') {
        $newContent = $newContent -replace '(if\s*\([^)]*\));', '$1 '
        $wholeModified = $true
    }

    # Fix ";return" at start of line (after if() with ;)
    if ($newContent -match 'if\s*\([^)]*\);\s*\n\s*return') {
        $newContent = $newContent -replace '(if\s*\([^)]*\));\s*\n\s*return', '$1 return'
        $wholeModified = $true
    }
    
    # Fix ";return" followed by ; on same line
    if ($newContent -match 'if\s*\([^)]*\);\s*return;') {
        $newContent = $newContent -replace '(if\s*\([^)]*\));\s*return;', '$1 return;'
        $wholeModified = $true
    }

    # Fix "; return" with space
    if ($newContent -match 'if\s*\([^)]*\);\s*return ') {
        $newContent = $newContent -replace '(if\s*\([^)]*\));\s*return ', '$1 return '
        $wholeModified = $true
    }

    # Fix "}  };" -> "}"
    $newContent = $newContent -replace '\}\s+\};', '}'

    if ($wholeModified) {
        $modified = $true
        if (-not ($localFixes -contains "P3/P5")) { $localFixes += "P3/P5" }
    }

    if ($modified -and $newContent -ne $originalContent) {
        Set-Content -LiteralPath $fullPath -Value $newContent -NoNewline
        $fixedFiles += "$relPath ($($localFixes -join ', '))"
        Write-Host "FIXED: $relPath - $($localFixes -join ', ')"
    } else {
        if ($modified) {
            Write-Host "NO CHANGE NEEDED: $relPath (patterns found but content unchanged)"
        } else {
            Write-Host "NO ISSUES: $relPath"
        }
    }
}

Write-Host "`n=== FIXED FILES ==="
$fixedFiles | ForEach-Object { Write-Host $_ }
Write-Host "`nTotal: $($fixedFiles.Count) files fixed"
