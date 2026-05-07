<#
.SYNOPSIS
    Stamp today's date in MEMORY.md, optionally update "What was done", then
    commit and push.

.DESCRIPTION
    Helper for the end-of-session habit described in AGENTS.md. Touches only
    MEMORY.md — other staged or unstaged changes are left alone.

.PARAMETER Message
    Short description of this session's work. If omitted, the date is stamped
    and MEMORY.md is opened for manual editing before commit.

.EXAMPLE
    .\update-memory.ps1 "Wired Reference page categories"

.EXAMPLE
    .\update-memory.ps1
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Message
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$memoryPath = Join-Path $repoRoot 'MEMORY.md'

if (-not (Test-Path $memoryPath)) {
    Write-Error "MEMORY.md not found at $memoryPath"
    exit 1
}

# Stamp date; replace "What was done" if message given
$today = Get-Date -Format 'yyyy-MM-dd'
$content = Get-Content -Path $memoryPath -Raw

$content = $content -replace '(?m)^- Date:.*$', "- Date: $today"

if ($Message) {
    # Escape literal $ in user-supplied message so regex replacement is safe
    $escaped = $Message -replace '\$', '$$$$'
    $content = $content -replace '(?m)^- What was done:.*$', "- What was done: $escaped"
}

# Write back as UTF-8 without BOM; preserves existing line endings in $content
[System.IO.File]::WriteAllText($memoryPath, $content, [System.Text.UTF8Encoding]::new($false))

if (-not $Message) {
    Write-Host "Date stamped. Edit MEMORY.md, save, then come back here." -ForegroundColor Cyan
    Start-Process $memoryPath
    Read-Host "Press Enter when you have saved your edits (Ctrl+C to abort)"
}

# Show diff
Write-Host "`n--- Diff for MEMORY.md ---" -ForegroundColor Cyan
git --no-pager diff --exit-code -- MEMORY.md
$hasChanges = $LASTEXITCODE -ne 0
Write-Host ""

if (-not $hasChanges) {
    Write-Host "No changes to MEMORY.md. Nothing to commit." -ForegroundColor Yellow
    exit 0
}

$confirm = Read-Host "Commit and push? (y/N)"
if ($confirm -notin @('y', 'Y')) {
    Write-Host "Aborted. MEMORY.md still has your edits." -ForegroundColor Yellow
    exit 0
}

# Stage and commit only MEMORY.md (path-restricted commit ignores other staged changes)
git add MEMORY.md
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$commitMessage = if ($Message) { "Update MEMORY.md: $Message" } else { "Update MEMORY.md" }
git commit -m $commitMessage -- MEMORY.md
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

git push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDone." -ForegroundColor Green
