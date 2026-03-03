
/**
 * Extraction Orchestrator
 * TODO:
 *  - Detect file type
 *  - Extract metadata
 *  - Extract first N pages/slides
 *  - Apply regex patterns
 *  - Normalize values
 *  - Assign confidence
 */

export async function extractDocumentMetadata(filePath: string) {
  return {
    title: { value: undefined, confidence: "low", source: "metadata" },
    version: { value: undefined, confidence: "low", source: "metadata" },
    publishedAt: { value: undefined, confidence: "low", source: "metadata" },
    author: { value: undefined, confidence: "low", source: "metadata" },
    sensitivity: { value: undefined, confidence: "low", source: "metadata" },
  };
}
