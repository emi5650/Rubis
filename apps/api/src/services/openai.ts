import OpenAI from "openai";
import { z } from "zod";
import { getOllamaModel, getOpenAiApiKey } from "../server.js";

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

export interface ReferencialImportMetadata {
  name: string;
  version: string;
  documentName: string;
  documentVersion: string;
  documentDate: string;
}

export interface ReferencialRequirementRow {
  requirementId: string;
  requirementTitle?: string;
  themeLevel1: string;
  themeLevel1Title: string;
  themeLevel2: string;
  themeLevel2Title: string;
  themeLevel3: string;
  themeLevel3Title: string;
  themeLevel4: string;
  themeLevel4Title: string;
  requirementText: string;
  scopes: string[];
}

export interface ExtractedDocumentMetadata {
  title: string;
  version: string;
  publicationDate: string;
  authors: string[];
  history: string;
  pageCount: number | null;
  sensitivity: string;
  summary: string;
}

export interface ExtractedDocumentMetadataResult {
  metadata: ExtractedDocumentMetadata;
  provider: "ollama" | "openai";
}

const ExtractedDocumentMetadataSchema = z.object({
  title: z.string().default(""),
  version: z.string().default(""),
  publicationDate: z.string().default(""),
  authors: z.array(z.string()).default([]),
  history: z.string().default(""),
  pageCount: z.number().int().positive().nullable().default(null),
  sensitivity: z.string().default("interne"),
  summary: z.string().default("")
});

const ReferencialRequirementSchema = z.object({
  requirementId: z.string().min(1),
  requirementTitle: z.string().optional().default(""),
  themeLevel1: z.string().default(""),
  themeLevel1Title: z.string().default(""),
  themeLevel2: z.string().default(""),
  themeLevel2Title: z.string().default(""),
  themeLevel3: z.string().default(""),
  themeLevel3Title: z.string().default(""),
  themeLevel4: z.string().default(""),
  themeLevel4Title: z.string().default(""),
  requirementText: z.string().min(1),
  scopes: z.array(z.string()).default([])
});

const ReferencialImportSchema = z.object({
  referential: z.object({
    name: z.string().default("Referential Document"),
    version: z.string().default("1.0"),
    documentName: z.string().default("Untitled Document"),
    documentVersion: z.string().default("1.0"),
    documentDate: z.string().default(new Date().toISOString().split("T")[0])
  }),
  requirements: z.array(ReferencialRequirementSchema)
});

function createOpenAiClient() {
  const apiKey = getOpenAiApiKey() || process.env.OPENAI_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  return new OpenAI({ apiKey });
}

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
  if (getOpenAiApiKey() || process.env.OPENAI_API_KEY) {
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
  const openai = createOpenAiClient();

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

export async function transformReferentialToRubisFormat(input: {
  referentialContent: string;
  referentialTitle: string;
}): Promise<{ referential: ReferencialImportMetadata; requirements: ReferencialRequirementRow[] }> {
  const openai = createOpenAiClient();

  const systemPrompt = `You are an expert compliance analyst.
Your task is to convert a referential document into Rubis format.

Output JSON only, no markdown.

Required structure:
{
  "referential": {
    "name": "...",
    "version": "...",
    "documentName": "...",
    "documentVersion": "...",
    "documentDate": "YYYY-MM-DD"
  },
  "requirements": [
    {
      "requirementId": "...",
      "themeLevel1": "...",
      "themeLevel1Title": "...",
      "themeLevel2": "...",
      "themeLevel2Title": "...",
      "themeLevel3": "...",
      "themeLevel3Title": "...",
      "themeLevel4": "...",
      "themeLevel4Title": "...",
      "requirementText": "...",
      "scopes": ["Organisationnel", "Physique", "Logique", "Applicatif", "Reseau"]
    }
  ]
}

Rules:
- Provide the 5 PASSI scopes when applicable. Use the closest matches.
- If a level is missing, return empty strings.
- Keep requirementId consistent with the source (e.g., A.5.1, PASSI-01).
- Limit to max 200 requirements in this response.
`;

  const userPrompt = `Referential: ${input.referentialTitle}

Content:
---
${input.referentialContent}
---

Return valid JSON only.`;

  const message = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 3000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  const textContent = message.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error("No text response from OpenAI");
  }

  let jsonText = textContent;
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  const parsed = ReferencialImportSchema.parse(JSON.parse(jsonText));
  return { referential: parsed.referential, requirements: parsed.requirements };
}

