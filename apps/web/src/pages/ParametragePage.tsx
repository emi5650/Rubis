import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  FormErrorMessage,
  Spinner,
  SimpleGrid
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  getConfig,
  getReferentials,
  importReferential,
  ReferentialSummary,
  setConfig,
  getReferentialRequirements,
  ReferentialRequirement,
  deleteReferential,
  importReferentialFromRubisFormat,
  importReferentialFromList,
  importReferentialFromFreeText,
  exportReferential,
  previewRubisImport,
  confirmRubisImport,
  ImportPreview,
  previewListImport,
  ListImportPreview,
  getAuditDirectory,
  createAuditDirectoryMember,
  deleteAuditDirectoryMember,
  AuditDirectoryMember
} from "../api/rubis";

type ParametragePageProps = {
  campaignId: string;
};

export function ParametragePage({ campaignId }: ParametragePageProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isListMappingOpen, onOpen: onListMappingOpen, onClose: onListMappingClose } = useDisclosure();
  const AUTO_VALUE = "__AUTO__";
  const [ollamaModel, setOllamaModel] = useState("mistral");
  const [referentials, setReferentials] = useState<ReferentialSummary[]>([]);
  
  // Mode 0: Generic import (legacy)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Mode 1: Rubis format
  const [rubisFile, setRubisFile] = useState<File | null>(null);
  
  // Mode 2: List format
  const [listFile, setListFile] = useState<File | null>(null);
  const [listPreview, setListPreview] = useState<ListImportPreview | null>(null);
  const [listPreviewCurrentSheet, setListPreviewCurrentSheet] = useState<string>("");
  const [listPreviewStartRowIndex, setListPreviewStartRowIndex] = useState(0);
  const [listMapping, setListMapping] = useState({
    requirementId: AUTO_VALUE,
    requirementTitle: AUTO_VALUE,
    requirementText: AUTO_VALUE,
    scopes: AUTO_VALUE,
    themeLevel1: AUTO_VALUE,
    themeLevel1Title: AUTO_VALUE,
    themeLevel2: AUTO_VALUE,
    themeLevel2Title: AUTO_VALUE,
    themeLevel3: AUTO_VALUE,
    themeLevel3Title: AUTO_VALUE,
    themeLevel4: AUTO_VALUE,
    themeLevel4Title: AUTO_VALUE
  });
  const [isLoadingListPreview, setIsLoadingListPreview] = useState(false);
  
  // Mode 3: Free text
  const [freeTextName, setFreeTextName] = useState("");
  const [freeText, setFreeText] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedReferential, setSelectedReferential] = useState<ReferentialSummary | null>(null);
  const [referentialRequirements, setReferentialRequirements] = useState<ReferentialRequirement[]>([]);
  const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
  const [auditDirectory, setAuditDirectory] = useState<AuditDirectoryMember[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
  const [directoryFullName, setDirectoryFullName] = useState("");
  const [directoryProfile, setDirectoryProfile] = useState<"auditeur" | "expert">("auditeur");
  const [directoryEmail, setDirectoryEmail] = useState("");
  const [isSavingDirectory, setIsSavingDirectory] = useState(false);
  const [deletingDirectoryId, setDeletingDirectoryId] = useState<string | null>(null);
  
  // Preview modal state
  const [previewData, setPreviewData] = useState<ImportPreview | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  async function refreshReferentials() {
    const data = await getReferentials();
    setReferentials(data);
  }

  async function refreshAuditDirectory() {
    setIsLoadingDirectory(true);
    try {
      const data = await getAuditDirectory();
      setAuditDirectory(data);
    } finally {
      setIsLoadingDirectory(false);
    }
  }

  useEffect(() => {
    getConfig()
      .then((config) => setOllamaModel(config.ollamaModel))
      .catch((error) => {
        toast({ status: "error", title: "Chargement config", description: String(error) });
      });

    refreshReferentials().catch((error) => {
      toast({ status: "error", title: "Chargement referentiels", description: String(error) });
    });

    refreshAuditDirectory().catch((error) => {
      toast({ status: "error", title: "Chargement annuaire", description: String(error) });
    });
  }, []);

  async function handleAddAuditDirectoryMember() {
    if (!directoryFullName.trim()) {
      toast({ status: "warning", title: "Nom complet requis" });
      return;
    }

    try {
      setIsSavingDirectory(true);
      await createAuditDirectoryMember({
        fullName: directoryFullName.trim(),
        profile: directoryProfile,
        email: directoryEmail.trim()
      });
      setDirectoryFullName("");
      setDirectoryProfile("auditeur");
      setDirectoryEmail("");
      await refreshAuditDirectory();
      toast({ status: "success", title: "Membre ajouté à l'annuaire" });
    } catch (error) {
      toast({ status: "error", title: "Ajout annuaire", description: String(error) });
    } finally {
      setIsSavingDirectory(false);
    }
  }

  async function handleDeleteAuditDirectoryMember(memberId: string) {
    try {
      setDeletingDirectoryId(memberId);
      await deleteAuditDirectoryMember(memberId);
      await refreshAuditDirectory();
      toast({ status: "success", title: "Membre supprimé" });
    } catch (error) {
      toast({ status: "error", title: "Suppression annuaire", description: String(error) });
    } finally {
      setDeletingDirectoryId(null);
    }
  }

  async function handleSave() {
    try {
      const next = await setConfig(ollamaModel);
      setOllamaModel(next.ollamaModel);
      toast({ status: "success", title: "Configuration enregistrée" });
    } catch (error) {
      toast({ status: "error", title: "Configuration", description: String(error) });
    }
  }

  async function handleImport() {
    if (!selectedFile) {
      toast({ status: "warning", title: "Selectionne un fichier" });
      return;
    }

    try {
      setIsUploading(true);
      const result = await importReferential(selectedFile);
      toast({ status: "success", title: `Referentiel importe (${result.requirementCount} exigences)` });
      setSelectedFile(null);
      await refreshReferentials();
    } catch (error) {
      toast({ status: "error", title: "Import referentiel", description: String(error) });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleImportRubisFormat() {
    if (!rubisFile) {
      toast({ status: "warning", title: "Selectionne un fichier" });
      return;
    }

    try {
      setIsLoadingPreview(true);
      setPreviewData(null);
      setPreviewFile(rubisFile);
      onPreviewOpen();
      const response = await previewRubisImport(rubisFile);
      setPreviewData(response.preview);
    } catch (error) {
      toast({ status: "error", title: "Erreur preview", description: String(error) });
      onPreviewClose();
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleConfirmRubisImport() {
    if (!previewFile) return;

    try {
      setIsUploading(true);
      const result = await confirmRubisImport(previewFile);
      toast({ status: "success", title: `Format Rubis importe (${result.requirementCount} exigences)` });
      setRubisFile(null);
      setPreviewData(null);
      setPreviewFile(null);
      onPreviewClose();
      await refreshReferentials();
    } catch (error) {
      toast({ status: "error", title: "Import format Rubis", description: String(error) });
    } finally {
      setIsUploading(false);
    }
  }

  function guessColumn(headers: string[], candidates: string[]) {
    const normalized = headers.map((header) => header.toLowerCase());
    for (const candidate of candidates) {
      const idx = normalized.findIndex((header) => header.includes(candidate));
      if (idx >= 0) {
        return headers[idx];
      }
    }
    return "";
  }

  const listMappingCandidates = {
    requirementId: ["code", "id", "req", "requirement", "exigence"],
    requirementTitle: ["title", "titre", "libelle", "intitule", "objet"],
    requirementText: ["text", "texte", "description", "contenu", "requirement", "exigence"],
    scopes: ["scope", "scopes", "tag", "tags", "categorie", "category"],
    themeLevel1: ["theme1", "level1", "niveau1", "niveau 1", "section"],
    themeLevel1Title: ["theme1title", "theme1_title", "level1title", "titre1", "titre 1"],
    themeLevel2: ["theme2", "level2", "niveau2", "niveau 2"],
    themeLevel2Title: ["theme2title", "theme2_title", "level2title", "titre2", "titre 2"],
    themeLevel3: ["theme3", "level3", "niveau3", "niveau 3"],
    themeLevel3Title: ["theme3title", "theme3_title", "level3title", "titre3", "titre 3"],
    themeLevel4: ["theme4", "level4", "niveau4", "niveau 4"],
    themeLevel4Title: ["theme4title", "theme4_title", "level4title", "titre4", "titre 4"]
  };

  function autoMapListColumns(headers: string[]) {
    const fallback = (value: string) => (value ? value : AUTO_VALUE);
    return {
      requirementId: fallback(guessColumn(headers, listMappingCandidates.requirementId)),
      requirementTitle: fallback(guessColumn(headers, listMappingCandidates.requirementTitle)),
      requirementText: fallback(guessColumn(headers, listMappingCandidates.requirementText)),
      scopes: fallback(guessColumn(headers, listMappingCandidates.scopes)),
      themeLevel1: fallback(guessColumn(headers, listMappingCandidates.themeLevel1)),
      themeLevel1Title: fallback(guessColumn(headers, listMappingCandidates.themeLevel1Title)),
      themeLevel2: fallback(guessColumn(headers, listMappingCandidates.themeLevel2)),
      themeLevel2Title: fallback(guessColumn(headers, listMappingCandidates.themeLevel2Title)),
      themeLevel3: fallback(guessColumn(headers, listMappingCandidates.themeLevel3)),
      themeLevel3Title: fallback(guessColumn(headers, listMappingCandidates.themeLevel3Title)),
      themeLevel4: fallback(guessColumn(headers, listMappingCandidates.themeLevel4)),
      themeLevel4Title: fallback(guessColumn(headers, listMappingCandidates.themeLevel4Title))
    };
  }

  function resolveListMapping(headers: string[], mapping: typeof listMapping) {
    return {
      requirementId: mapping.requirementId === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.requirementId) : mapping.requirementId,
      requirementTitle: mapping.requirementTitle === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.requirementTitle) : mapping.requirementTitle,
      requirementText: mapping.requirementText === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.requirementText) : mapping.requirementText,
      scopes: mapping.scopes === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.scopes) : mapping.scopes,
      themeLevel1: mapping.themeLevel1 === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel1) : mapping.themeLevel1,
      themeLevel1Title: mapping.themeLevel1Title === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel1Title) : mapping.themeLevel1Title,
      themeLevel2: mapping.themeLevel2 === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel2) : mapping.themeLevel2,
      themeLevel2Title: mapping.themeLevel2Title === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel2Title) : mapping.themeLevel2Title,
      themeLevel3: mapping.themeLevel3 === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel3) : mapping.themeLevel3,
      themeLevel3Title: mapping.themeLevel3Title === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel3Title) : mapping.themeLevel3Title,
      themeLevel4: mapping.themeLevel4 === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel4) : mapping.themeLevel4,
      themeLevel4Title: mapping.themeLevel4Title === AUTO_VALUE ? guessColumn(headers, listMappingCandidates.themeLevel4Title) : mapping.themeLevel4Title
    };
  }

  async function handleImportList() {
    if (!listFile) {
      toast({ status: "warning", title: "Selectionne un fichier" });
      return;
    }

    try {
      setIsLoadingListPreview(true);
      const response = await previewListImport(listFile);
      const nextMapping = autoMapListColumns(response.preview.headers);
      setListPreview(response.preview);
      setListMapping(nextMapping);
      setListPreviewCurrentSheet(response.preview.currentSheet || "");
      setListPreviewStartRowIndex(0);
      onListMappingOpen();
    } catch (error) {
      toast({ status: "error", title: "Preview liste", description: String(error) });
    } finally {
      setIsLoadingListPreview(false);
    }
  }

  async function handleListSheetChange(newSheet: string) {
    if (!listFile) return;
    
    try {
      setIsLoadingListPreview(true);
      const response = await previewListImport(listFile, newSheet);
      const nextMapping = autoMapListColumns(response.preview.headers);
      setListPreview(response.preview);
      setListMapping(nextMapping);
      setListPreviewCurrentSheet(newSheet);
      setListPreviewStartRowIndex(0);
    } catch (error) {
      toast({ status: "error", title: "Changement d'onglet", description: String(error) });
    } finally {
      setIsLoadingListPreview(false);
    }
  }

  async function handleConfirmListImport() {
    if (!listFile || (!listMapping.requirementText && !listMapping.requirementTitle)) {
      toast({ status: "warning", title: "Selectionne au moins le Texte ou le Titre" });
      return;
    }

    try {
      setIsUploading(true);
      const result = await importReferentialFromList(
        listFile,
        listMapping.requirementId,
        listMapping.requirementTitle,
        listMapping.requirementText,
        listMapping.scopes,
        listMapping.themeLevel1,
        listMapping.themeLevel1Title,
        listMapping.themeLevel2,
        listMapping.themeLevel2Title,
        listMapping.themeLevel3,
        listMapping.themeLevel3Title,
        listMapping.themeLevel4,
        listMapping.themeLevel4Title
      );
      toast({ status: "success", title: `Liste importee (${result.requirementCount} exigences)` });
      setListFile(null);
      setListPreview(null);
      setListMapping({
        requirementId: AUTO_VALUE,
        requirementTitle: AUTO_VALUE,
        requirementText: AUTO_VALUE,
        scopes: AUTO_VALUE,
        themeLevel1: AUTO_VALUE,
        themeLevel1Title: AUTO_VALUE,
        themeLevel2: AUTO_VALUE,
        themeLevel2Title: AUTO_VALUE,
        themeLevel3: AUTO_VALUE,
        themeLevel3Title: AUTO_VALUE,
        themeLevel4: AUTO_VALUE,
        themeLevel4Title: AUTO_VALUE
      });
      onListMappingClose();
      await refreshReferentials();
    } catch (error) {
      toast({ status: "error", title: "Import liste", description: String(error) });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleImportFreeText() {
    if (!freeText.trim() || !freeTextName.trim()) {
      toast({ status: "warning", title: "Remplis le nom et le texte" });
      return;
    }

    try {
      setIsUploading(true);
      const result = await importReferentialFromFreeText(freeTextName, freeText);
      toast({ status: "success", title: `Texte transforme (${result.requirementCount} exigences)` });
      setFreeText("");
      setFreeTextName("");
      await refreshReferentials();
    } catch (error) {
      toast({ status: "error", title: "Import texte libre", description: String(error) });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleExportReferential() {
    if (!selectedReferential) return;
    
    try {
      const result = await exportReferential(selectedReferential.id);
      const jsonString = JSON.stringify(result.data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedReferential.name}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ status: "success", title: "Referentiel exporte" });
    } catch (error) {
      toast({ status: "error", title: "Export", description: String(error) });
    }
  }

  async function handleViewReferential(ref: ReferentialSummary) {
    setSelectedReferential(ref);
    setIsLoadingRequirements(true);
    try {
      const requirements = await getReferentialRequirements(ref.id);
      setReferentialRequirements(requirements);
      onOpen();
    } catch (error) {
      toast({ status: "error", title: "Détails référentiel", description: String(error) });
    } finally {
      setIsLoadingRequirements(false);
    }
  }

  async function handleDeleteReferential() {
    if (!selectedReferential) return;
    
    try {
      await deleteReferential(selectedReferential.id);
      toast({ status: "success", title: "Référentiel supprimé" });
      onClose();
      await refreshReferentials();
    } catch (error) {
      toast({ status: "error", title: "Suppression", description: String(error) });
    }
  }

  return (
    <Stack spacing={6}>
      <Heading size="md">Paramétrage</Heading>
      <Text color="gray.600">Configuration globale Rubis et modèle IA actif.</Text>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">Campagne active</Text>
            <Badge colorScheme={campaignId ? "green" : "gray"} mt={1}>
              {campaignId || "Aucune campagne sélectionnée"}
            </Badge>
          </Box>
          
          <FormControl>
            <FormLabel fontSize="sm">Modèle Ollama</FormLabel>
            <Input value={ollamaModel} onChange={(event) => setOllamaModel(event.target.value)} placeholder="Ex: mistral, llama2..." />
          </FormControl>
          
          <Box>
            <Button colorScheme="blue" onClick={handleSave}>Enregistrer le modèle IA</Button>
          </Box>
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading size="sm" mb={1}>Referentiels</Heading>
            <Text fontSize="sm" color="gray.600">
              Importer un référentiel de 3 façons différentes ou exporter un existant.
            </Text>
          </Box>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Format Rubis</Tab>
              <Tab>Liste d'exigences</Tab>
              <Tab>Texte libre</Tab>
            </TabList>

            <TabPanels>
              {/* Mode 1: Format Rubis */}
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    Importer depuis un fichier structuré (PDF, Excel, CSV, TXT)
                  </Text>
                  <FormControl>
                    <FormLabel fontSize="sm">Fichier Rubis</FormLabel>
                    <Input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv,.txt"
                      onChange={(event) => setRubisFile(event.target.files?.[0] || null)}
                    />
                    {rubisFile && (
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        Fichier selectionne : {rubisFile.name}
                      </Text>
                    )}
                  </FormControl>
                  <Button colorScheme="blue" onClick={handleImportRubisFormat} isLoading={isLoadingPreview || isUploading}>
                    Importer au format Rubis
                  </Button>
                </VStack>
              </TabPanel>

              {/* Mode 2: Liste d'exigences */}
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    Importer un fichier avec colonnes (Code, Texte, Scopes, etc.)
                  </Text>
                  <FormControl>
                    <FormLabel fontSize="sm">Fichier liste</FormLabel>
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv,.txt"
                      onChange={(event) => setListFile(event.target.files?.[0] || null)}
                    />
                    {listFile && (
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        Fichier selectionne : {listFile.name}
                      </Text>
                    )}
                  </FormControl>
                  <Box bg="gray.50" p={3} borderWidth="1px" borderColor="gray.200" rounded="md">
                    <Text fontSize="xs" color="gray.600">
                      Le mapping champ par champ vous sera propose pour : Code, Titre, Texte et Scopes.
                    </Text>
                  </Box>
                  <Button colorScheme="blue" onClick={handleImportList} isLoading={isLoadingListPreview}>
                    Configurer le mapping
                  </Button>
                </VStack>
              </TabPanel>

              {/* Mode 3: Texte libre */}
              <TabPanel>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color="gray.600">
                    Coller du texte libre - l'IA en extraira les exigences
                  </Text>
                  <FormControl>
                    <FormLabel fontSize="sm">Nom du référentiel</FormLabel>
                    <Input
                      value={freeTextName}
                      onChange={(e) => setFreeTextName(e.target.value)}
                      placeholder="Ex: Audit de conformité 2026"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Texte libre</FormLabel>
                    <Textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      rows={10}
                      placeholder="Collez votre texte ici... L'IA extraira les exigences."
                    />
                  </FormControl>
                  <Button colorScheme="blue" onClick={handleImportFreeText} isLoading={isUploading}>
                    Transformer le texte en exigences
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>Referentiels disponibles</Text>
            <Stack spacing={2}>
              {referentials.map((item) => (
                <Box
                  key={item.id}
                  borderWidth="1px"
                  borderColor="gray.200"
                  rounded="md"
                  p={3}
                  bg="blue.50"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ bg: "blue.100", borderColor: "blue.400", shadow: "md" }}
                  onClick={() => handleViewReferential(item)}
                >
                  <Text fontSize="sm" fontWeight="semibold">{item.name} (v{item.version})</Text>
                  <Text fontSize="xs" color="gray.600">
                    Document: {item.documentName} v{item.documentVersion} - {item.documentDate}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Importe le {new Date(item.importedAt).toLocaleDateString("fr-FR")} - {item.requirementCount} exigences
                  </Text>
                  <Text fontSize="xs" color="blue.600" fontWeight="semibold" mt={1}>
                    Cliquer pour voir les détails →
                  </Text>
                </Box>
              ))}
              {referentials.length === 0 && (
                <Text fontSize="sm" color="gray.500">Aucun referentiel importe.</Text>
              )}
            </Stack>
          </Box>
        </VStack>
      </Box>

      <Box bg="white" p={6} borderWidth="1px" borderColor="gray.200" rounded="lg">
        <VStack spacing={4} align="stretch">
          <Box>
            <Heading size="sm" mb={1}>Annuaire d'audit</Heading>
            <Text fontSize="sm" color="gray.600">
              Liste unique des auditeurs et experts disponibles pour constituer les équipes par campagne.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="sm">Nom complet</FormLabel>
              <Input value={directoryFullName} onChange={(event) => setDirectoryFullName(event.target.value)} placeholder="Prénom NOM" />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Profil</FormLabel>
              <Select value={directoryProfile} onChange={(event) => setDirectoryProfile(event.target.value as "auditeur" | "expert")}>
                <option value="auditeur">Auditeur</option>
                <option value="expert">Expert</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Email</FormLabel>
              <Input value={directoryEmail} onChange={(event) => setDirectoryEmail(event.target.value)} placeholder="nom@entreprise.com" />
            </FormControl>
            <FormControl alignSelf="end">
              <Button colorScheme="blue" onClick={handleAddAuditDirectoryMember} isLoading={isSavingDirectory} width="full">
                Ajouter
              </Button>
            </FormControl>
          </SimpleGrid>

          {isLoadingDirectory ? (
            <HStack>
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.600">Chargement annuaire...</Text>
            </HStack>
          ) : (
            <TableContainer borderWidth="1px" borderColor="gray.200" rounded="md">
              <Table size="sm" variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Nom</Th>
                    <Th>Profil</Th>
                    <Th>Email</Th>
                    <Th textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {auditDirectory.map((member) => (
                    <Tr key={member.id}>
                      <Td>{member.fullName}</Td>
                      <Td>
                        <Badge colorScheme={member.profile === "expert" ? "purple" : "orange"}>
                          {member.profile}
                        </Badge>
                      </Td>
                      <Td>{member.email || "-"}</Td>
                      <Td textAlign="right">
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteAuditDirectoryMember(member.id)}
                          isLoading={deletingDirectoryId === member.id}
                        >
                          Supprimer
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                  {auditDirectory.length === 0 && (
                    <Tr>
                      <Td colSpan={4}>
                        <Text fontSize="sm" color="gray.500">Aucun membre dans l'annuaire.</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader display="flex" justifyContent="space-between" alignItems="center" pr={14}>
            <Box>
              {selectedReferential?.name} (v{selectedReferential?.version})
            </Box>
            <HStack spacing={2}>
              <Button size="sm" colorScheme="green" onClick={handleExportReferential}>
                Exporter
              </Button>
              <Button size="sm" colorScheme="red" onClick={handleDeleteReferential}>
                Supprimer
              </Button>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {selectedReferential && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="semibold">Informations</Text>
                  <HStack spacing={4} mt={2} fontSize="sm" color="gray.600">
                    <Box>
                      <Text fontWeight="semibold">Document</Text>
                      <Text>{selectedReferential.documentName}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold">Version</Text>
                      <Text>{selectedReferential.documentVersion}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold">Date</Text>
                      <Text>{selectedReferential.documentDate}</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Exigences ({referentialRequirements.length})
                  </Text>
                  {isLoadingRequirements ? (
                    <Text color="gray.500">Chargement...</Text>
                  ) : (
                    <TableContainer maxH="400px" overflowY="auto" borderWidth="1px" borderColor="gray.200" rounded="md">
                      <Table size="sm">
                        <Thead>
                          <Tr bg="gray.50">
                            <Th>Code</Th>
                            <Th>Titre</Th>
                            <Th>Niveau 1</Th>
                            <Th>Texte</Th>
                            <Th>Scopes</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {referentialRequirements.map((req) => (
                            <Tr key={req.id}>
                              <Td fontSize="xs">{req.requirementId}</Td>
                              <Td fontSize="xs">{req.requirementTitle || "-"}</Td>
                              <Td fontSize="xs">
                                {req.themeLevel1Title || req.themeLevel1 || "-"}
                              </Td>
                              <Td fontSize="xs" maxW="300px" whiteSpace="normal">
                                {req.requirementText.substring(0, 100)}...
                              </Td>
                              <Td fontSize="xs">
                                {req.scopes.length > 0 ? (
                                  <Stack spacing={0}>
                                    {req.scopes.map((scope) => (
                                      <Badge key={scope} size="sm" colorScheme="blue">
                                        {scope}
                                      </Badge>
                                    ))}
                                  </Stack>
                                ) : (
                                  <Text>-</Text>
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>Aperçu de l'import</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {isLoadingPreview ? (
              <VStack spacing={4} justify="center" py={10}>
                <Spinner size="lg" color="blue.500" />
                <Text color="gray.600">Analyse du fichier...</Text>
              </VStack>
            ) : previewData ? (
              <VStack spacing={4} align="stretch">
                <Box bg="blue.50" p={4} borderWidth="1px" borderColor="blue.200" rounded="md">
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>Informations détectées par l'IA</Text>
                  <Stack spacing={2} fontSize="sm">
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Référentiel :</Text>
                      <Text>{previewData.referentialName} (v{previewData.referentialVersion})</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Document :</Text>
                      <Text>{previewData.documentName} v{previewData.documentVersion}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Date :</Text>
                      <Text>{previewData.documentDate || "Non détectée"}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">Exigences :</Text>
                      <Badge colorScheme="green">{previewData.requirementCount} trouvées</Badge>
                    </HStack>
                  </Stack>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Aperçu des exigences ({previewData.requirements.length} affichées
                    {previewData.hasMore && ` + ${previewData.requirementCount - previewData.requirements.length} autres`})
                  </Text>
                  <TableContainer maxH="300px" overflowY="auto" borderWidth="1px" borderColor="gray.200" rounded="md">
                    <Table size="sm">
                      <Thead>
                        <Tr bg="gray.50">
                          <Th>Code</Th>
                          <Th>Titre</Th>
                          <Th>Texte</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {previewData.requirements.map((req, idx) => (
                          <Tr key={idx}>
                            <Td fontSize="xs" fontWeight="semibold">{req.requirementId || "-"}</Td>
                            <Td fontSize="xs">{req.requirementTitle || "-"}</Td>
                            <Td fontSize="xs" maxW="400px" whiteSpace="normal">
                              {req.requirementText.substring(0, 100)}
                              {req.requirementText.length > 100 ? "..." : ""}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {previewData.hasMore && (
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      → {previewData.requirementCount - previewData.requirements.length} exigences supplémentaires détectées
                    </Text>
                  )}
                </Box>

                <Box bg="yellow.50" p={3} borderWidth="1px" borderColor="yellow.200" rounded="md" fontSize="xs" color="gray.700">
                  <Text fontWeight="semibold" mb={1}>Vérifier les informations</Text>
                  <Text>Confirmez que le référentiel et les exigences détectées sont corrects avant de valider l'import.</Text>
                </Box>
              </VStack>
            ) : null}
          </ModalBody>
          <Box p={4} borderTopWidth="1px" borderTopColor="gray.200">
            <HStack spacing={2} justify="flex-end">
              <Button variant="outline" onClick={onPreviewClose}>
                Annuler
              </Button>
              <Button colorScheme="green" onClick={handleConfirmRubisImport} isLoading={isUploading} isDisabled={!previewData || isLoadingPreview}>
                Confirmer l'import
              </Button>
            </HStack>
          </Box>
        </ModalContent>
      </Modal>

      <Modal isOpen={isListMappingOpen} onClose={onListMappingClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>Mapping des champs</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            {isLoadingListPreview ? (
              <VStack spacing={4} justify="center" py={10}>
                <Spinner size="lg" color="blue.500" />
                <Text color="gray.600">Analyse des colonnes...</Text>
              </VStack>
            ) : listPreview ? (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>Associer chaque champ</Text>
                  <Stack spacing={3}>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Code de l'exigence</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.requirementId}
                        onChange={(e) => setListMapping({ ...listMapping, requirementId: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Titre de l'exigence</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.requirementTitle}
                        onChange={(e) => setListMapping({ ...listMapping, requirementTitle: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontSize="sm">Texte de l'exigence</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.requirementText}
                        onChange={(e) => setListMapping({ ...listMapping, requirementText: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Scopes (optionnel)</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.scopes}
                        onChange={(e) => setListMapping({ ...listMapping, scopes: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Thème niveau 1</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel1}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel1: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Titre niveau 1</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel1Title}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel1Title: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Thème niveau 2</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel2}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel2: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Titre niveau 2</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel2Title}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel2Title: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Thème niveau 3</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel3}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel3: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Titre niveau 3</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel3Title}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel3Title: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Thème niveau 4</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel4}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel4: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Titre niveau 4</FormLabel>
                      <Select
                        size="sm"
                        value={listMapping.themeLevel4Title}
                        onChange={(e) => setListMapping({ ...listMapping, themeLevel4Title: e.target.value })}
                      >
                        <option value="">(Aucun)</option>
                        <option value={AUTO_VALUE}>Choix automatique</option>
                        {listPreview.headers.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>

                <Box>
                  <Tabs size="sm">
                    <TabList mb={2}>
                      <Tab>📄 Fichier source</Tab>
                      <Tab>📊 Aperçu de la table</Tab>
                    </TabList>
                    <TabPanels>
                      {/* Tab 1: Source file preview */}
                      <TabPanel p={0}>
                        <VStack spacing={3} align="stretch">
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>Données du fichier</Text>
                            {listPreview.sheets && listPreview.sheets.length > 1 && (
                              <FormControl mb={3}>
                                <FormLabel fontSize="sm">Sélectionner l'onglet</FormLabel>
                                <Select
                                  size="sm"
                                  value={listPreviewCurrentSheet}
                                  onChange={(e) => handleListSheetChange(e.target.value)}
                                  isDisabled={isLoadingListPreview}
                                >
                                  {listPreview.sheets.map((sheet) => (
                                    <option key={sheet} value={sheet}>{sheet}</option>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="xs" color="gray.600">
                                Lignes {listPreviewStartRowIndex + 1} à {Math.min(listPreviewStartRowIndex + 5, listPreview.totalRows || 0)} sur {listPreview.totalRows || 0}
                              </Text>
                              <HStack spacing={1}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setListPreviewStartRowIndex(Math.max(0, listPreviewStartRowIndex - 5))}
                                  isDisabled={listPreviewStartRowIndex === 0 || isLoadingListPreview}
                                >
                                  ← Précédent
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setListPreviewStartRowIndex(Math.min(listPreviewStartRowIndex + 5, (listPreview.totalRows || 0) - 1))}
                                  isDisabled={listPreviewStartRowIndex + 5 >= (listPreview.totalRows || 0) || isLoadingListPreview}
                                >
                                  Suivant →
                                </Button>
                              </HStack>
                            </HStack>
                          </Box>
                          <TableContainer maxH="240px" overflowY="auto" overflowX="auto" borderWidth="1px" borderColor="gray.200" rounded="md">
                            <Table size="sm">
                              {(() => {
                                const displayRows = listPreview.sampleRows.slice(listPreviewStartRowIndex, listPreviewStartRowIndex + 5);

                                return (
                                  <>
                                    <Thead>
                                      <Tr bg="gray.50">
                                        {listPreview.headers.map((header) => (
                                          <Th key={header}>{header}</Th>
                                        ))}
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      {displayRows.map((row, idx) => (
                                        <Tr key={idx}>
                                          {listPreview.headers.map((header) => (
                                            <Td key={header} fontSize="xs" whiteSpace="normal">
                                              {row[header] || ""}
                                            </Td>
                                          ))}
                                        </Tr>
                                      ))}
                                    </Tbody>
                                  </>
                                );
                              })()}
                            </Table>
                          </TableContainer>
                        </VStack>
                      </TabPanel>

                      {/* Tab 2: Table preview */}
                      <TabPanel p={0}>
                        <VStack spacing={3} align="stretch">
                          <Box>
                            <Text fontSize="sm" fontWeight="semibold" mb={2}>Aperçu des exigences créées</Text>
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="xs" color="gray.600">
                                Lignes {listPreviewStartRowIndex + 1} à {Math.min(listPreviewStartRowIndex + 5, listPreview.totalRows || 0)} sur {listPreview.totalRows || 0}
                              </Text>
                              <HStack spacing={1}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setListPreviewStartRowIndex(Math.max(0, listPreviewStartRowIndex - 5))}
                                  isDisabled={listPreviewStartRowIndex === 0 || isLoadingListPreview}
                                >
                                  ← Précédent
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setListPreviewStartRowIndex(Math.min(listPreviewStartRowIndex + 5, (listPreview.totalRows || 0) - 1))}
                                  isDisabled={listPreviewStartRowIndex + 5 >= (listPreview.totalRows || 0) || isLoadingListPreview}
                                >
                                  Suivant →
                                </Button>
                              </HStack>
                            </HStack>
                          </Box>
                          <TableContainer maxH="240px" overflowY="auto" overflowX="auto" borderWidth="1px" borderColor="gray.200" rounded="md">
                            <Table size="sm">
                              {(() => {
                                const resolvedMapping = resolveListMapping(listPreview.headers, listMapping);
                                const columns = [
                                  { key: "id", label: "ID" },
                                  { key: "requirementId", label: "Code" },
                                  { key: "requirementTitle", label: "Titre" },
                                  { key: "requirementText", label: "Texte", maxW: "300px" }
                                ];
                                const displayRows = listPreview.sampleRows.slice(listPreviewStartRowIndex, listPreviewStartRowIndex + 5);

                                return (
                                  <>
                                    <Thead>
                                      <Tr bg="gray.50">
                                        {columns.map((col) => (
                                          <Th key={col.key}>{col.label}</Th>
                                        ))}
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      {displayRows.map((row, idx) => {
                                        const idValue = "ID_" + (listPreviewStartRowIndex + idx + 1);
                                        const codeValue = (resolvedMapping.requirementId && row[resolvedMapping.requirementId]) || "";
                                        const titleValue = (resolvedMapping.requirementTitle && row[resolvedMapping.requirementTitle]) || "";
                                        const textValue = (resolvedMapping.requirementText && row[resolvedMapping.requirementText]) || "";
                                        
                                        return (
                                          <Tr key={idx}>
                                            <Td fontSize="xs" fontFamily="mono">{idValue}</Td>
                                            <Td fontSize="xs">{codeValue}</Td>
                                            <Td fontSize="xs">{titleValue}</Td>
                                            <Td fontSize="xs" maxW="300px" whiteSpace="normal">{textValue}</Td>
                                          </Tr>
                                        );
                                      })}
                                    </Tbody>
                                  </>
                                );
                              })()}
                            </Table>
                          </TableContainer>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </VStack>
            ) : (
              <Text color="gray.500">Aucun aperçu disponible.</Text>
            )}
          </ModalBody>
          <Box p={4} borderTopWidth="1px" borderTopColor="gray.200">
            <HStack spacing={2} justify="flex-end">
              <Button variant="outline" onClick={onListMappingClose}>
                Annuler
              </Button>
              <Button
                colorScheme="green"
                onClick={handleConfirmListImport}
                isLoading={isUploading}
                isDisabled={!listMapping.requirementText || isLoadingListPreview}
              >
                Confirmer l'import
              </Button>
            </HStack>
          </Box>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
