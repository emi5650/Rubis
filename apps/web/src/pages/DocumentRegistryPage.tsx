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
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportRegistryDocumentsCsv, listRegistryDocuments, RegistryDocument, uploadRegistryDocument } from "../api/rubis";

type DocumentRegistryPageProps = {
  campaignId: string;
};

export function DocumentRegistryPage({ campaignId }: DocumentRegistryPageProps) {
  const toast = useToast();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<RegistryDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function refresh() {
    if (!campaignId) {
      setDocuments([]);
      return;
    }

    const response = await listRegistryDocuments(campaignId);
    setDocuments(response.items);
  }

  useEffect(() => {
    refresh().catch((error) => {
      toast({ status: "error", title: "Document Registry", description: String(error) });
    });
  }, [campaignId]);

  const filteredDocuments = useMemo(() => {
    if (statusFilter === "all") {
      return documents;
    }
    return documents.filter((item) => item.status === statusFilter);
  }, [documents, statusFilter]);

  async function handleUpload() {
    if (!campaignId || !selectedFile) {
      toast({ status: "warning", title: "Sélectionne une campagne et un fichier" });
      return;
    }

    try {
      setIsUploading(true);
      const response = await uploadRegistryDocument(campaignId, selectedFile);
      setSelectedFile(null);
      await refresh();
      toast({ status: "success", title: "Document importé", description: `Mode: ${response.provider} (sans IA)` });
    } catch (error) {
      toast({ status: "error", title: "Upload document", description: String(error) });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleExportCsv() {
    if (!campaignId) {
      toast({ status: "warning", title: "Sélectionne une campagne" });
      return;
    }

    try {
      const csv = await exportRegistryDocumentsCsv(campaignId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `document-registry-${campaignId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ status: "error", title: "Export CSV", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md">Document Registry</Heading>
        <Text color="gray.600" mt={1}>Référentiel documentaire sans IA, avec validation et traçabilité.</Text>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Importer un document</Heading>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Fichier</FormLabel>
            <Input
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              accept=".pdf,.txt,.csv,.xlsx,.xls,.docx,image/*"
            />
          </FormControl>
          <Box>
            <Button colorScheme="blue" onClick={handleUpload} isLoading={isUploading}>Importer</Button>
          </Box>
        </Stack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <HStack justify="space-between" mb={4}>
          <Heading size="sm">Documents</Heading>
          <HStack align="end" spacing={3}>
            <FormControl maxW="260px">
              <FormLabel fontSize="sm">Filtre statut</FormLabel>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous</option>
                <option value="imported">imported</option>
                <option value="extracted">extracted</option>
                <option value="needs_review">needs_review</option>
                <option value="validated">validated</option>
                <option value="archived">archived</option>
              </Select>
            </FormControl>
            <Button variant="outline" onClick={handleExportCsv}>Exporter CSV</Button>
          </HStack>
        </HStack>

        <TableContainer borderWidth="1px" borderColor="gray.200" rounded="md">
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Titre</Th>
                <Th>Version</Th>
                <Th>Publié le</Th>
                <Th>Sensibilité</Th>
                <Th>Statut</Th>
                <Th>Maj</Th>
                <Th textAlign="right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredDocuments.map((item) => (
                <Tr key={item.id}>
                  <Td>{item.title.value || item.filename}</Td>
                  <Td>{item.version.value || "-"}</Td>
                  <Td>{item.publishedAt.value || "-"}</Td>
                  <Td>{item.sensitivity.value || "-"}</Td>
                  <Td><Badge colorScheme={item.status === "validated" ? "green" : item.status === "needs_review" ? "orange" : "gray"}>{item.status}</Badge></Td>
                  <Td>{new Date(item.updatedAt).toLocaleString("fr-FR")}</Td>
                  <Td textAlign="right">
                    <Button size="xs" variant="outline" colorScheme="blue" onClick={() => navigate(`/document-registry/${item.id}`)}>
                      Détails
                    </Button>
                  </Td>
                </Tr>
              ))}
              {filteredDocuments.length === 0 ? (
                <Tr>
                  <Td colSpan={7}><Text fontSize="sm" color="gray.500">Aucun document pour ce filtre.</Text></Td>
                </Tr>
              ) : null}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}
