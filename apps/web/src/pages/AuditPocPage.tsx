import { Box, Button, Flex, Heading, Input, Stack, Tag, Text, Textarea, useToast } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { createAudit, getAuditFindings, getAuditReport, getAuditScore, ingestAudit, runAudit, type AuditFinding } from "../api/rubis";

type AuditPocPageProps = {
  campaignId: string;
};

const DEFAULT_CONTROLS = [
  {
    id: "CTRL-DOC-01",
    domain: "gouvernance",
    text: "La politique de sécurité est formalisée, approuvée et diffusée."
  },
  {
    id: "CTRL-DOC-02",
    domain: "acces",
    text: "La revue des droits d'accès est tracée et réalisée périodiquement."
  }
];

export function AuditPocPage({ campaignId }: AuditPocPageProps) {
  const toast = useToast();
  const [auditId, setAuditId] = useState("");
  const [referentialId, setReferentialId] = useState("POC-SCHOOL");
  const [ingestPath, setIngestPath] = useState("data_school/docs");
  const [controlsJson, setControlsJson] = useState(JSON.stringify(DEFAULT_CONTROLS, null, 2));
  const [isRunning, setIsRunning] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [attackPaths, setAttackPaths] = useState<Array<{ id: string; title: string; riskLevel: "low" | "medium" | "high" }>>([]);
  const [ingestSummary, setIngestSummary] = useState<{
    ingestedDocuments: number;
    ingestedChunks: number;
    skippedFiles: string[];
  } | null>(null);

  const canRun = useMemo(() => campaignId.length > 0 && auditId.trim().length > 0, [campaignId, auditId]);

  async function handleCreateAudit() {
    try {
      const created = await createAudit({
        name: `POC ${new Date().toLocaleString("fr-FR")}`,
        referentialId
      });
      setAuditId(created.id);
      toast({ status: "success", title: "Audit créé", description: created.id });
    } catch (error) {
      toast({
        status: "error",
        title: "Création impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  }

  async function handleRun() {
    if (!canRun) {
      return;
    }

    try {
      setIsRunning(true);
      let controls: Array<{ id: string; text: string; domain?: string }> | undefined;
      try {
        controls = JSON.parse(controlsJson) as Array<{ id: string; text: string; domain?: string }>;
      } catch {
        throw new Error("Le JSON des contrôles est invalide.");
      }

      await runAudit(auditId.trim(), { referentialId, controls });
      const findingsResponse = await getAuditFindings(auditId.trim());
      const scoreResponse = await getAuditScore(auditId.trim());
      const reportResponse = await getAuditReport(auditId.trim());

      setFindings(findingsResponse.findings || []);
      setGlobalScore(scoreResponse.score?.globalScore ?? null);
      setReportMarkdown(reportResponse.report || "");
      setAttackPaths((reportResponse.attackPaths || []).map((item) => ({
        id: item.id,
        title: item.title,
        riskLevel: item.riskLevel
      })));
      toast({ status: "success", title: "Évaluation terminée" });
    } catch (error) {
      toast({
        status: "error",
        title: "Exécution impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleLoadReport() {
    if (!auditId.trim()) {
      return;
    }

    try {
      setIsLoadingReport(true);
      const reportResponse = await getAuditReport(auditId.trim());
      setReportMarkdown(reportResponse.report || "");
      setAttackPaths((reportResponse.attackPaths || []).map((item) => ({
        id: item.id,
        title: item.title,
        riskLevel: item.riskLevel
      })));
      toast({ status: "success", title: "Rapport chargé" });
    } catch (error) {
      toast({
        status: "error",
        title: "Chargement rapport impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
    } finally {
      setIsLoadingReport(false);
    }
  }

  async function handleCopyReport() {
    if (!reportMarkdown.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(reportMarkdown);
      toast({ status: "success", title: "Rapport copié" });
    } catch {
      toast({ status: "error", title: "Copie impossible" });
    }
  }

  function handleExportReport() {
    if (!reportMarkdown.trim()) {
      return;
    }

    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `audit-report-${auditId.trim() || "poc"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleIngest() {
    if (!auditId.trim()) {
      return;
    }

    try {
      setIsIngesting(true);
      const response = await ingestAudit(auditId.trim(), {
        folderPath: ingestPath.trim() || "data_school/docs"
      });
      setIngestSummary(response.ingest);
      toast({
        status: "success",
        title: "Ingest terminé",
        description: `${response.ingest.ingestedDocuments} document(s), ${response.ingest.ingestedChunks} chunk(s)`
      });
    } catch (error) {
      toast({
        status: "error",
        title: "Ingest impossible",
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md">POC Audit RAG</Heading>
        <Text color="gray.600" mt={1}>
          Exécute /api/audits/:id/run puis affiche les constats avec citations.
        </Text>
      </Box>

      <Stack spacing={3} bg="white" p={4} rounded="md" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <Flex gap={3} direction={{ base: "column", md: "row" }}>
          <Input value={auditId} onChange={(event) => setAuditId(event.target.value)} placeholder="Audit ID" />
          <Input value={referentialId} onChange={(event) => setReferentialId(event.target.value)} placeholder="Referential ID" />
          <Button onClick={handleCreateAudit} colorScheme="blue" variant="outline">
            Créer audit
          </Button>
        </Flex>
        <Flex gap={3} direction={{ base: "column", md: "row" }}>
          <Input
            value={ingestPath}
            onChange={(event) => setIngestPath(event.target.value)}
            placeholder="Chemin dossier docs (ex: data_school/docs)"
          />
          <Button isLoading={isIngesting} onClick={handleIngest} colorScheme="teal" variant="outline" isDisabled={!auditId.trim()}>
            Ingest docs
          </Button>
        </Flex>
        {ingestSummary ? (
          <Text fontSize="sm" color="gray.600">
            Ingest: {ingestSummary.ingestedDocuments} document(s), {ingestSummary.ingestedChunks} chunk(s),
            {" "}
            {ingestSummary.skippedFiles.length} fichier(s) ignoré(s)
          </Text>
        ) : null}
        <Textarea
          value={controlsJson}
          onChange={(event) => setControlsJson(event.target.value)}
          minH="180px"
          fontFamily="mono"
          fontSize="sm"
        />
        <Button isLoading={isRunning} onClick={handleRun} colorScheme="orange" isDisabled={!canRun}>
          Lancer l'évaluation
        </Button>
        <Button isLoading={isLoadingReport} onClick={handleLoadReport} colorScheme="purple" variant="outline" isDisabled={!auditId.trim()}>
          Charger rapport
        </Button>
      </Stack>

      <Box bg="white" p={4} rounded="md" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm">Findings</Heading>
          <Tag colorScheme="purple">Score global: {globalScore ?? "-"}</Tag>
        </Flex>

        {findings.length === 0 ? (
          <Text color="gray.500">Aucun résultat pour le moment.</Text>
        ) : (
          <Stack spacing={3}>
            {findings.map((finding) => (
              <Box key={`${finding.controlId}-${finding.updatedAt}`} p={3} borderWidth="1px" borderColor="gray.200" rounded="md">
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="semibold">{finding.controlId}</Text>
                  <Tag colorScheme={finding.status === "CONFORME" ? "green" : finding.status === "INDETERMINE" ? "yellow" : "red"}>
                    {finding.status}
                  </Tag>
                </Flex>
                <Text fontSize="sm" color="gray.700" mb={2}>{finding.rationale}</Text>
                <Text fontSize="xs" color="gray.500">
                  Citations: {finding.citations.length} • Gaps: {finding.evidenceGaps.length} • Questions: {finding.followUpQuestions.length}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Box bg="white" p={4} rounded="md" shadow="sm" borderWidth="1px" borderColor="gray.200">
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm">Rapport</Heading>
          <Flex gap={2}>
            <Button size="sm" variant="outline" onClick={handleCopyReport} isDisabled={!reportMarkdown.trim()}>
              Copier
            </Button>
            <Button size="sm" colorScheme="purple" variant="outline" onClick={handleExportReport} isDisabled={!reportMarkdown.trim()}>
              Export .md
            </Button>
          </Flex>
        </Flex>
        {attackPaths.length > 0 ? (
          <Stack spacing={2} mb={3}>
            {attackPaths.map((path) => (
              <Flex key={path.id} justify="space-between" align="center" p={2} borderWidth="1px" borderColor="gray.200" rounded="md">
                <Text fontSize="sm">{path.title}</Text>
                <Tag colorScheme={path.riskLevel === "high" ? "red" : path.riskLevel === "medium" ? "orange" : "green"}>
                  {path.riskLevel}
                </Tag>
              </Flex>
            ))}
          </Stack>
        ) : null}
        <Textarea isReadOnly value={reportMarkdown} minH="240px" fontFamily="mono" fontSize="sm" placeholder="Le rapport markdown apparaîtra ici." />
      </Box>
    </Stack>
  );
}
