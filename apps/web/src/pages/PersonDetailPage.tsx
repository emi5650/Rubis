import {
  Badge,
  Box,
  Button,
  Checkbox,
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
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPerson, PersonRecord, PeopleStatus, refreshPersonFromAd, updatePerson } from "../api/rubis";

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [mail, setMail] = useState("");
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [passiScopesRaw, setPassiScopesRaw] = useState("");
  const [isAuditManager, setIsAuditManager] = useState(false);
  const [passiAttestationValidUntil, setPassiAttestationValidUntil] = useState("");
  const [purpose, setPurpose] = useState("");
  const [lawfulBasis, setLawfulBasis] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [retentionDays, setRetentionDays] = useState("365");
  const [status, setStatus] = useState<PeopleStatus>("unknown");

  const tags = useMemo(
    () => tagsRaw.split(",").map((value) => value.trim()).filter(Boolean),
    [tagsRaw]
  );

  const passiScopes = useMemo(
    () => passiScopesRaw.split(",").map((value) => value.trim()).filter(Boolean),
    [passiScopesRaw]
  );

  function fillForm(data: PersonRecord) {
    setDisplayName(data.displayName || "");
    setMail(data.mail || "");
    setDepartment(data.department || "");
    setCompany(data.company || "");
    setTitle(data.title || "");
    setPassiScopesRaw((data.passiScopes || []).join(", "));
    setIsAuditManager(Boolean(data.isAuditManager));
    setPassiAttestationValidUntil(data.passiAttestationValidUntil || "");
    setPurpose(data.purpose || "");
    setLawfulBasis(data.lawfulBasis || "");
    setTagsRaw((data.tags || []).join(", "));
    setNotes(data.notes || "");
    setRetentionDays(String(data.retentionDays || 365));
    setStatus(data.status || "unknown");
  }

  async function refresh() {
    if (!id) {
      return;
    }

    setIsLoading(true);
    try {
      const data = await getPerson(id);
      setPerson(data);
      fillForm(data);
    } catch (error) {
      toast({ status: "error", title: "Chargement personne", description: String(error) });
      navigate("/people");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [id]);

  async function handleSave() {
    if (!id) {
      return;
    }

    setIsSaving(true);
    try {
      const payloadRetention = Number(retentionDays);
      const updated = await updatePerson(id, {
        displayName: displayName.trim() || undefined,
        mail: mail.trim() || undefined,
        department: department.trim() || undefined,
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        passiScopes,
        isAuditManager,
        passiAttestationValidUntil: passiAttestationValidUntil.trim() || undefined,
        purpose: purpose.trim() || undefined,
        lawfulBasis: lawfulBasis.trim() || undefined,
        tags,
        notes: notes.trim() || undefined,
        retentionDays: Number.isFinite(payloadRetention) ? Math.max(1, Math.floor(payloadRetention)) : undefined,
        status
      });
      setPerson(updated);
      fillForm(updated);
      toast({ status: "success", title: "Personne mise à jour" });
    } catch (error) {
      toast({ status: "error", title: "Mise à jour personne", description: String(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRefreshAd() {
    if (!id) {
      return;
    }

    setIsRefreshing(true);
    try {
      const updated = await refreshPersonFromAd(id);
      setPerson(updated);
      fillForm(updated);
      toast({ status: "success", title: "Rafraîchissement AD lancé" });
    } catch (error) {
      toast({ status: "error", title: "Rafraîchissement AD", description: String(error) });
    } finally {
      setIsRefreshing(false);
    }
  }

  if (!id) {
    return <Text>Identifiant invalide.</Text>;
  }

  return (
    <Stack spacing={6}>
      <HStack justify="space-between">
        <Heading size="md">Person Detail</Heading>
        <HStack>
          <Button variant="outline" onClick={() => navigate("/people")}>Retour annuaire</Button>
          <Button onClick={() => void handleRefreshAd()} isLoading={isRefreshing}>Refresh AD</Button>
        </HStack>
      </HStack>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <HStack>
            <Badge colorScheme={status === "active" ? "green" : status === "disabled" ? "orange" : "gray"}>{status}</Badge>
            <Text fontSize="sm" color="gray.500">Source: {person?.source || "-"}</Text>
            <Text fontSize="sm" color="gray.500">Mis à jour: {person ? new Date(person.updatedAt).toLocaleString("fr-FR") : "-"}</Text>
          </HStack>

          <HStack align="end" spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Nom affiché</FormLabel>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} isDisabled={isLoading} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Email</FormLabel>
              <Input value={mail} onChange={(event) => setMail(event.target.value)} isDisabled={isLoading} />
            </FormControl>
            <FormControl maxW="220px">
              <FormLabel fontSize="sm">Statut</FormLabel>
              <Select value={status} onChange={(event) => setStatus(event.target.value as PeopleStatus)}>
                <option value="active">active</option>
                <option value="disabled">disabled</option>
                <option value="unknown">unknown</option>
              </Select>
            </FormControl>
          </HStack>

          <HStack align="end" spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Département</FormLabel>
              <Input value={department} onChange={(event) => setDepartment(event.target.value)} isDisabled={isLoading} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Société</FormLabel>
              <Input value={company} onChange={(event) => setCompany(event.target.value)} isDisabled={isLoading} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Fonction</FormLabel>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} isDisabled={isLoading} />
            </FormControl>
          </HStack>

          <HStack align="end" spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Portées PASSI (virgules)</FormLabel>
              <Input
                value={passiScopesRaw}
                onChange={(event) => setPassiScopesRaw(event.target.value)}
                placeholder="ex: GOV, APP, INFRA"
                isDisabled={isLoading}
              />
            </FormControl>
            <FormControl maxW="260px">
              <FormLabel fontSize="sm">Fin validité attestation PASSI</FormLabel>
              <Input
                type="date"
                value={passiAttestationValidUntil}
                onChange={(event) => setPassiAttestationValidUntil(event.target.value)}
                isDisabled={isLoading}
              />
            </FormControl>
          </HStack>

          <Box>
            <Checkbox
              isChecked={isAuditManager}
              onChange={(event) => setIsAuditManager(event.target.checked)}
              isDisabled={isLoading}
            >
              Responsable d'audit PASSI
            </Checkbox>
          </Box>

          <HStack align="end" spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Finalité</FormLabel>
              <Input value={purpose} onChange={(event) => setPurpose(event.target.value)} isDisabled={isLoading} />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Base légale</FormLabel>
              <Input value={lawfulBasis} onChange={(event) => setLawfulBasis(event.target.value)} isDisabled={isLoading} />
            </FormControl>
            <FormControl maxW="220px">
              <FormLabel fontSize="sm">Rétention (jours)</FormLabel>
              <Input type="number" min={1} value={retentionDays} onChange={(event) => setRetentionDays(event.target.value)} isDisabled={isLoading} />
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel fontSize="sm">Tags (séparés par virgule)</FormLabel>
            <Input value={tagsRaw} onChange={(event) => setTagsRaw(event.target.value)} isDisabled={isLoading} />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Notes</FormLabel>
            <Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} isDisabled={isLoading} />
          </FormControl>

          <Text fontSize="sm" color="gray.500">Retention until: {person?.retentionUntil ? new Date(person.retentionUntil).toLocaleString("fr-FR") : "-"}</Text>

          <Box>
            <Button onClick={() => void handleSave()} isLoading={isSaving}>Enregistrer</Button>
          </Box>
        </VStack>
      </Box>
    </Stack>
  );
}
