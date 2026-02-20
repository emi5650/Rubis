# Setup Ollama + Mistral 7B Q4 for Rubis
# Usage: .\setup-ollama.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Rubis - Ollama Setup Wizard for Windows 11" -ForegroundColor Cyan
Write-Host "   (Mistral 7B Q4 - Local AI, 100% Offline)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is installed
Write-Host "[Checking] Ollama installation..." -ForegroundColor Yellow

try {
    $ollamaVersion = & ollama --version 2>$null
    Write-Host "[OK] Ollama detected: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Ollama not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual installation required:" -ForegroundColor Yellow
    Write-Host "1. Go to https://ollama.ai/download" -ForegroundColor White
    Write-Host "2. Download Ollama Windows" -ForegroundColor White
    Write-Host "3. Install and re-run this script" -ForegroundColor White
    exit 1
}

# Check disk space
Write-Host ""
Write-Host "[Checking] Disk space..." -ForegroundColor Yellow
$diskFree = (Get-PSDrive C).Free / 1GB
Write-Host "Free space: $([math]::Round($diskFree, 2)) GB" -ForegroundColor White

if ($diskFree -lt 5) {
    Write-Host "[ERROR] Insufficient space (need 5GB minimum)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Space OK" -ForegroundColor Green

# Download model
Write-Host ""
Write-Host "[Downloading] Mistral 7B Q4..." -ForegroundColor Yellow
Write-Host "   (This may take 15-30 min, depends on speed)" -ForegroundColor Gray
Write-Host ""

try {
    & ollama pull mistral:7b-q4_0
    Write-Host ""
    Write-Host "[OK] Mistral 7B downloaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Download failed" -ForegroundColor Red
    exit 1
}

# Create .env if needed
Write-Host ""
Write-Host "[Config] Rubis setup..." -ForegroundColor Yellow

$apiPath = "$PSScriptRoot\apps\api"
$envFile = "$apiPath\.env"
$envExample = "$apiPath\.env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "[OK] .env created from .env.example" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] .env.example not found" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] .env already exists" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1) Start Ollama (open new PowerShell):" -ForegroundColor White
Write-Host "    ollama serve" -ForegroundColor Cyan
Write-Host ""
Write-Host "2) Start Rubis (in this terminal):" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3) Open browser:" -ForegroundColor White
Write-Host "    http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tips:" -ForegroundColor White
Write-Host "   - Verify Ollama is running before testing" -ForegroundColor Gray
Write-Host "   - First question: 15-30s (model loading)" -ForegroundColor Gray
Write-Host "   - Next questions: 5-10s each" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation: SETUP_OLLAMA.md" -ForegroundColor White
