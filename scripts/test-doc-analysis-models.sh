#!/usr/bin/env bash
set -u

CAMPAIGN_ID="${1:-138decc1-3917-4ab2-a52f-df75aa7be739}"
TEST_FILE="/tmp/rubis-doc-test.txt"

cat > "$TEST_FILE" << 'EOF'
Politique de sauvegarde COGIP
Version: v2.3
Date de publication: 2025-11-15
Auteurs: Alice Martin, Bob Dupont
Historique: v2.2 (2025-08-01) mise à jour du plan de reprise ; v2.3 (2025-11-15) ajout des contrôles de rétention.
Classification: Confidentiel

Ce document décrit les exigences de sauvegarde, de rétention et de restauration.
Il couvre les sauvegardes quotidiennes, hebdomadaires, le chiffrement et les tests de restauration trimestriels.
EOF

run_test () {
  local MODEL="$1"
  local SAFE
  SAFE=$(echo "$MODEL" | tr ':/' '__')

  echo "--- Testing model: $MODEL ---"
  curl -sS -X POST http://localhost:4000/config \
    -H 'Content-Type: application/json' \
    -d "{\"ollamaModel\":\"$MODEL\"}" > "/tmp/config-$SAFE.json"

  local start_ts end_ts rc http_code
  start_ts=$(date +%s)
  http_code=$(curl --max-time 420 -sS -o "/tmp/analyze-$SAFE.json" -w '%{http_code}' \
    -X POST http://localhost:4000/documents/analyze-upload \
    -F "campaignId=$CAMPAIGN_ID" \
    -F "file=@$TEST_FILE;type=text/plain")
  rc=$?
  end_ts=$(date +%s)

  echo "$((end_ts-start_ts))" > "/tmp/time-$SAFE.txt"
  echo "$rc" > "/tmp/rc-$SAFE.txt"
  echo "$http_code" > "/tmp/http-$SAFE.txt"

  echo "result model=$MODEL rc=$rc http=$http_code latency=$((end_ts-start_ts))s size=$(wc -c < "/tmp/analyze-$SAFE.json" 2>/dev/null || echo 0)"
}

run_test "qwen2.5:7b-instruct"
run_test "mistral:latest"

python3 - << 'PY'
import json, os
pairs=[('qwen2.5:7b-instruct','qwen2.5_7b-instruct'),('mistral:latest','mistral_latest')]
for model,safe in pairs:
    print(f'\n=== {model} ===')
    for kind in ['rc','http','time']:
        p=f'/tmp/{kind}-{safe}.txt'
        print(f'{kind}:', open(p).read().strip() if os.path.exists(p) else 'n/a')
    analyze=f'/tmp/analyze-{safe}.json'
    if not os.path.exists(analyze):
        print('analysis: missing file')
        continue
    raw=open(analyze,encoding='utf-8',errors='ignore').read()
    print('size:', len(raw))
    try:
        data=json.loads(raw) if raw.strip() else {}
    except Exception as e:
        print('invalid json:', e)
        print(raw[:400])
        continue
    m=data.get('metadata',{}) if isinstance(data,dict) else {}
    print('provider:', data.get('extractedBy') if isinstance(data,dict) else None)
    for k in ['title','version','publicationDate','authors','history','pageCount','sensitivity','summary']:
        print(f'{k}:', m.get(k))
PY
