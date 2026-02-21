import OpenAI from "openai";
import { z } from "zod";
import { getOllamaModel } from "../server.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export interface GenerateQuestionsInput {
  referentialContent: string;
  referentialTitle: string;
  criterionCode: string;
  criterionTitle: string;
  language: string;
  count: number;
}

export interface GeneratedQuestion {
  text: string;
  guidance: string;
  theme: string;
}

const GeneratedQuestionSchema = z.object({
  text: z.string(),
  guidance: z.string(),
  theme: z.string()
});

const GeneratedQuestionsResponseSchema = z.object({
  questions: z.array(GeneratedQuestionSchema)
});

async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function generateQuestionsFromOllama(
  input: GenerateQuestionsInput
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `You are an expert audit consultant specializing in ${input.referentialTitle} compliance audits.
Your task is to generate precise, actionable audit questions based on regulatory requirements.

Guidelines for questions:
- Be specific and measurable
- Include verification methods
- Focus on actual implementation and effectiveness
- Ask about evidence and documentation
- Consider controls and risk mitigation
- Language: ${input.language === "fr" ? "French" : "English"}

Generate exactly ${input.count} questions for criterion: "${input.criterionCode} - ${input.criterionTitle}"

IMPORTANT: Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{"questions": [{"text": "...", "guidance": "...", "theme": "..."}, ...]}`;

  const userPrompt = `Based on this referential extract:

---
${input.referentialContent}
---

Generate ${input.count} audit questions for criterion "${input.criterionCode} - ${input.criterionTitle}".

Return ONLY valid JSON with no markdown formatting or additional text.`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: getOllamaModel(),
        prompt: userPrompt,
        system: systemPrompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { response?: string };
    const responseText = data.response || "";

    // Extract JSON from response
    let jsonText = responseText;
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsed = GeneratedQuestionsResponseSchema.parse(JSON.parse(jsonText));
    return parsed.questions;
  } catch (error) {
    throw new Error(
      `Ollama generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function generateQuestionsFromReferential(
  input: GenerateQuestionsInput
): Promise<GeneratedQuestion[]> {
  // Try OpenAI first if configured
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateQuestionsFromOpenAI(input);
    } catch (openaiError) {
      console.warn("OpenAI failed, attempting Ollama fallback:", openaiError instanceof Error ? openaiError.message : "Unknown error");
    }
  }

  // Fallback to Ollama
  const ollamaAvailable = await checkOllamaAvailable();
  if (ollamaAvailable) {
    return await generateQuestionsFromOllama(input);
  }

  throw new Error(
    "No AI provider available: Configure OPENAI_API_KEY or ensure Ollama is running at " + OLLAMA_URL
  );
}

async function generateQuestionsFromOpenAI(
  input: GenerateQuestionsInput
): Promise<GeneratedQuestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const systemPrompt = `You are an expert audit consultant specializing in ${input.referentialTitle} compliance audits.
Your task is to generate precise, actionable audit questions based on regulatory requirements.

Guidelines for questions:
- Be specific and measurable
- Include verification methods
- Focus on actual implementation and effectiveness
- Ask about evidence and documentation
- Consider controls and risk mitigation
- Language: ${input.language === "fr" ? "French" : "English"}

Generate exactly ${input.count} questions for criterion: "${input.criterionCode} - ${input.criterionTitle}"

Return a JSON object with structure: { "questions": [ { "text": "...", "guidance": "...", "theme": "..." } ] }`;

  const userPrompt = `Based on this referential extract:

---
${input.referentialContent}
---

Generate ${input.count} audit questions for criterion "${input.criterionCode} - ${input.criterionTitle}".

Return ONLY valid JSON with no markdown formatting.`;

  try {
    const message = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const textContent = message.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error("No text response from OpenAI");
    }

    // Extract JSON from response (may be wrapped in markdown code blocks)
    let jsonText = textContent;
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsed = GeneratedQuestionsResponseSchema.parse(JSON.parse(jsonText));

    return parsed.questions;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse OpenAI response: ${error.message}`);
    }
    throw error;
  }
}
