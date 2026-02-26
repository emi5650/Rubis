param(
    [string]$Distro = "Ubuntu",
    [switch]$PostInstallOnly,
    [switch]$NoRestart
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Message)
    Write-Host "" 
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Start-ElevatedSessionIfNeeded {
    if (Test-Administrator) {
        return
    }

    Write-Host "[WARNING] Admin privileges required. Relaunching elevated..." -ForegroundColor Yellow
    $argList = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$PSCommandPath`"",
        "-Distro", "`"$Distro`""
    )

    if ($PostInstallOnly) {
        $argList += "-PostInstallOnly"
    }

    if ($NoRestart) {
        $argList += "-NoRestart"
    }

    Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList $argList
    exit 0
}

function Invoke-Wsl {
    param([string[]]$WslParams)

    $output = & wsl.exe @WslParams 2>&1
    return @{ ExitCode = $LASTEXITCODE; Output = ($output -join "`n") }
}

function Test-WslReady {
    $status = Invoke-Wsl -WslParams @("--status")
    if ($status.ExitCode -eq 0) {
        return $true
    }

    $list = Invoke-Wsl -WslParams @("-l", "-v")
    if ($list.ExitCode -eq 0) {
        return $true
    }

    return $false
}

function Test-DistroInstalled {
    param([string]$DistroName)

    $list = Invoke-Wsl -WslParams @("-l", "-v")
    if ($list.ExitCode -ne 0) {
        return $false
    }

    return $list.Output -match "(?im)^\s*\*?\s*$([regex]::Escape($DistroName))\s+"
}

function Install-WslIfNeeded {
    Write-Section "WSL2 Bootstrap - Windows Phase"

    if (Test-WslReady -and (Test-DistroInstalled -DistroName $Distro)) {
        Write-Host "[OK] WSL and distro '$Distro' already detected." -ForegroundColor Green
        return
    }

    Write-Host "[INFO] Installing/repairing WSL + distro '$Distro'..." -ForegroundColor Yellow
    Write-Host "[INFO] Command: wsl --install -d $Distro" -ForegroundColor Gray

    $install = Invoke-Wsl -WslParams @("--install", "-d", $Distro)

    if ($install.ExitCode -ne 0) {
        Write-Host "[ERROR] WSL install command failed." -ForegroundColor Red
        Write-Host $install.Output -ForegroundColor DarkGray
        Write-Host "Try manually in admin PowerShell:" -ForegroundColor Yellow
        Write-Host "  wsl --install -d $Distro" -ForegroundColor Cyan
        exit 1
    }

    Write-Host "[OK] WSL install command executed." -ForegroundColor Green

    if (-not $NoRestart) {
        Write-Host "[INFO] Restart required to finalize WSL features." -ForegroundColor Yellow
        Write-Host "[INFO] System will restart in 10 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        shutdown.exe /r /t 0
        exit 0
    }

    Write-Host "[WARNING] Restart skipped because -NoRestart was used." -ForegroundColor Yellow
    Write-Host "Please restart manually, then rerun:" -ForegroundColor Yellow
    Write-Host "  .\bootstrap-wsl2.ps1 -PostInstallOnly" -ForegroundColor Cyan
    exit 0
}

function Invoke-PostInstallPhase {
    Write-Section "WSL2 Bootstrap - Post-Install Phase"

    if (-not (Test-WslReady)) {
        Write-Host "[ERROR] WSL is not ready yet." -ForegroundColor Red
        Write-Host "Run first:" -ForegroundColor Yellow
        Write-Host "  wsl --install -d $Distro" -ForegroundColor Cyan
        Write-Host "Then restart Windows and rerun this script." -ForegroundColor Yellow
        exit 1
    }

    if (-not (Test-DistroInstalled -DistroName $Distro)) {
        Write-Host "[ERROR] Distro '$Distro' is not installed." -ForegroundColor Red
        Write-Host "Install it with:" -ForegroundColor Yellow
        Write-Host "  wsl --install -d $Distro" -ForegroundColor Cyan
        exit 1
    }

    $linuxCommand = @'
set -e

if ! command -v sudo >/dev/null 2>&1; then
  echo "[ERROR] sudo not found in distro" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[INFO] Installing Node.js 20 in WSL..."
  sudo apt-get update
  sudo apt-get install -y curl ca-certificates
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs build-essential
fi

echo "[INFO] Node version: $(node -v)"
echo "[INFO] npm version: $(npm -v)"

cd /mnt/c/VS_Code/Rubis
bash ./migrate-to-wsl2.sh

echo "[OK] Migration complete."
echo "[NEXT] In WSL:"
echo "  cd ~/Rubis"
echo "  ./install-ollama.sh"
echo "  ./start-rubis.sh"
'@

    Write-Host "[INFO] Running post-install commands inside WSL distro '$Distro'..." -ForegroundColor Yellow
    Write-Host "[INFO] You may be prompted for your Linux sudo password." -ForegroundColor Gray

    & wsl.exe -d $Distro -- bash -lc $linuxCommand
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Post-install commands failed in WSL." -ForegroundColor Red
        Write-Host "Run Ubuntu once manually, finish user setup, then rerun:" -ForegroundColor Yellow
        Write-Host "  .\bootstrap-wsl2.ps1 -PostInstallOnly" -ForegroundColor Cyan
        exit 1
    }

    Write-Host "[OK] WSL2 migration workflow completed." -ForegroundColor Green
}

Start-ElevatedSessionIfNeeded

if ($PostInstallOnly) {
    Invoke-PostInstallPhase
    exit 0
}

Install-WslIfNeeded
Invoke-PostInstallPhase
