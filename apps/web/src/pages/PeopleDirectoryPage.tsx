import {
  Badge,
  Box,
  Button,
  FormHelperText,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  useDisclosure,
  VStack
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdUser,
  AdMode,
  deletePersonRecord,
  exportPeopleCsv,
  getSessionAdStatus,
  getPeople,
  hasValidSessionAdCredentials,
  importFromAd,
  PersonRecord,
  PeopleStatus,
  searchAd,
  setSessionAdCredentials
} from "../api/rubis";

type PeopleDirectoryPageProps = {
  campaignId: string;
};

const STATUS_OPTIONS: Array<{ label: string; value: "all" | PeopleStatus }> = [
  { label: "Tous", value: "all" },
  { label: "Actif", value: "active" },
  { label: "Désactivé", value: "disabled" },
  { label: "Inconnu", value: "unknown" }
];

export function PeopleDirectoryPage({ campaignId }: PeopleDirectoryPageProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<PersonRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PeopleStatus>("all");
  const [passiManagerFilter, setPassiManagerFilter] = useState<"all" | "yes" | "no">("all");
  const [passiValiditySort, setPassiValiditySort] = useState<"none" | "expiring_asc">("none");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [adMode, setAdMode] = useState<AdMode>("auto");
  const [adIdentifiersRaw, setAdIdentifiersRaw] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletingPersonId, setDeletingPersonId] = useState<string | null>(null);
  const [adLogin, setAdLogin] = useState("");
  const [adPassword, setAdPassword] = useState("");
  const [pendingAdImport, setPendingAdImport] = useState(false);
  const [adSessionRemainingSeconds, setAdSessionRemainingSeconds] = useState(0);
  const [resolvedIdentifiersForImport, setResolvedIdentifiersForImport] = useState<string[]>([]);
  const [ambiguousMatches, setAmbiguousMatches] = useState<Array<{ query: string; candidates: AdUser[]; selectedIndex: number }>>([]);
  const { isOpen: isAdAuthOpen, onOpen: openAdAuth, onClose: closeAdAuth } = useDisclosure();
  const { isOpen: isAdChoiceOpen, onOpen: openAdChoice, onClose: closeAdChoice } = useDisclosure();

  useEffect(() => {
    const timer = setInterval(() => {
      const status = getSessionAdStatus();
      setAdSessionRemainingSeconds(status.remainingSeconds);
    }, 1000);

    const init = getSessionAdStatus();
    setAdSessionRemainingSeconds(init.remainingSeconds);

    return () => clearInterval(timer);
  }, []);

  async function refreshPeople() {
    setIsLoading(true);
    try {
      const response = await getPeople({
        q: query.trim() || undefined,
        campaignId: campaignId || undefined,
        status: status === "all" ? undefined : status,
        includeDeleted
      });
      setItems(response.items);
    } catch (error) {
      toast({ status: "error", title: "Chargement annuaire", description: String(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshPeople();
  }, [campaignId]);

  const adIdentifiers = useMemo(
    () =>
      adIdentifiersRaw
        .split(/[\n,;]/g)
        .map((value) => value.trim())
        .filter(Boolean),
    [adIdentifiersRaw]
  );

  const filteredItems = useMemo(() => {
    const next = passiManagerFilter === "all"
      ? [...items]
      : items.filter((person) => {
          const isManager = Boolean(person.isAuditManager);
          return passiManagerFilter === "yes" ? isManager : !isManager;
        });

    if (passiValiditySort === "expiring_asc") {
      next.sort((a, b) => {
        const aDate = a.passiAttestationValidUntil
          ? new Date(`${a.passiAttestationValidUntil}T00:00:00`).getTime()
          : Number.POSITIVE_INFINITY;
        const bDate = b.passiAttestationValidUntil
          ? new Date(`${b.passiAttestationValidUntil}T00:00:00`).getTime()
          : Number.POSITIVE_INFINITY;

        if (aDate === bDate) {
          return b.updatedAt.localeCompare(a.updatedAt);
        }

        return aDate - bDate;
      });
    }

    return next;
  }, [items, passiManagerFilter, passiValiditySort]);

  function renderPassiValidity(person: PersonRecord) {
    if (!person.passiAttestationValidUntil) {
      return <Text as="span" color="gray.500">-</Text>;
    }

    const validityDate = new Date(`${person.passiAttestationValidUntil}T00:00:00`);
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const msDiff = validityDate.getTime() - todayOnly.getTime();
    const daysDiff = Math.floor(msDiff / 86400000);

    let colorScheme: "red" | "orange" | "green" = "green";
    let label = "Valide";

    if (daysDiff < 0) {
      colorScheme = "red";
      label = "Expiré";
    } else if (daysDiff <= 30) {
      colorScheme = "orange";
      label = "Expire bientôt";
    }

    return (
      <HStack spacing={2}>
        <Text as="span">{validityDate.toLocaleDateString("fr-FR")}</Text>
        <Badge colorScheme={colorScheme}>{label}</Badge>
      </HStack>
    );
  }

  async function handleSearch() {
    await refreshPeople();
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const blob = await exportPeopleCsv({
        q: query.trim() || undefined,
        campaignId: campaignId || undefined,
        status: status === "all" ? undefined : status,
        includeDeleted
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `people-directory-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ status: "error", title: "Export CSV", description: String(error) });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDeletePerson(person: PersonRecord) {
    const label = person.displayName || person.mail || person.id;
    if (!window.confirm(`Supprimer '${label}' de l'annuaire ?`)) {
      return;
    }

    setDeletingPersonId(person.id);
    try {
      await deletePersonRecord(person.id);
      toast({ status: "success", title: "Personne supprimée" });
      await refreshPeople();
    } catch (error) {
      toast({ status: "error", title: "Suppression", description: String(error) });
    } finally {
      setDeletingPersonId(null);
    }
  }

  function getCandidateIdentifier(candidate: AdUser) {
    return (candidate.userPrincipalName || candidate.mail || candidate.samAccountName || "").trim();
  }

  function getCandidateLabel(candidate: AdUser) {
    const primary = candidate.displayName || candidate.mail || candidate.userPrincipalName || candidate.samAccountName || "Utilisateur";
    const secondary = [candidate.mail, candidate.userPrincipalName, candidate.samAccountName]
      .filter(Boolean)
      .join(" | ");
    return secondary ? `${primary} — ${secondary}` : primary;
  }

  function rankCandidateForQuery(query: string, candidate: AdUser) {
    const q = query.trim().toLowerCase();
    const mail = (candidate.mail || "").trim().toLowerCase();
    const upn = (candidate.userPrincipalName || "").trim().toLowerCase();
    const sam = (candidate.samAccountName || "").trim().toLowerCase();
    const display = (candidate.displayName || "").trim().toLowerCase();

    if (mail === q || upn === q || sam === q) return 0;
    if (mail.startsWith(q) || upn.startsWith(q) || sam.startsWith(q)) return 1;
    if (display.includes(q)) return 2;
    return 3;
  }

  async function resolveIdentifiersForImport() {
    const resolved: string[] = [];
    const ambiguous: Array<{ query: string; candidates: AdUser[]; selectedIndex: number }> = [];

    for (const identifier of adIdentifiers) {
      const result = await searchAd({ q: identifier, mode: adMode });
      if (result.count === 0) {
        throw new Error(`Aucun résultat AD pour '${identifier}'`);
      }

      if (result.count === 1) {
        const candidateIdentifier = getCandidateIdentifier(result.items[0]);
        if (!candidateIdentifier) {
          throw new Error(`Résultat AD invalide pour '${identifier}'`);
        }
        resolved.push(candidateIdentifier);
        continue;
      }

      const selectableCandidates = result.items
        .filter((candidate) => Boolean(getCandidateIdentifier(candidate)))
        .sort((a, b) => rankCandidateForQuery(identifier, a) - rankCandidateForQuery(identifier, b));
      if (selectableCandidates.length === 0) {
        throw new Error(`Résultats AD non exploitables pour '${identifier}'`);
      }

      ambiguous.push({
        query: identifier,
        candidates: selectableCandidates,
        selectedIndex: 0
      });
    }

    if (ambiguous.length > 0) {
      setResolvedIdentifiersForImport(resolved);
      setAmbiguousMatches(ambiguous);
      openAdChoice();
      return null;
    }

    return resolved;
  }

  async function performAdImport(identifiers: string[]) {
    setIsImporting(true);
    try {
      const result = await importFromAd({
        campaignId: campaignId || undefined,
        mode: "auto",
        identifiers
      });

      const firstError = result.job.errors && result.job.errors.length > 0 ? result.job.errors[0] : "";

      toast({
        status: result.summary.failed > 0 ? "warning" : "success",
        title: "Import AD terminé",
        description: `${result.summary.success} succès / ${result.summary.failed} échec(s)${firstError ? ` — ${firstError}` : ""}`
      });
      setAdIdentifiersRaw("");
      await refreshPeople();
    } catch (error) {
      toast({ status: "error", title: "Import AD", description: String(error) });
    } finally {
      setIsImporting(false);
    }
  }

  async function startAdImportFlow() {
    if (adIdentifiers.length === 0) {
      toast({ status: "warning", title: "Importer depuis AD", description: "Ajoutez au moins un identifiant." });
      return;
    }

    if (!hasValidSessionAdCredentials()) {
      setPendingAdImport(true);
      openAdAuth();
      return;
    }

    try {
      const identifiers = await resolveIdentifiersForImport();
      if (!identifiers) {
        return;
      }
      await performAdImport(identifiers);
    } catch (error) {
      toast({ status: "error", title: "Recherche AD", description: String(error) });
    }
  }

  async function handleImportFromAd() {
    await startAdImportFlow();
  }

  async function handleConfirmAmbiguousSelection() {
    const selectedIdentifiers = [...resolvedIdentifiersForImport];

    for (const item of ambiguousMatches) {
      const candidate = item.candidates[item.selectedIndex];
      const identifier = getCandidateIdentifier(candidate);
      if (!identifier) {
        toast({ status: "error", title: "Sélection AD", description: `Aucun identifiant exploitable pour '${item.query}'` });
        return;
      }
      selectedIdentifiers.push(identifier);
    }

    closeAdChoice();
    setAmbiguousMatches([]);
    setResolvedIdentifiersForImport([]);
    await performAdImport(selectedIdentifiers);
  }

  function handleAmbiguousChoiceChange(index: number, selectedIndex: number) {
    setAmbiguousMatches((previous) =>
      previous.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              selectedIndex
            }
          : item
      )
    );
  }

  async function handleConfirmAdCredentials() {
    if (!adLogin.trim() || !adPassword) {
      toast({ status: "warning", title: "Identifiants AD requis", description: "Saisissez login et mot de passe AD." });
      return;
    }

    setSessionAdCredentials({ login: adLogin.trim(), password: adPassword });
    const status = getSessionAdStatus();
    setAdSessionRemainingSeconds(status.remainingSeconds);
    setAdPassword("");
    closeAdAuth();

    if (pendingAdImport) {
      setPendingAdImport(false);
      await startAdImportFlow();
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">People Directory</Heading>
      <Text color="gray.600">Annuaire local synchronisable avec Active Directory.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <HStack align="end" spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Recherche</FormLabel>
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, email, login..." />
            </FormControl>
            <FormControl maxW="220px">
              <FormLabel fontSize="sm">Statut</FormLabel>
              <Select value={status} onChange={(event) => setStatus(event.target.value as "all" | PeopleStatus)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl maxW="220px">
              <FormLabel fontSize="sm">Supprimés</FormLabel>
              <Select value={includeDeleted ? "1" : "0"} onChange={(event) => setIncludeDeleted(event.target.value === "1")}>
                <option value="0">Exclus</option>
                <option value="1">Inclus</option>
              </Select>
            </FormControl>
            <FormControl maxW="260px">
              <FormLabel fontSize="sm">Responsable PASSI</FormLabel>
              <Select
                value={passiManagerFilter}
                onChange={(event) => setPassiManagerFilter(event.target.value as "all" | "yes" | "no")}
              >
                <option value="all">Tous</option>
                <option value="yes">Oui</option>
                <option value="no">Non</option>
              </Select>
            </FormControl>
            <FormControl maxW="280px">
              <FormLabel fontSize="sm">Tri validité PASSI</FormLabel>
              <Select
                value={passiValiditySort}
                onChange={(event) => setPassiValiditySort(event.target.value as "none" | "expiring_asc")}
              >
                <option value="none">Aucun</option>
                <option value="expiring_asc">Expiration proche d'abord</option>
              </Select>
            </FormControl>
            <Button onClick={() => void handleSearch()} isLoading={isLoading}>Filtrer</Button>
            <Button onClick={() => void handleExportCsv()} isLoading={isExporting}>Export CSV</Button>
          </HStack>

          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Nom</Th>
                  <Th>Email</Th>
                  <Th>Statut</Th>
                  <Th>Resp. audit PASSI</Th>
                  <Th>Portées PASSI</Th>
                  <Th>Validité attestation</Th>
                  <Th>Département</Th>
                  <Th>Société</Th>
                  <Th>Mis à jour</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredItems.map((person) => (
                  <Tr key={person.id}>
                    <Td>{person.displayName || "-"}</Td>
                    <Td>{person.mail || "-"}</Td>
                    <Td>
                      <Badge colorScheme={person.status === "active" ? "green" : person.status === "disabled" ? "orange" : "gray"}>
                        {person.status || "unknown"}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={person.isAuditManager ? "purple" : "gray"}>
                        {person.isAuditManager ? "Oui" : "Non"}
                      </Badge>
                    </Td>
                    <Td>{person.passiScopes && person.passiScopes.length > 0 ? person.passiScopes.join(", ") : "-"}</Td>
                    <Td>{renderPassiValidity(person)}</Td>
                    <Td>{person.department || "-"}</Td>
                    <Td>{person.company || "-"}</Td>
                    <Td>{new Date(person.updatedAt).toLocaleString("fr-FR")}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/people/${person.id}`)}>
                          Ouvrir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          isLoading={deletingPersonId === person.id}
                          onClick={() => void handleDeletePerson(person)}
                        >
                          Supprimer
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
                {!isLoading && filteredItems.length === 0 ? (
                  <Tr>
                    <Td colSpan={10}>
                      <Text fontSize="sm" color="gray.500">Aucun résultat.</Text>
                    </Td>
                  </Tr>
                ) : null}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" fontWeight="semibold" color="gray.700">Import depuis AD</Text>
          <HStack>
            <Badge colorScheme={adSessionRemainingSeconds > 0 ? "green" : "orange"}>
              {adSessionRemainingSeconds > 0 ? "Session AD active" : "Session AD expirée"}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {adSessionRemainingSeconds > 0
                ? `Expiration dans ${Math.floor(adSessionRemainingSeconds / 60)}:${String(adSessionRemainingSeconds % 60).padStart(2, "0")}`
                : "Saisie demandée au prochain import AD"}
            </Text>
          </HStack>
          <HStack align="end" spacing={3}>
            <FormControl maxW="220px">
              <FormLabel fontSize="sm">Mode de recherche</FormLabel>
              <Select value={adMode} onChange={(event) => setAdMode(event.target.value as AdMode)}>
                <option value="auto">auto</option>
                <option value="email">email</option>
                <option value="login">login</option>
                <option value="upn">upn</option>
                <option value="name">name</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Identifiants (séparés par virgule ou ligne)</FormLabel>
              <Input value={adIdentifiersRaw} onChange={(event) => setAdIdentifiersRaw(event.target.value)} placeholder="john.doe, jane.doe@domain.tld" />
            </FormControl>
            <Button onClick={() => void handleImportFromAd()} isLoading={isImporting}>Importer AD</Button>
          </HStack>
        </VStack>
      </Box>

      <Modal isOpen={isAdAuthOpen} onClose={closeAdAuth} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connexion Active Directory</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm">Login AD</FormLabel>
                <Input
                  value={adLogin}
                  onChange={(event) => setAdLogin(event.target.value)}
                  placeholder="prenom.nom@domaine.local"
                  autoComplete="username"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Mot de passe AD</FormLabel>
                <Input
                  type="password"
                  value={adPassword}
                  onChange={(event) => setAdPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <FormHelperText>
                  Session AD active 5 minutes après la dernière action d'import AD.
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAdAuth}>Annuler</Button>
            <Button bg="#CF022B" color="white" _hover={{ bg: "#B60226" }} onClick={() => void handleConfirmAdCredentials()}>
              Continuer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isAdChoiceOpen} onClose={closeAdChoice} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sélection des personnes AD</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Plusieurs correspondances AD ont été trouvées. Sélectionnez la bonne entrée pour chaque recherche.
              </Text>
              {ambiguousMatches.map((item, index) => (
                <FormControl key={`${item.query}-${index}`}>
                  <FormLabel fontSize="sm">Recherche: {item.query}</FormLabel>
                  <Select
                    value={String(item.selectedIndex)}
                    onChange={(event) => handleAmbiguousChoiceChange(index, Number(event.target.value))}
                  >
                    {item.candidates.map((candidate, candidateIndex) => (
                      <option key={`${item.query}-${candidateIndex}`} value={candidateIndex}>
                        {getCandidateLabel(candidate)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeAdChoice}>Annuler</Button>
            <Button bg="#CF022B" color="white" _hover={{ bg: "#B60226" }} onClick={() => void handleConfirmAmbiguousSelection()}>
              Importer la sélection
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
