# Install Ollama for Windows 11
# Usage: .\install-ollama.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Ollama Installer for Windows 11" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if already installed
Write-Host "[Checking] Ollama already installed?" -ForegroundColor Yellow
try {
    $ollamaVersion = & ollama --version 2>$null
    Write-Host "[OK] Ollama already installed: $ollamaVersion" -ForegroundColor Green
    Write-Host ""
    $continue = Read-Host "Skip installation? (y/n)"
    if ($continue -eq "y") {
        Write-Host "[Info] Running setup-ollama.ps1 next..." -ForegroundColor Cyan
        & ".\setup-ollama.ps1"
        exit 0
    }
} catch {
    Write-Host "[Info] Ollama not found, will install" -ForegroundColor Gray
}

# Check if running as admin
Write-Host ""
Write-Host "[Checking] Admin privileges..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "[WARNING] This script requires admin privileges" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Attempting to elevate..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit 0
}
Write-Host "[OK] Running as admin" -ForegroundColor Green

# Check disk space
Write-Host ""
Write-Host "[Checking] Disk space..." -ForegroundColor Yellow
$diskFree = (Get-PSDrive C).Free / 1GB
Write-Host "Free space on C:: $([math]::Round($diskFree, 2)) GB" -ForegroundColor White

if ($diskFree -lt 2) {
    Write-Host "[ERROR] Insufficient space (need 2GB minimum)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Space OK" -ForegroundColor Green

# Download Ollama
Write-Host ""
Write-Host "[Downloading] Ollama installer..." -ForegroundColor Yellow
$downloadUrl = "https://ollama.ai/download/OllamaSetup.exe"
$installerPath = "$env:TEMP\OllamaSetup.exe"

try {
    Write-Host "Downloading from: $downloadUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Downloaded: $installerPath" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual download:" -ForegroundColor Yellow
    Write-Host "1. Go to https://ollama.ai/download" -ForegroundColor White
    Write-Host "2. Download OllamaSetup.exe" -ForegroundColor White
    Write-Host "3. Run installer" -ForegroundColor White
    exit 1
}

# Install Ollama
Write-Host ""
Write-Host "[Installing] Running Ollama installer..." -ForegroundColor Yellow
Write-Host "Please complete the installation wizard" -ForegroundColor Gray
Write-Host ""

try {
    & $installerPath
    Write-Host ""
    Write-Host "[OK] Ollama installer completed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Installation failed: $_" -ForegroundColor Red
    exit 1
}

# Wait for Ollama to be available
Write-Host ""
Write-Host "[Waiting] Ollama service startup..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ollamaReady = $false

while ($attempt -lt $maxAttempts -and -not $ollamaReady) {
    try {
        $version = & ollama --version 2>$null
        if ($version) {
            $ollamaReady = $true
            Write-Host "[OK] Ollama ready: $version" -ForegroundColor Green
        }
    } catch {
        # Not ready yet
    }
    
    if (-not $ollamaReady) {
        Start-Sleep -Seconds 1
        $attempt++
        Write-Host -NoNewline "."
    }
}

if (-not $ollamaReady) {
    Write-Host ""
    Write-Host "[WARNING] Ollama detection timeout, but installer should have completed" -ForegroundColor Yellow
    Write-Host "Try restarting PowerShell or your computer" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Ollama Installation Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Run setup-ollama.ps1
Write-Host "[Next] Running setup-ollama.ps1 to download Mistral..." -ForegroundColor Cyan
Write-Host ""
& ".\setup-ollama.ps1"
