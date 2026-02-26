# Compare Mistral vs Gemma3 on the same prompt
# Saves outputs and timing to model-tests/

$ErrorActionPreference = "Stop"

function Resolve-OllamaExe {
    $cmd = Get-Command ollama -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidate = "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
    if (Test-Path $candidate) { return $candidate }
    throw "ollama.exe not found. Install Ollama or add it to PATH."
}

function Wait-ForModel($ollamaExe, $model) {
    while ($true) {
        $list = & $ollamaExe list 2>$null | Out-String
        if ($list -match [Regex]::Escape($model)) { break }
        Write-Host "[WAIT] $model not yet available. Retrying in 30s..."
        Start-Sleep -Seconds 30
    }
}

function Pull-Model($ollamaExe, $model) {
    Write-Host "[PULL] $model"
    & $ollamaExe pull $model
}

function Evaluate-Json($filePath) {
    $result = [PSCustomObject]@{
        IsValidJson = $false
        ItemCount = 0
        MissingKeys = @()
        Error = ""
    }

    try {
        $raw = Get-Content $filePath -Raw
        $data = $raw | ConvertFrom-Json
        if ($data -is [System.Array]) {
            $result.ItemCount = $data.Count
        } else {
            $result.ItemCount = 1
            $data = @($data)
        }

        $required = @("text", "guidance", "theme")
        $missing = New-Object System.Collections.Generic.List[string]
        foreach ($item in $data) {
            foreach ($key in $required) {
                if (-not ($item.PSObject.Properties.Name -contains $key)) {
                    $missing.Add($key)
                }
            }
        }

        $result.IsValidJson = $true
        $result.MissingKeys = $missing | Select-Object -Unique
        return $result
    } catch {
        $result.Error = $_.Exception.Message
        return $result
    }
}

function Compute-Score($isValidJson, $itemCount, $seconds) {
    # Higher is better. Penalize invalid JSON and slow responses.
    if (-not $isValidJson) { return 0 }
    $itemsScore = [Math]::Min($itemCount, 5) * 20
    $timePenalty = [Math]::Min([Math]::Max($seconds - 5, 0) * 2, 40)
    return [Math]::Max($itemsScore - $timePenalty, 0)
}

$ollamaExe = Resolve-OllamaExe
$testsDir = "C:\VS_Code\Rubis\model-tests"
New-Item -ItemType Directory -Path $testsDir -Force | Out-Null

# 1) Ensure Mistral is present (wait for active download to finish)
Wait-ForModel $ollamaExe "mistral"

# 2) Pull Gemma3:4b after Mistral finishes
Pull-Model $ollamaExe "gemma3:4b"

# 3) Test prompt (same for both models)
$prompt = @'
You are an audit assistant. Generate 5 French audit questions from this criterion:
"Controle d'acces et gestion des identites".
Return ONLY a JSON array of objects with keys: text, guidance, theme.
No markdown.
'@

$models = @("mistral", "gemma3:4b")
$results = New-Object System.Collections.Generic.List[object]

foreach ($model in $models) {
    Write-Host "[RUN] $model"
    $outputFile = Join-Path $testsDir ("$($model -replace ':','_').txt")
    $time = Measure-Command {
        $output = & $ollamaExe run $model $prompt
        $output | Out-File -FilePath $outputFile -Encoding utf8
    }
    $chars = (Get-Content $outputFile -Raw).Length
    $score = Evaluate-Json $outputFile
    $overall = Compute-Score $score.IsValidJson $score.ItemCount $time.TotalSeconds
    if ($score.IsValidJson) {
        $missingInfo = if ($score.MissingKeys.Count -gt 0) { "missing: $($score.MissingKeys -join ',')" } else { "keys OK" }
        Write-Host ("[DONE] {0} | {1:N1}s | {2} chars | {3} | {4} items | {5} | score {6}" -f $model, $time.TotalSeconds, $chars, $outputFile, $score.ItemCount, $missingInfo, $overall)
    } else {
        Write-Host ("[DONE] {0} | {1:N1}s | {2} chars | {3} | invalid JSON: {4} | score {5}" -f $model, $time.TotalSeconds, $chars, $outputFile, $score.Error, $overall)
    }

    $results.Add([PSCustomObject]@{
        Model = $model
        Seconds = [Math]::Round($time.TotalSeconds, 1)
        Chars = $chars
        IsValidJson = $score.IsValidJson
        ItemCount = $score.ItemCount
        MissingKeys = ($score.MissingKeys -join ",")
        Score = $overall
        OutputFile = $outputFile
        Error = $score.Error
    }) | Out-Null
}

$csvPath = Join-Path $testsDir "model-results.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

Write-Host "\nTest complete. Compare the JSON quality and time in model-tests/."
Write-Host "CSV summary: $csvPath"
