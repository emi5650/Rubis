import { z } from "zod";
import { generateAuditFindingStrictJSON } from "./openai.js";
import { retrieveContext } from "./retrieval.js";

export type ControlStatus = "CONFORME" | "PARTIEL" | "NON_CONFORME" | "INDETERMINE";

export interface Citation {
  chunkId: string;
  docId: string;
  docTitle: string;
  page?: number | null;
  section?: string;
  excerpt: string;
}

export interface ControlFinding {
  controlId: string;
  referentialId: string;
  status: ControlStatus;
  rationale: string;
  citations: Citation[];
  confidence: number;
  evidenceGaps: string[];
  followUpQuestions: string[];
  updatedAt: string;
}

const CitationSchema = z.object({
  chunkId: z.string().min(1),
  docId: z.string().min(1),
  docTitle: z.string().min(1),
  page: z.number().int().nullable().optional(),
  section: z.string().optional(),
  excerpt: z.string().min(1)
});

const ControlFindingSchema = z.object({
  controlId: z.string().min(1),
  referentialId: z.string().min(1),
  status: z.enum(["CONFORME", "PARTIEL", "NON_CONFORME", "INDETERMINE"]),
  rationale: z.string().min(1),
  citations: z.array(CitationSchema),
  confidence: z.number().min(0).max(1),
  evidenceGaps: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([])
});

export async function evaluateControl(input: {
  auditId: string;
  referentialId: string;
  controlId: string;
  controlText: string;
}): Promise<ControlFinding> {
  const retrieval = await retrieveContext({
    auditId: input.auditId,
    query: `${input.controlId} ${input.controlText}`
  });

  if (retrieval.citations.length === 0 || retrieval.contextText.length === 0) {
    return {
      controlId: input.controlId,
      referentialId: input.referentialId,
      status: "INDETERMINE",
      rationale: "Aucune preuve documentaire récupérée pour ce contrôle.",
      citations: [],
      confidence: 0,
      evidenceGaps: ["Preuves absentes dans le corpus documentaire."],
      followUpQuestions: [
        "Pouvez-vous fournir un document décrivant ce contrôle ?",
        "Quel est le responsable de la mise en oeuvre de ce contrôle ?"
      ],
      updatedAt: new Date().toISOString()
    };
  }

  const finding = await generateAuditFindingStrictJSON({
    control: {
      controlId: input.controlId,
      referentialId: input.referentialId,
      text: input.controlText
    },
    contextText: retrieval.contextText,
    citations: retrieval.citations,
    outputSchema: ControlFindingSchema
  });

  const parsed = ControlFindingSchema.parse(finding);
  const hasCitations = parsed.citations.length > 0;

  if (!hasCitations && parsed.status !== "INDETERMINE") {
    return {
      ...parsed,
      status: "INDETERMINE",
      evidenceGaps: [...parsed.evidenceGaps, "Aucune citation fournie par le modèle."],
      updatedAt: new Date().toISOString()
    };
  }

  return {
    ...parsed,
    updatedAt: new Date().toISOString()
  };
}
