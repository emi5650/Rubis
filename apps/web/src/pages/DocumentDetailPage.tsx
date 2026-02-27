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
  Text,
  Textarea,
  useToast,
  VStack
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteRegistryDocument, getRegistryDocument, patchRegistryDocument, RegistryDocument, RegistryEvent } from "../api/rubis";

type DocumentDetailPageProps = {
  campaignId: string;
};

export function DocumentDetailPage({ campaignId }: DocumentDetailPageProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const { id = "" } = useParams();

  const [record, setRecord] = useState<RegistryDocument | null>(null);
  const [events, setEvents] = useState<RegistryEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [author, setAuthor] = useState("");
  const [sensitivity, setSensitivity] = useState("interne");
  const [status, setStatus] = useState<"imported" | "extracted" | "needs_review" | "validated" | "archived">("needs_review");
  const [evidencePreview, setEvidencePreview] = useState("");

  async function refresh() {
    if (!id) {
      return;
    }
    const response = await getRegistryDocument(id);
    setRecord(response.record);
    setEvents(response.events);
    setTitle(response.record.title.value || "");
    setVersion(response.record.version.value || "");
    setPublishedAt(response.record.publishedAt.value || "");
    setAuthor(response.record.author.value || "");
    setSensitivity(response.record.sensitivity.value || "interne");
    setStatus(response.record.status);
    setEvidencePreview(
      response.record.title.evidence?.snippet ||
      response.record.version.evidence?.snippet ||
      response.record.publishedAt.evidence?.snippet ||
      ""
    );
  }

  useEffect(() => {
    refresh().catch((error) => {
      toast({ status: "error", title: "Document detail", description: String(error) });
    });
  }, [id]);

  async function handleSave() {
    if (!id || !campaignId) {
      return;
    }

    try {
      setIsSaving(true);
      await patchRegistryDocument(id, {
        campaignId,
        title,
        version,
        publishedAt,
        author,
        sensitivity,
        status
      });
      await refresh();
      toast({ status: "success", title: "Document mis à jour" });
    } catch (error) {
      toast({ status: "error", title: "Sauvegarde document", description: String(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || !campaignId) {
      return;
    }

    const confirmed = window.confirm("Supprimer ce document du Document Registry ?");
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteRegistryDocument(id, campaignId);
      toast({ status: "success", title: "Document supprimé" });
      navigate("/document-registry");
    } catch (error) {
      toast({ status: "error", title: "Suppression document", description: String(error) });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!record) {
    return (
      <Box>
        <Heading size="md">Document Registry — Détail</Heading>
        <Text color="gray.600" mt={2}>Chargement...</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Box>
          <Heading size="md">Document Detail</Heading>
          <Text color="gray.600" mt={1}>{record.filename}</Text>
        </Box>
        <Badge colorScheme={status === "validated" ? "green" : status === "needs_review" ? "orange" : "gray"}>{status}</Badge>
      </HStack>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Champs extraits</Heading>
        <VStack spacing={4} align="stretch">
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
            <Input type="date" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Auteur(s)</FormLabel>
            <Input value={author} onChange={(event) => setAuthor(event.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Sensibilité</FormLabel>
            <Select value={sensitivity} onChange={(event) => setSensitivity(event.target.value)}>
              <option value="public">Public</option>
              <option value="interne">Interne</option>
              <option value="confidentiel">Confidentiel</option>
              <option value="secret">Secret</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Statut</FormLabel>
            <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="imported">imported</option>
              <option value="extracted">extracted</option>
              <option value="needs_review">needs_review</option>
              <option value="validated">validated</option>
              <option value="archived">archived</option>
            </Select>
          </FormControl>
          <HStack>
            <Button colorScheme="blue" onClick={handleSave} isLoading={isSaving}>Enregistrer</Button>
            <Button variant="outline" colorScheme="red" onClick={handleDelete} isLoading={isDeleting}>Supprimer</Button>
            <Button variant="ghost" onClick={() => navigate("/document-registry")}>Retour</Button>
          </HStack>
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={3}>Evidence (aperçu)</Heading>
        <Textarea value={evidencePreview} isReadOnly rows={5} />
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <Heading size="sm" mb={4}>Historique des événements</Heading>
        <VStack align="stretch" spacing={2}>
          {events.map((event) => (
            <Box key={event.id} borderWidth="1px" borderColor="gray.200" rounded="md" p={3}>
              <HStack justify="space-between" mb={1}>
                <Badge colorScheme={event.actor === "system" ? "purple" : "blue"}>{event.action}</Badge>
                <Text fontSize="xs" color="gray.500">{new Date(event.timestamp).toLocaleString("fr-FR")}</Text>
              </HStack>
              <Text fontSize="sm" color="gray.700">{event.details}</Text>
            </Box>
          ))}
          {events.length === 0 ? <Text fontSize="sm" color="gray.500">Aucun événement.</Text> : null}
        </VStack>
      </Box>
    </Stack>
  );
}
