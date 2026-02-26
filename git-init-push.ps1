# Install Git + Make initial commit and push to GitHub
# Usage: .\git-init-push.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Git Setup + Commit + Push to GitHub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
Write-Host "[Checking] Git installation..." -ForegroundColor Yellow
try {
    $gitVersion = & git --version 2>$null
    Write-Host "[OK] Git detected: $gitVersion" -ForegroundColor Green
    $gitInstalled = $true
} catch {
    Write-Host "[INFO] Git not found, will install" -ForegroundColor Gray
    $gitInstalled = $false
}

# Install Git if needed
if (-not $gitInstalled) {
    Write-Host ""
    Write-Host "[Installing] Git for Windows..." -ForegroundColor Yellow
    Write-Host "Downloading installer..." -ForegroundColor Gray
    
    $downloadUrl = "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe"
    $installerPath = "$env:TEMP\GitInstaller.exe"
    
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
        Write-Host "Running Git installer..." -ForegroundColor Cyan
        & $installerPath
        
        # Wait for installer to complete
        Write-Host "Waiting for Git installation to complete..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        
        # Add Git to PATH for this session
        $env:Path = "C:\Program Files\Git\bin;C:\Program Files\Git\cmd;" + $env:Path
        Write-Host "[OK] Git installed and added to PATH" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Installation failed: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Manual installation:" -ForegroundColor Yellow
        Write-Host "1. Go to https://git-scm.com/download/win" -ForegroundColor White
        Write-Host "2. Download and install Git" -ForegroundColor White
        Write-Host "3. Re-run this script" -ForegroundColor White
        exit 1
    }
}

Write-Host ""
Write-Host "[Configuring] Git repository..." -ForegroundColor Yellow

# Use full path to git
$gitPath = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $gitPath)) {
    Write-Host "[ERROR] Git not found at $gitPath" -ForegroundColor Red
    exit 1
}

# Initialize repo
& $gitPath init
& $gitPath config user.name "Rubis Audit Tool"
& $gitPath config user.email "rubis@audit.local"

# Add all files
Write-Host "[Adding] Files to staging..." -ForegroundColor Cyan
& $gitPath add .

# Create commit
Write-Host "[Committing]..." -ForegroundColor Cyan
$commitMessage = @"
Initial commit: Rubis offline-first audit tool

Features:
- Dual AI strategy (OpenAI + Ollama local)
- Automated setup (install-ollama.ps1, start-rubis.ps1)
- 100% offline operation after setup
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

& $gitPath commit -m $commitMessage

# Add remote
Write-Host ""
Write-Host "[Adding] Remote repository..." -ForegroundColor Cyan
& $gitPath remote add origin git@github.com:emi5650/Rubis.git

# Set main branch
Write-Host "[Setting] Main branch..." -ForegroundColor Cyan
& $gitPath branch -M main

# Push to GitHub
Write-Host ""
Write-Host "[Pushing] to GitHub..." -ForegroundColor Cyan
Write-Host "This may take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

try {
    & $gitPath push -u origin main
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "   Success! Pushed to GitHub" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL:" -ForegroundColor White
    Write-Host "https://github.com/emi5650/Rubis" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "[ERROR] Push failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verify SSH key configured: ssh -T git@github.com" -ForegroundColor White
    Write-Host "2. Or use HTTPS instead: git remote set-url origin https://github.com/emi5650/Rubis.git" -ForegroundColor White
    Write-Host "3. Then retry: git push -u origin main" -ForegroundColor White
}
