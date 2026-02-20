# Start Ollama + Rubis (Full Automation)
# Usage: .\start-rubis.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Rubis - Start Ollama + Application" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Ollama
Write-Host "[Checking] Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaVersion = & ollama --version 2>$null
    Write-Host "[OK] Ollama detected: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Ollama not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run install-ollama.ps1 first:" -ForegroundColor Yellow
    Write-Host "    .\install-ollama.ps1" -ForegroundColor Cyan
    exit 1
}

# Check Mistral model
Write-Host ""
Write-Host "[Checking] Mistral model..." -ForegroundColor Yellow
try {
    $models = & ollama list 2>$null | Select-String "mistral:7b-q4_0"
    if ($models) {
        Write-Host "[OK] Mistral 7B Q4 found" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Mistral not found, will download on first use" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Could not check models" -ForegroundColor Yellow
}

# Start Ollama in new terminal
Write-Host ""
Write-Host "[Starting] Ollama service in new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"
Write-Host "[OK] Ollama terminal opened" -ForegroundColor Green
Write-Host "    Give it 5-10 seconds to start..." -ForegroundColor Gray

# Wait for Ollama to be ready
Write-Host ""
Write-Host "[Waiting] Ollama startup (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test Ollama connection
$ollamaReady = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction SilentlyContinue
    $ollamaReady = $true
    Write-Host "[OK] Ollama is ready at localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not connect to Ollama, but continuing..." -ForegroundColor Yellow
}

# Install npm deps if needed
Write-Host ""
Write-Host "[Checking] npm dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "[Installing] npm packages..." -ForegroundColor Cyan
    & npm install
} else {
    Write-Host "[OK] Dependencies already installed" -ForegroundColor Green
}

# Start Rubis dev server
Write-Host ""
Write-Host "[Starting] Rubis dev server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   Rubis is starting on http://localhost:5173" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

& npm run dev
