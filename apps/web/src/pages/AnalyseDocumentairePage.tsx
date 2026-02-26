import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
  VStack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { analyzeDocumentUpload, confirmAnalyzedDocument, getDocuments, saveDocumentReview } from "../api/rubis";

type AnalyseDocumentairePageProps = {
  campaignId: string;
};

export function AnalyseDocumentairePage({ campaignId }: AnalyseDocumentairePageProps) {
  const toast = useToast();
  const [documents, setDocuments] = useState<Array<{
    id: string;
    internalId?: string;
    name: string;
    version: string;
    date: string;
    sensitivity: string;
    summary: string;
    authors?: string;
    history?: string;
    pageCount?: number | null;
  }>>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [tempUploadId, setTempUploadId] = useState("");
  const [extractedBy, setExtractedBy] = useState<"ollama" | "openai" | "fallback">("fallback");

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [authors, setAuthors] = useState("");
  const [history, setHistory] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [sensitivity, setSensitivity] = useState("interne");
  const [summary, setSummary] = useState("");

  const [documentId, setDocumentId] = useState("");
  const [maturityLevel, setMaturityLevel] = useState("2");
  const [complianceLevel, setComplianceLevel] = useState("2");
  const [pointsToInvestigate, setPointsToInvestigate] = useState("");
  const [preliminaryVerdict, setPreliminaryVerdict] = useState("");

  async function refreshDocuments() {
    if (!campaignId) {
      setDocuments([]);
      return;
    }

    const data = await getDocuments(campaignId);
    setDocuments(data);
    if (!documentId && data.length > 0) {
      setDocumentId(data[0].id);
    }
  }

  useEffect(() => {
    refreshDocuments().catch((error) => {
      toast({ status: "error", title: "Chargement documents", description: String(error) });
    });
  }, [campaignId]);

  async function handleCreateDocument() {
    if (!campaignId || !selectedFile) {
      toast({ status: "warning", title: "Sélectionne une campagne et un fichier" });
      return;
    }

    try {
      setIsAnalyzing(true);
      const analyzed = await analyzeDocumentUpload(campaignId, selectedFile);
      setTempUploadId(analyzed.tempUploadId);
      setExtractedBy(analyzed.extractedBy);
      setTitle(analyzed.metadata.title || selectedFile.name.replace(/\.[^.]+$/, ""));
      setVersion(analyzed.metadata.version || "");
      setPublicationDate(analyzed.metadata.publicationDate || "");
      setAuthors(analyzed.metadata.authors.join(", "));
      setHistory(analyzed.metadata.history || "");
      setPageCount(analyzed.metadata.pageCount ? String(analyzed.metadata.pageCount) : "");
      setSensitivity(analyzed.metadata.sensitivity || "interne");
      setSummary(analyzed.metadata.summary || "");
      toast({ status: "success", title: "Métadonnées extraites", description: "Vérifie puis valide les informations." });
    } catch (error) {
      toast({ status: "error", title: "Analyse documentaire", description: String(error) });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleConfirmDocument() {
    if (!campaignId || !tempUploadId) {
      toast({ status: "warning", title: "Analyse requise avant validation" });
      return;
    }

    try {
      setIsConfirming(true);
      await confirmAnalyzedDocument({
        campaignId,
        tempUploadId,
        title,
        version,
        publicationDate,
        authors: authors
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        history,
        pageCount: pageCount ? Number(pageCount) : null,
        sensitivity,
        summary,
        theme: "Référentiel audité"
      });

      setSelectedFile(null);
      setTempUploadId("");
      setTitle("");
      setVersion("");
      setPublicationDate("");
      setAuthors("");
      setHistory("");
      setPageCount("");
      setSensitivity("interne");
      setSummary("");

      await refreshDocuments();
      toast({ status: "success", title: "Document enregistré" });
    } catch (error) {
      toast({ status: "error", title: "Validation document", description: String(error) });
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleSaveReview() {
    if (!campaignId || !documentId) {
      toast({ status: "warning", title: "Sélectionne une campagne et un document" });
      return;
    }

    try {
      await saveDocumentReview({ campaignId, documentId, maturityLevel, complianceLevel, pointsToInvestigate, preliminaryVerdict });
      toast({ status: "success", title: "Revue documentaire enregistrée" });
    } catch (error) {
      toast({ status: "error", title: "Revue documentaire", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">Analyse documentaire</Heading>
      <Text color="gray.600">Upload intelligent des documents audités, validation des métadonnées puis revue documentaire.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={1}>Import intelligent d'un document audité</Heading>
        <Text fontSize="sm" color="gray.600" mb={4}>L'IA extrait les métadonnées; tu valides puis le document est enregistré avec un ID interne.</Text>

        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel fontSize="sm">Fichier (PDF, Office, image, texte)</FormLabel>
            <Input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              accept=".pdf,.txt,.csv,.xlsx,.xls,.docx,image/*"
            />
          </FormControl>

          <Box>
            <Button colorScheme="blue" onClick={handleCreateDocument} isLoading={isAnalyzing}>
              Analyser le document avec l'IA
            </Button>
          </Box>

          {tempUploadId ? (
            <>
              <HStack>
                <Badge colorScheme={extractedBy === "fallback" ? "orange" : "green"}>
                  {extractedBy === "ollama"
                    ? "Extraction IA Mistral (Ollama)"
                    : extractedBy === "openai"
                    ? "Extraction IA OpenAI"
                    : "Extraction fallback"}
                </Badge>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Titre</FormLabel>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Version</FormLabel>
                  <Input value={version} onChange={(event) => setVersion(event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Date de publication</FormLabel>
                  <Input type="date" value={publicationDate} onChange={(event) => setPublicationDate(event.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Nombre de pages</FormLabel>
                  <Input type="number" min={1} value={pageCount} onChange={(event) => setPageCount(event.target.value)} />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm">Auteurs (séparés par virgule)</FormLabel>
                <Input value={authors} onChange={(event) => setAuthors(event.target.value)} />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Historique</FormLabel>
                <Textarea value={history} onChange={(event) => setHistory(event.target.value)} rows={3} />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">Sensibilité</FormLabel>
                  <Select value={sensitivity} onChange={(event) => setSensitivity(event.target.value)}>
                    <option value="public">Public</option>
                    <option value="interne">Interne</option>
                    <option value="confidentiel">Confidentiel</option>
                    <option value="secret">Secret</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize="sm">Résumé</FormLabel>
                <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} />
              </FormControl>

              <Box>
                <Button colorScheme="blue" onClick={handleConfirmDocument} isLoading={isConfirming}>
                  Valider et enregistrer le document
                </Button>
              </Box>
            </>
          ) : null}
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Référentiel documentaire de l'audit</Heading>
        <TableContainer borderWidth="1px" borderColor="gray.200" rounded="md">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>ID interne</Th>
                <Th>Titre</Th>
                <Th>Version</Th>
                <Th>Date</Th>
                <Th>Auteurs</Th>
                <Th>Pages</Th>
                <Th>Sensibilité</Th>
              </Tr>
            </Thead>
            <Tbody>
              {documents.map((document) => (
                <Tr key={document.id}>
                  <Td>{document.internalId || "-"}</Td>
                  <Td>{document.name}</Td>
                  <Td>{document.version || "-"}</Td>
                  <Td>{document.date || "-"}</Td>
                  <Td>{document.authors || "-"}</Td>
                  <Td>{document.pageCount ?? "-"}</Td>
                  <Td>{document.sensitivity}</Td>
                </Tr>
              ))}
              {documents.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <Text fontSize="sm" color="gray.500">Aucun document enregistré pour cette campagne.</Text>
                  </Td>
                </Tr>
              ) : null}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Revue documentaire</Heading>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel fontSize="sm">Document</FormLabel>
            <Select value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="Sélectionner un document">
              {documents.map((document) => (
                <option key={document.id} value={document.id}>{document.internalId ? `${document.internalId} — ${document.name}` : document.name}</option>
              ))}
            </Select>
          </FormControl>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Version</FormLabel>
              <Input value={maturityLevel} onChange={(event) => setMaturityLevel(event.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Niveau conformité</FormLabel>
              <Input value={complianceLevel} onChange={(event) => setComplianceLevel(event.target.value)} />
            </FormControl>
          </SimpleGrid>

          <FormControl>
            <FormLabel fontSize="sm">Points à investiguer</FormLabel>
            <Input value={pointsToInvestigate} onChange={(event) => setPointsToInvestigate(event.target.value)} />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Verdict préliminaire</FormLabel>
            <Input value={preliminaryVerdict} onChange={(event) => setPreliminaryVerdict(event.target.value)} />
          </FormControl>

          <Box>
            <Button colorScheme="blue" onClick={handleSaveReview}>Enregistrer la revue</Button>
          </Box>
        </VStack>
      </Box>
    </Stack>
  );
}
