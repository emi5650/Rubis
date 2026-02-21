# SSH Key Setup for GitHub
# Secure Ed25519 SSH Key Generation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SSH Setup for GitHub Authentication" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$sshDir = "$env:USERPROFILE\.ssh"
$privateKey = "$sshDir\id_ed25519"
$publicKey = "$sshDir\id_ed25519.pub"

# Ensure .ssh directory exists
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    Write-Host "[OK] Created .ssh directory"
}

# Check if key already exists
if ((Test-Path $privateKey) -and (Test-Path $publicKey)) {
    Write-Host "[OK] SSH keys already exist at $privateKey" -ForegroundColor Green
} else {
    Write-Host "[INFO] Generating Ed25519 SSH key..."
    
    # Windows 10/11 should have ssh-keygen
    $sshKeygen = Get-Command ssh-keygen -ErrorAction SilentlyContinue
    if (-not $sshKeygen) {
        Write-Host "[ERROR] ssh-keygen not found. Installing OpenSSH Server is required." -ForegroundColor Red
        Write-Host "[HELP] Follow: https://docs.microsoft.com/windows-server/administration/openssh/openssh_install_firsttime"
        exit 1
    }

    # Generate key with empty passphrase using stdin redirection
    cmd /c "echo | echo | ssh-keygen -t ed25519 -C ""erwan.michel@soprasteria.com"" -f ""$privateKey"" -N """" 2>&1"
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $publicKey)) {
        Write-Host "[OK] SSH key generated successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] SSH key generation failed" -ForegroundColor Red
        exit 1
    }
}

# Display public key for GitHub
Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "GitHub SSH Public Key (copy this):" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Get-Content $publicKey
Write-Host "========================================" -ForegroundColor Yellow

# Instructions
Write-Host "`n[NEXT STEPS]:" -ForegroundColor Cyan
Write-Host "1. Copy the public key above (or run: cat $publicKey)" -ForegroundColor White
Write-Host "2. Go to: https://github.com/settings/keys" -ForegroundColor White
Write-Host "3. Click 'New SSH key'" -ForegroundColor White
Write-Host "4. Paste the key and click 'Add SSH key'" -ForegroundColor White
Write-Host "5. Run: git push -u origin main" -ForegroundColor White

# Test SSH connection
Write-Host "`n[Testing] SSH connection to GitHub..." -ForegroundColor Cyan
$ssh = ssh -T git@github.com 2>&1
if ($ssh -match "successfully authenticated") {
    Write-Host "[OK] SSH authentication verified" -ForegroundColor Green
    Write-Host "`n[Ready] Pushing to GitHub..."
    cd c:\VS_Code\Rubis
    git push -u origin main
} else {
    Write-Host "[INFO] SSH key not yet added to GitHub account" -ForegroundColor Yellow
    Write-Host "[ACTION] Follow steps 1-4 above, then run: git push -u origin main" -ForegroundColor Yellow
}
