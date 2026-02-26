// Test both Mistral and Gemma3 via Ollama API directly
// This simulates real Rubis usage through the openai.ts service

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const DEFAULT_MODELS = ["mistral", "qwen2.5:7b-instruct", "gemma3:4b"];
const QUICK_MODELS = ["mistral", "qwen2.5:7b-instruct"];
const cliArgs = process.argv.slice(2);
const isQuickMode = cliArgs.includes("--quick") || process.env.QUICK_BENCH === "1";
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || (isQuickMode ? 15000 : 45000));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("fetch failed");
}

async function waitForOllamaReady() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const response = await fetchWithRetry(`${OLLAMA_URL}/api/tags`, { method: "GET" }, 1);
      if (response.ok) {
        return true;
      }
    } catch {
      // ignore and retry
    }
    await sleep(500);
  }

  return false;
}

function getModelsToTest() {
  if (isQuickMode) {
    return QUICK_MODELS;
  }

  const cliModels = cliArgs.filter((value) => Boolean(value) && !value.startsWith("--"));
  if (cliModels.length > 0) {
    return cliModels;
  }

  const envModels = (process.env.MODELS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return envModels.length > 0 ? envModels : DEFAULT_MODELS;
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

async function saveCsv(results) {
  const outputDir = path.resolve("model-tests");
  await mkdir(outputDir, { recursive: true });

  const headers = ["model", "elapsedSeconds", "isValidJson", "itemCount", "score", "error"];
  const lines = [headers.join(",")];

  for (const row of results) {
    lines.push(
      [
        escapeCsv(row.model),
        escapeCsv(row.elapsed.toFixed(1)),
        escapeCsv(row.isValid),
        escapeCsv(row.itemCount),
        escapeCsv(row.score.toFixed(0)),
        escapeCsv(row.error || "")
      ].join(",")
    );
  }

  const filePath = path.join(outputDir, "model-results-wsl.csv");
  await writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
  return filePath;
}

async function testModel(modelName) {
  const startTime = Date.now();
  
  const prompt = `Tu es un assistant d'audit. Génère ${isQuickMode ? 3 : 5} questions d'audit en français à partir de ce critère:
"Contrôle d'accès et gestion des identités".
Retourne UNIQUEMENT un tableau JSON d'objets avec les clés : text, guidance, theme.
Pas de markdown, juste le JSON brut.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetchWithRetry(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: isQuickMode ? 180 : 320,
          temperature: 0.2
        }
      })
    }, 3);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Extract JSON from response (may be wrapped in markdown)
    let jsonText = data.response.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    // Try to parse JSON
    let parsed;
    let isValid = false;
    let itemCount = 0;
    let error = "";

    try {
      parsed = JSON.parse(jsonText);
      isValid = true;
      itemCount = Array.isArray(parsed) ? parsed.length : 1;
    } catch (e) {
      error = e.message;
    }

    // Compute score (same logic as PowerShell script)
    const score = isValid 
      ? Math.max(Math.min(itemCount, 5) * 20 - Math.max(elapsed - 5, 0) * 2, 0)
      : 0;

    console.log(`\n[${modelName}]`);
    console.log(`  Time: ${elapsed}s`);
    console.log(`  Valid JSON: ${isValid}`);
    console.log(`  Items: ${itemCount}`);
    console.log(`  Score: ${score.toFixed(0)}`);
    if (!isValid) {
      console.log(`  Error: ${error}`);
      console.log(`  Raw output (first 200 chars): ${jsonText.substring(0, 200)}`);
    }

    return {
      model: modelName,
      elapsed: parseFloat(elapsed),
      isValid,
      itemCount,
      score,
      error
    };

  } catch (err) {
    console.error(`\n[${modelName}] ERROR:`, err.message);
    return {
      model: modelName,
      elapsed: -1,
      isValid: false,
      itemCount: 0,
      score: 0,
      error: err.message
    };
  }
}

async function main() {
  console.log("Testing Ollama models via API (real-world Rubis conditions)\n");
  console.log("Ollama URL:", OLLAMA_URL);
  console.log("Quick mode:", isQuickMode);
  console.log("Timeout/model:", `${REQUEST_TIMEOUT_MS}ms`);
  const models = getModelsToTest();
  console.log("Models:", models.join(", "));

  const ready = await waitForOllamaReady();
  if (!ready) {
    throw new Error(`Ollama is not reachable at ${OLLAMA_URL}`);
  }

  const results = [];

  for (const model of models) {
    const result = await testModel(model);
    results.push(result);
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  results.forEach(r => {
    console.log(`${r.model.padEnd(15)} | ${r.elapsed.toFixed(1)}s | Valid: ${r.isValid} | Items: ${r.itemCount} | Score: ${r.score.toFixed(0)}`);
  });
  
  // Determine winner
  const sorted = results.slice().sort((a, b) => b.score - a.score);
  if (sorted[0].score > 0) {
    console.log(`\nWINNER: ${sorted[0].model} (score ${sorted[0].score.toFixed(0)})`);
  } else {
    console.log("\nNo valid results.");
  }

  const csvPath = await saveCsv(results);
  console.log(`CSV: ${csvPath}`);
}

main().catch(console.error);
