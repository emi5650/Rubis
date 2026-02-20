# Simple Git Init + Commit without external install
# Just git commands to run directly

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Rubis - Git Commit to GitHub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Search for git in common locations
$gitPaths = @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "${env:ProgramFiles}\Git\bin\git.exe",
    "${env:ProgramFiles(x86)}\Git\bin\git.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Git\bin\git.exe"
)

$gitPath = $null
Write-Host "[Searching] for Git installation..." -ForegroundColor Yellow

foreach ($path in $gitPaths) {
    if (Test-Path $path) {
        $gitPath = $path
        Write-Host "[OK] Found Git at: $path" -ForegroundColor Green
        break
    }
}

if (-not $gitPath) {
    Write-Host ""
    Write-Host "[ERROR] Git not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Setup Required:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Download Git from https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. Run installer (accept defaults)" -ForegroundColor White
    Write-Host "3. Restart PowerShell" -ForegroundColor White
    Write-Host "4. Go to c:\VS_Code\Rubis" -ForegroundColor White
    Write-Host "5. Paste these commands:" -ForegroundColor White
    Write-Host ""
    Write-Host "git config user.name 'Rubis'" -ForegroundColor Cyan
    Write-Host "git config user.email 'rubis@audit.local'" -ForegroundColor Cyan
    Write-Host "git init" -ForegroundColor Cyan
    Write-Host "git add ." -ForegroundColor Cyan
    Write-Host 'git commit -m "Initial commit: Rubis offline-first audit tool"' -ForegroundColor Cyan
    Write-Host "git remote add origin git@github.com:emi5650/Rubis.git" -ForegroundColor Cyan
    Write-Host "git branch -M main" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Git found, proceed
Write-Host ""
Write-Host "[Configuring] Git repository..." -ForegroundColor Yellow
Write-Host ""

# Configure git
& $gitPath config user.name "Rubis"
& $gitPath config user.email "rubis@audit.local"

# Initialize
Write-Host "[Initializing] Repository..." -ForegroundColor Cyan
& $gitPath init

# Add files
Write-Host "[Adding] Files to staging..." -ForegroundColor Cyan
& $gitPath add .

# Commit
Write-Host "[Committing]..." -ForegroundColor Cyan
$message = @"
Initial commit: Rubis offline-first audit tool

Features:
- Dual AI strategy (OpenAI + Ollama local)
- Automated setup scripts (install-ollama.ps1, start-rubis.ps1)
- 100% offline operation after initial setup
- Complete audit workflow (5 phases + sprint 1)
- Dashboard with KPIs and conformity matrix
- Export capabilities (CSV, DOCX, Markdown)
- Audit logging and tracking
- Question generation from referential (PDF/Excel)

Tech Stack:
- API: Node.js + Fastify + lowdb
- Frontend: React + Vite + TypeScript
- Local persistence: JSON database
- AI: OpenAI API or local Ollama (Mistral 7B Q4)

Documentation:
- GETTING_STARTED.md - Quick start guide
- SETUP_OLLAMA.md - Local AI setup
- SETUP_OPENAI.md - Cloud AI setup
- README.md - Architecture overview
"@

& $gitPath commit -m $message

# Add remote
Write-Host "[Adding] Remote repository..." -ForegroundColor Cyan
& $gitPath remote add origin git@github.com:emi5650/Rubis.git

# Set main branch
Write-Host "[Setting] Main branch..." -ForegroundColor Cyan
& $gitPath branch -M main

# Push
Write-Host ""
Write-Host "[Pushing] to GitHub..." -ForegroundColor Cyan
Write-Host "Note: This requires SSH or HTTPS access to GitHub" -ForegroundColor Gray
Write-Host ""

try {
    & $gitPath push -u origin main
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "   Success! Pushed to GitHub" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: https://github.com/emi5650/Rubis" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "[ERROR] Push failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. SSH: Ensure SSH key is added to GitHub" -ForegroundColor White
    Write-Host "   ssh -T git@github.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. HTTPS: Use token instead" -ForegroundColor White
    Write-Host "   git remote set-url origin https://github.com/emi5650/Rubis.git" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Check status:" -ForegroundColor White
    Write-Host "   git status" -ForegroundColor Gray
    Write-Host "   git remote -v" -ForegroundColor Gray
}
