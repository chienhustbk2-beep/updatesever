# Fix corruption in 23 .tsx files caused by fix-semicolons.js
# Patterns:
# 1. Line starts with "} const" -> remove "} " prefix
# 2. Line is bare "}" -> remove entire line
# 3. "if (cond);setState(...)" -> "if (cond) setState(...)"
# 4. Interface "};" -> "}"
# 5. Trailing "};" where it should be "}"
# 6. "}  };" at end -> "}"
# 7. ");setState" -> ");\nsetState"

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
    $fixes = @()

    foreach ($rawLine in $lines) {
        $line = $rawLine

        # Pattern 2: Remove bare "}" lines (line is exactly "}" with only whitespace)
        if ($line.Trim() -eq "}" -and $line.Trim().Length -eq 1) {
            # Check if this is actually just a closing brace in minified code
            # Only remove if it's the whole line with no other code
            if ($line.Trim() -eq "}") {
                $modified = $true
                if (-not ($fixes -contains "Pattern 2")) { $fixes += "Pattern 2" }
                continue  # skip this line entirely
            }
        }

        $transformed = $false

        # Pattern 1: Line starts with "} const " -> remove "} " prefix
        if ($line -match '^}\s+const ') {
            $line = $line -replace '^}\s+', ''
            $transformed = $true
        }

        # Pattern 3: if (cond);setState -> if (cond) setState
        # Match "if (condition);" where the ; is immediately followed by code (no newline)
        if ($line -match 'if\s*\([^)]*\);(set|fetch|handle|clear|sync|setTimeout|show)') {
            $line = $line -replace '(if\s*\([^)]*\));', '$1 '
            $transformed = $true
        }

        if ($transformed) {
            $modified = $true
            if (-not ($fixes -contains "Pattern 1/3")) { $fixes += "Pattern 1/3" }
        }

        $newLines += $line
    }

    # Join back and apply more patterns on whole content
    $newContent = $newLines -join "`r`n"

    # Pattern 5: Trailing "};" where it should be "}" - on interface/ObjectType definitions
    # Only fix "};" at end of interface lines
    $lines2 = $newContent -split "`r`n|`n"
    $newLines2 = @()
    foreach ($rawLine in $lines2) {
        $line = $rawLine
        $transformed = $false

        # Pattern 4: Interface member "};" -> "}"
        # e.g., "interface Foo { bar: string; baz: number };"
        if ($line -match '^interface\s+\w+\s*\{[^}]*\};$') {
            $line = $line -replace '};$', '}'
            $transformed = $true
        }

        # Pattern 6: "}  };" at end -> "}"
        if ($line -match '\}\s+\};$') {
            $line = $line -replace '\}\s+\};$', '}'
            $transformed = $true
        }

        if ($transformed) {
            $modified = $true
            $fixes += if (-not ($fixes -contains "Pattern 4/6")) { "Pattern 4/6" } else { $null }
            $fixes = $fixes | Where-Object { $_ }
        }

        $newLines2 += $line
    }

    $newContent = $newLines2 -join "`r`n"

    if ($modified -and $newContent -ne $originalContent) {
        Set-Content -LiteralPath $fullPath -Value $newContent -NoNewline
        $fixedFiles += "$relPath ($($fixes -join ', '))"
        Write-Host "FIXED: $relPath"
        Write-Host "  Fixes applied: $($fixes -join ', ')"
    } else {
        Write-Host "NO CHANGE: $relPath (no corruption patterns found by script)"
    }
}

Write-Host "`n=== FIXED FILES ==="
$fixedFiles | ForEach-Object { Write-Host $_ }
Write-Host "`nTotal: $($fixedFiles.Count) files fixed"