async function extractAuditDocumentMetadataWithOpenAI(input: {
  filename: string;
  mimeType: string;
  contentExcerpt?: string;
  pageCountHint?: number | null;
  imageBase64?: string;
}): Promise<ExtractedDocumentMetadata> {
  const openai = createOpenAiClient();

  const systemPrompt = `Tu es un assistant d'analyse documentaire d'audit.
Extrais les métadonnées d'un document et renvoie UNIQUEMENT du JSON.

Format de sortie strict:
{
  "title": "",
  "version": "",
  "publicationDate": "YYYY-MM-DD ou vide",
  "authors": [""],
  "history": "",
  "pageCount": 0 ou null,
  "sensitivity": "public|interne|confidentiel|secret",
  "summary": ""
}

Règles:
- Si une information n'est pas trouvée: chaîne vide (ou null pour pageCount).
- publicationDate doit être au format YYYY-MM-DD si identifiable.
- summary: 2 à 4 phrases maximum.
- Ne mets aucun texte hors JSON.`;

  const userText = [
    `Nom fichier: ${input.filename}`,
    `Type MIME: ${input.mimeType}`,
    `Indice nb pages: ${input.pageCountHint ?? "inconnu"}`,
    "",
    "Contenu extrait:",
    input.contentExcerpt || "(aucun texte extrait)",
    "",
    "Retourne uniquement le JSON demandé."
  ].join("\n");

  const userContent: any = input.imageBase64
    ? [
        { type: "text", text: userText },
        {
          type: "image_url",
          image_url: {
            url: `data:${input.mimeType};base64,${input.imageBase64}`
          }
        }
      ]
    : userText;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error("No text response from OpenAI");
  }

  let jsonText = textContent;
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  return ExtractedDocumentMetadataSchema.parse(JSON.parse(jsonText));
}

async function extractAuditDocumentMetadataWithOllama(input: {
  filename: string;
  mimeType: string;
  contentExcerpt?: string;
  pageCountHint?: number | null;
}): Promise<ExtractedDocumentMetadata> {
  const systemPrompt = `Tu es un assistant d'analyse documentaire d'audit.
Extrais les métadonnées d'un document et renvoie UNIQUEMENT du JSON.

Format de sortie strict:
{
  "title": "",
  "version": "",
  "publicationDate": "YYYY-MM-DD ou vide",
  "authors": [""],
  "history": "",
  "pageCount": 0 ou null,
  "sensitivity": "public|interne|confidentiel|secret",
  "summary": ""
}

Règles:
- Si une information n'est pas trouvée: chaîne vide (ou null pour pageCount).
- publicationDate doit être au format YYYY-MM-DD si identifiable.
- summary: 2 à 4 phrases maximum.
- Ne mets aucun texte hors JSON.`;

  const userPrompt = [
    `Nom fichier: ${input.filename}`,
    `Type MIME: ${input.mimeType}`,
    `Indice nb pages: ${input.pageCountHint ?? "inconnu"}`,
    "",
    "Contenu extrait:",
    input.contentExcerpt || "(aucun texte extrait)",
    "",
    "Retourne uniquement le JSON demandé."
  ].join("\n");

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
  const textContent = data.response || "";
  if (!textContent) {
    throw new Error("No text response from Ollama");
  }

  let jsonText = textContent;
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  return ExtractedDocumentMetadataSchema.parse(JSON.parse(jsonText));
}

export async function extractAuditDocumentMetadata(input: {
  filename: string;
  mimeType: string;
  contentExcerpt?: string;
  pageCountHint?: number | null;
  imageBase64?: string;
}): Promise<ExtractedDocumentMetadataResult> {
  const ollamaAvailable = await checkOllamaAvailable();
  if (ollamaAvailable) {
    const metadata = await extractAuditDocumentMetadataWithOllama(input);
    return { metadata, provider: "ollama" };
  }

  if (getOpenAiApiKey() || process.env.OPENAI_API_KEY) {
    const metadata = await extractAuditDocumentMetadataWithOpenAI(input);
    return { metadata, provider: "openai" };
  }

  throw new Error("No AI provider available: configure Ollama or OpenAI");
}
