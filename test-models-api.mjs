// Test both Mistral and Gemma3 via Ollama API directly
// This simulates real Rubis usage through the openai.ts service

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

async function testModel(modelName) {
  const startTime = Date.now();
  
  const prompt = `Tu es un assistant d'audit. Génère 5 questions d'audit en français à partir de ce critère:
"Contrôle d'accès et gestion des identités".
Retourne UNIQUEMENT un tableau JSON d'objets avec les clés : text, guidance, theme.
Pas de markdown, juste le JSON brut.`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false
      })
    });

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
  
  const models = ["mistral", "gemma3:4b"];
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
}

main().catch(console.error);
