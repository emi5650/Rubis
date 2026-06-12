import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Stack, Text, useDisclosure, useToast, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Select, Tabs, TabList, TabPanels, Tab, TabPanel, Textarea, Spinner, SimpleGrid } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getConfig, getReferentials, importReferential, setConfig, getReferentialRequirements, deleteReferential, importReferentialFromList, importReferentialFromFreeText, exportReferential, previewRubisImport, confirmRubisImport, previewListImport, getAuditDirectory, createAuditDirectoryMember, deleteAuditDirectoryMember } from "../api/rubis";
export function ParametragePage({ campaignId }) {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
    const { isOpen: isListMappingOpen, onOpen: onListMappingOpen, onClose: onListMappingClose } = useDisclosure();
    const AUTO_VALUE = "__AUTO__";
    const [ollamaModel, setOllamaModel] = useState("mistral");
    const [referentials, setReferentials] = useState([]);
    // Mode 0: Generic import (legacy)
    const [selectedFile, setSelectedFile] = useState(null);
    // Mode 1: Rubis format
    const [rubisFile, setRubisFile] = useState(null);
    // Mode 2: List format
    const [listFile, setListFile] = useState(null);
    const [listPreview, setListPreview] = useState(null);
    const [listPreviewCurrentSheet, setListPreviewCurrentSheet] = useState("");
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
    const [selectedReferential, setSelectedReferential] = useState(null);
    const [referentialRequirements, setReferentialRequirements] = useState([]);
    const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
    const [auditDirectory, setAuditDirectory] = useState([]);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
    const [directoryFullName, setDirectoryFullName] = useState("");
    const [directoryProfile, setDirectoryProfile] = useState("auditeur");
    const [directoryEmail, setDirectoryEmail] = useState("");
    const [isSavingDirectory, setIsSavingDirectory] = useState(false);
    const [deletingDirectoryId, setDeletingDirectoryId] = useState(null);
    // Preview modal state
    const [previewData, setPreviewData] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
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
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Ajout annuaire", description: String(error) });
        }
        finally {
            setIsSavingDirectory(false);
        }
    }
    async function handleDeleteAuditDirectoryMember(memberId) {
        try {
            setDeletingDirectoryId(memberId);
            await deleteAuditDirectoryMember(memberId);
            await refreshAuditDirectory();
            toast({ status: "success", title: "Membre supprimé" });
        }
        catch (error) {
            toast({ status: "error", title: "Suppression annuaire", description: String(error) });
        }
        finally {
            setDeletingDirectoryId(null);
        }
    }
    async function handleSave() {
        try {
            const next = await setConfig(ollamaModel);
            setOllamaModel(next.ollamaModel);
            toast({ status: "success", title: "Configuration enregistrée" });
        }
        catch (error) {
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
        }
        catch (error) {
            toast({ status: "error", title: "Import referentiel", description: String(error) });
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Erreur preview", description: String(error) });
            onPreviewClose();
        }
        finally {
            setIsLoadingPreview(false);
        }
    }
    async function handleConfirmRubisImport() {
        if (!previewFile)
            return;
        try {
            setIsUploading(true);
            const result = await confirmRubisImport(previewFile);
            toast({ status: "success", title: `Format Rubis importe (${result.requirementCount} exigences)` });
            setRubisFile(null);
            setPreviewData(null);
            setPreviewFile(null);
            onPreviewClose();
            await refreshReferentials();
        }
        catch (error) {
            toast({ status: "error", title: "Import format Rubis", description: String(error) });
        }
        finally {
            setIsUploading(false);
        }
    }
    function guessColumn(headers, candidates) {
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
    function autoMapListColumns(headers) {
        const fallback = (value) => (value ? value : AUTO_VALUE);
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
    function resolveListMapping(headers, mapping) {
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
        }
        catch (error) {
            toast({ status: "error", title: "Preview liste", description: String(error) });
        }
        finally {
            setIsLoadingListPreview(false);
        }
    }
    async function handleListSheetChange(newSheet) {
        if (!listFile)
            return;
        try {
            setIsLoadingListPreview(true);
            const response = await previewListImport(listFile, newSheet);
            const nextMapping = autoMapListColumns(response.preview.headers);
            setListPreview(response.preview);
            setListMapping(nextMapping);
            setListPreviewCurrentSheet(newSheet);
            setListPreviewStartRowIndex(0);
        }
        catch (error) {
            toast({ status: "error", title: "Changement d'onglet", description: String(error) });
        }
        finally {
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
            const result = await importReferentialFromList(listFile, listMapping.requirementId, listMapping.requirementTitle, listMapping.requirementText, listMapping.scopes, listMapping.themeLevel1, listMapping.themeLevel1Title, listMapping.themeLevel2, listMapping.themeLevel2Title, listMapping.themeLevel3, listMapping.themeLevel3Title, listMapping.themeLevel4, listMapping.themeLevel4Title);
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
        }
        catch (error) {
            toast({ status: "error", title: "Import liste", description: String(error) });
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Import texte libre", description: String(error) });
        }
        finally {
            setIsUploading(false);
        }
    }
    async function handleExportReferential() {
        if (!selectedReferential)
            return;
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
        }
        catch (error) {
            toast({ status: "error", title: "Export", description: String(error) });
        }
    }
    async function handleViewReferential(ref) {
        setSelectedReferential(ref);
        setIsLoadingRequirements(true);
        try {
            const requirements = await getReferentialRequirements(ref.id);
            setReferentialRequirements(requirements);
            onOpen();
        }
        catch (error) {
            toast({ status: "error", title: "Détails référentiel", description: String(error) });
        }
        finally {
            setIsLoadingRequirements(false);
        }
    }
    async function handleDeleteReferential() {
        if (!selectedReferential)
            return;
        try {
            await deleteReferential(selectedReferential.id);
            toast({ status: "success", title: "Référentiel supprimé" });
            onClose();
            await refreshReferentials();
        }
        catch (error) {
            toast({ status: "error", title: "Suppression", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Param\u00E9trage" }), _jsx(Text, { color: "gray.600", children: "Configuration globale Rubis et mod\u00E8le IA actif." }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", color: "gray.700", children: "Campagne active" }), _jsx(Badge, { colorScheme: campaignId ? "green" : "gray", mt: 1, children: campaignId || "Aucune campagne sélectionnée" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Mod\u00E8le Ollama" }), _jsx(Input, { value: ollamaModel, onChange: (event) => setOllamaModel(event.target.value), placeholder: "Ex: mistral, llama2..." })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSave, children: "Enregistrer le mod\u00E8le IA" }) })] }) }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "sm", mb: 1, children: "Referentiels" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Importer un r\u00E9f\u00E9rentiel de 3 fa\u00E7ons diff\u00E9rentes ou exporter un existant." })] }), _jsxs(Tabs, { variant: "enclosed", colorScheme: "blue", children: [_jsxs(TabList, { children: [_jsx(Tab, { children: "Format Rubis" }), _jsx(Tab, { children: "Liste d'exigences" }), _jsx(Tab, { children: "Texte libre" })] }), _jsxs(TabPanels, { children: [_jsx(TabPanel, { children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Importer depuis un fichier structur\u00E9 (PDF, Excel, CSV, TXT)" }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fichier Rubis" }), _jsx(Input, { type: "file", accept: ".pdf,.xlsx,.xls,.csv,.txt", onChange: (event) => setRubisFile(event.target.files?.[0] || null) }), rubisFile && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 2, children: ["Fichier selectionne : ", rubisFile.name] }))] }), _jsx(Button, { colorScheme: "blue", onClick: handleImportRubisFormat, isLoading: isLoadingPreview || isUploading, children: "Importer au format Rubis" })] }) }), _jsx(TabPanel, { children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Importer un fichier avec colonnes (Code, Texte, Scopes, etc.)" }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fichier liste" }), _jsx(Input, { type: "file", accept: ".xlsx,.xls,.csv,.txt", onChange: (event) => setListFile(event.target.files?.[0] || null) }), listFile && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 2, children: ["Fichier selectionne : ", listFile.name] }))] }), _jsx(Box, { bg: "gray.50", p: 3, borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsx(Text, { fontSize: "xs", color: "gray.600", children: "Le mapping champ par champ vous sera propose pour : Code, Titre, Texte et Scopes." }) }), _jsx(Button, { colorScheme: "blue", onClick: handleImportList, isLoading: isLoadingListPreview, children: "Configurer le mapping" })] }) }), _jsx(TabPanel, { children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Coller du texte libre - l'IA en extraira les exigences" }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom du r\u00E9f\u00E9rentiel" }), _jsx(Input, { value: freeTextName, onChange: (e) => setFreeTextName(e.target.value), placeholder: "Ex: Audit de conformit\u00E9 2026" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Texte libre" }), _jsx(Textarea, { value: freeText, onChange: (e) => setFreeText(e.target.value), rows: 10, placeholder: "Collez votre texte ici... L'IA extraira les exigences." })] }), _jsx(Button, { colorScheme: "blue", onClick: handleImportFreeText, isLoading: isUploading, children: "Transformer le texte en exigences" })] }) })] })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Referentiels disponibles" }), _jsxs(Stack, { spacing: 2, children: [referentials.map((item) => (_jsxs(Box, { borderWidth: "1px", borderColor: "gray.200", rounded: "md", p: 3, bg: "blue.50", cursor: "pointer", transition: "all 0.2s", _hover: { bg: "blue.100", borderColor: "blue.400", shadow: "md" }, onClick: () => handleViewReferential(item), children: [_jsxs(Text, { fontSize: "sm", fontWeight: "semibold", children: [item.name, " (v", item.version, ")"] }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["Document: ", item.documentName, " v", item.documentVersion, " - ", item.documentDate] }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["Importe le ", new Date(item.importedAt).toLocaleDateString("fr-FR"), " - ", item.requirementCount, " exigences"] }), _jsx(Text, { fontSize: "xs", color: "blue.600", fontWeight: "semibold", mt: 1, children: "Cliquer pour voir les d\u00E9tails \u2192" })] }, item.id))), referentials.length === 0 && (_jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun referentiel importe." }))] })] })] }) }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "sm", mb: 1, children: "Annuaire d'audit" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Liste unique des auditeurs et experts disponibles pour constituer les \u00E9quipes par campagne." })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 4 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom complet" }), _jsx(Input, { value: directoryFullName, onChange: (event) => setDirectoryFullName(event.target.value), placeholder: "Pr\u00E9nom NOM" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Profil" }), _jsxs(Select, { value: directoryProfile, onChange: (event) => setDirectoryProfile(event.target.value), children: [_jsx("option", { value: "auditeur", children: "Auditeur" }), _jsx("option", { value: "expert", children: "Expert" })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Email" }), _jsx(Input, { value: directoryEmail, onChange: (event) => setDirectoryEmail(event.target.value), placeholder: "nom@entreprise.com" })] }), _jsx(FormControl, { alignSelf: "end", children: _jsx(Button, { colorScheme: "blue", onClick: handleAddAuditDirectoryMember, isLoading: isSavingDirectory, width: "full", children: "Ajouter" }) })] }), isLoadingDirectory ? (_jsxs(HStack, { children: [_jsx(Spinner, { size: "sm" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Chargement annuaire..." })] })) : (_jsx(TableContainer, { borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", variant: "simple", children: [_jsx(Thead, { bg: "gray.50", children: _jsxs(Tr, { children: [_jsx(Th, { children: "Nom" }), _jsx(Th, { children: "Profil" }), _jsx(Th, { children: "Email" }), _jsx(Th, { textAlign: "right", children: "Actions" })] }) }), _jsxs(Tbody, { children: [auditDirectory.map((member) => (_jsxs(Tr, { children: [_jsx(Td, { children: member.fullName }), _jsx(Td, { children: _jsx(Badge, { colorScheme: member.profile === "expert" ? "purple" : "orange", children: member.profile }) }), _jsx(Td, { children: member.email || "-" }), _jsx(Td, { textAlign: "right", children: _jsx(Button, { size: "xs", colorScheme: "red", variant: "outline", onClick: () => handleDeleteAuditDirectoryMember(member.id), isLoading: deletingDirectoryId === member.id, children: "Supprimer" }) })] }, member.id))), auditDirectory.length === 0 && (_jsx(Tr, { children: _jsx(Td, { colSpan: 4, children: _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun membre dans l'annuaire." }) }) }))] })] }) }))] }) }), _jsxs(Modal, { isOpen: isOpen, onClose: onClose, size: "2xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { maxH: "90vh", children: [_jsxs(ModalHeader, { display: "flex", justifyContent: "space-between", alignItems: "center", pr: 14, children: [_jsxs(Box, { children: [selectedReferential?.name, " (v", selectedReferential?.version, ")"] }), _jsxs(HStack, { spacing: 2, children: [_jsx(Button, { size: "sm", colorScheme: "green", onClick: handleExportReferential, children: "Exporter" }), _jsx(Button, { size: "sm", colorScheme: "red", onClick: handleDeleteReferential, children: "Supprimer" })] })] }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { overflowY: "auto", children: selectedReferential && (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", children: "Informations" }), _jsxs(HStack, { spacing: 4, mt: 2, fontSize: "sm", color: "gray.600", children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "semibold", children: "Document" }), _jsx(Text, { children: selectedReferential.documentName })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "semibold", children: "Version" }), _jsx(Text, { children: selectedReferential.documentVersion })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "semibold", children: "Date" }), _jsx(Text, { children: selectedReferential.documentDate })] })] })] }), _jsxs(Box, { children: [_jsxs(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: ["Exigences (", referentialRequirements.length, ")"] }), isLoadingRequirements ? (_jsx(Text, { color: "gray.500", children: "Chargement..." })) : (_jsx(TableContainer, { maxH: "400px", overflowY: "auto", borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { bg: "gray.50", children: [_jsx(Th, { children: "Code" }), _jsx(Th, { children: "Titre" }), _jsx(Th, { children: "Niveau 1" }), _jsx(Th, { children: "Texte" }), _jsx(Th, { children: "Scopes" })] }) }), _jsx(Tbody, { children: referentialRequirements.map((req) => (_jsxs(Tr, { children: [_jsx(Td, { fontSize: "xs", children: req.requirementId }), _jsx(Td, { fontSize: "xs", children: req.requirementTitle || "-" }), _jsx(Td, { fontSize: "xs", children: req.themeLevel1Title || req.themeLevel1 || "-" }), _jsxs(Td, { fontSize: "xs", maxW: "300px", whiteSpace: "normal", children: [req.requirementText.substring(0, 100), "..."] }), _jsx(Td, { fontSize: "xs", children: req.scopes.length > 0 ? (_jsx(Stack, { spacing: 0, children: req.scopes.map((scope) => (_jsx(Badge, { size: "sm", colorScheme: "blue", children: scope }, scope))) })) : (_jsx(Text, { children: "-" })) })] }, req.id))) })] }) }))] })] })) })] })] }), _jsxs(Modal, { isOpen: isPreviewOpen, onClose: onPreviewClose, size: "2xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { maxH: "90vh", children: [_jsx(ModalHeader, { children: "Aper\u00E7u de l'import" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { overflowY: "auto", children: isLoadingPreview ? (_jsxs(VStack, { spacing: 4, justify: "center", py: 10, children: [_jsx(Spinner, { size: "lg", color: "blue.500" }), _jsx(Text, { color: "gray.600", children: "Analyse du fichier..." })] })) : previewData ? (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { bg: "blue.50", p: 4, borderWidth: "1px", borderColor: "blue.200", rounded: "md", children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Informations d\u00E9tect\u00E9es par l'IA" }), _jsxs(Stack, { spacing: 2, fontSize: "sm", children: [_jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "R\u00E9f\u00E9rentiel :" }), _jsxs(Text, { children: [previewData.referentialName, " (v", previewData.referentialVersion, ")"] })] }), _jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "Document :" }), _jsxs(Text, { children: [previewData.documentName, " v", previewData.documentVersion] })] }), _jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "Date :" }), _jsx(Text, { children: previewData.documentDate || "Non détectée" })] }), _jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "Exigences :" }), _jsxs(Badge, { colorScheme: "green", children: [previewData.requirementCount, " trouv\u00E9es"] })] })] })] }), _jsxs(Box, { children: [_jsxs(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: ["Aper\u00E7u des exigences (", previewData.requirements.length, " affich\u00E9es", previewData.hasMore && ` + ${previewData.requirementCount - previewData.requirements.length} autres`, ")"] }), _jsx(TableContainer, { maxH: "300px", overflowY: "auto", borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { bg: "gray.50", children: [_jsx(Th, { children: "Code" }), _jsx(Th, { children: "Titre" }), _jsx(Th, { children: "Texte" })] }) }), _jsx(Tbody, { children: previewData.requirements.map((req, idx) => (_jsxs(Tr, { children: [_jsx(Td, { fontSize: "xs", fontWeight: "semibold", children: req.requirementId || "-" }), _jsx(Td, { fontSize: "xs", children: req.requirementTitle || "-" }), _jsxs(Td, { fontSize: "xs", maxW: "400px", whiteSpace: "normal", children: [req.requirementText.substring(0, 100), req.requirementText.length > 100 ? "..." : ""] })] }, idx))) })] }) }), previewData.hasMore && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 2, children: ["\u2192 ", previewData.requirementCount - previewData.requirements.length, " exigences suppl\u00E9mentaires d\u00E9tect\u00E9es"] }))] }), _jsxs(Box, { bg: "yellow.50", p: 3, borderWidth: "1px", borderColor: "yellow.200", rounded: "md", fontSize: "xs", color: "gray.700", children: [_jsx(Text, { fontWeight: "semibold", mb: 1, children: "V\u00E9rifier les informations" }), _jsx(Text, { children: "Confirmez que le r\u00E9f\u00E9rentiel et les exigences d\u00E9tect\u00E9es sont corrects avant de valider l'import." })] })] })) : null }), _jsx(Box, { p: 4, borderTopWidth: "1px", borderTopColor: "gray.200", children: _jsxs(HStack, { spacing: 2, justify: "flex-end", children: [_jsx(Button, { variant: "outline", onClick: onPreviewClose, children: "Annuler" }), _jsx(Button, { colorScheme: "green", onClick: handleConfirmRubisImport, isLoading: isUploading, isDisabled: !previewData || isLoadingPreview, children: "Confirmer l'import" })] }) })] })] }), _jsxs(Modal, { isOpen: isListMappingOpen, onClose: onListMappingClose, size: "2xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { maxH: "90vh", children: [_jsx(ModalHeader, { children: "Mapping des champs" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { overflowY: "auto", children: isLoadingListPreview ? (_jsxs(VStack, { spacing: 4, justify: "center", py: 10, children: [_jsx(Spinner, { size: "lg", color: "blue.500" }), _jsx(Text, { color: "gray.600", children: "Analyse des colonnes..." })] })) : listPreview ? (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Associer chaque champ" }), _jsxs(Stack, { spacing: 3, children: [_jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Code de l'exigence" }), _jsxs(Select, { size: "sm", value: listMapping.requirementId, onChange: (e) => setListMapping({ ...listMapping, requirementId: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre de l'exigence" }), _jsxs(Select, { size: "sm", value: listMapping.requirementTitle, onChange: (e) => setListMapping({ ...listMapping, requirementTitle: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Texte de l'exigence" }), _jsxs(Select, { size: "sm", value: listMapping.requirementText, onChange: (e) => setListMapping({ ...listMapping, requirementText: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Scopes (optionnel)" }), _jsxs(Select, { size: "sm", value: listMapping.scopes, onChange: (e) => setListMapping({ ...listMapping, scopes: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me niveau 1" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel1, onChange: (e) => setListMapping({ ...listMapping, themeLevel1: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre niveau 1" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel1Title, onChange: (e) => setListMapping({ ...listMapping, themeLevel1Title: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me niveau 2" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel2, onChange: (e) => setListMapping({ ...listMapping, themeLevel2: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre niveau 2" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel2Title, onChange: (e) => setListMapping({ ...listMapping, themeLevel2Title: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me niveau 3" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel3, onChange: (e) => setListMapping({ ...listMapping, themeLevel3: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre niveau 3" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel3Title, onChange: (e) => setListMapping({ ...listMapping, themeLevel3Title: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me niveau 4" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel4, onChange: (e) => setListMapping({ ...listMapping, themeLevel4: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre niveau 4" }), _jsxs(Select, { size: "sm", value: listMapping.themeLevel4Title, onChange: (e) => setListMapping({ ...listMapping, themeLevel4Title: e.target.value }), children: [_jsx("option", { value: "", children: "(Aucun)" }), _jsx("option", { value: AUTO_VALUE, children: "Choix automatique" }), listPreview.headers.map((header) => (_jsx("option", { value: header, children: header }, header)))] })] })] })] }), _jsx(Box, { children: _jsxs(Tabs, { size: "sm", children: [_jsxs(TabList, { mb: 2, children: [_jsx(Tab, { children: "\uD83D\uDCC4 Fichier source" }), _jsx(Tab, { children: "\uD83D\uDCCA Aper\u00E7u de la table" })] }), _jsxs(TabPanels, { children: [_jsx(TabPanel, { p: 0, children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Donn\u00E9es du fichier" }), listPreview.sheets && listPreview.sheets.length > 1 && (_jsxs(FormControl, { mb: 3, children: [_jsx(FormLabel, { fontSize: "sm", children: "S\u00E9lectionner l'onglet" }), _jsx(Select, { size: "sm", value: listPreviewCurrentSheet, onChange: (e) => handleListSheetChange(e.target.value), isDisabled: isLoadingListPreview, children: listPreview.sheets.map((sheet) => (_jsx("option", { value: sheet, children: sheet }, sheet))) })] })), _jsxs(HStack, { justify: "space-between", mb: 2, children: [_jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["Lignes ", listPreviewStartRowIndex + 1, " \u00E0 ", Math.min(listPreviewStartRowIndex + 5, listPreview.totalRows || 0), " sur ", listPreview.totalRows || 0] }), _jsxs(HStack, { spacing: 1, children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => setListPreviewStartRowIndex(Math.max(0, listPreviewStartRowIndex - 5)), isDisabled: listPreviewStartRowIndex === 0 || isLoadingListPreview, children: "\u2190 Pr\u00E9c\u00E9dent" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setListPreviewStartRowIndex(Math.min(listPreviewStartRowIndex + 5, (listPreview.totalRows || 0) - 1)), isDisabled: listPreviewStartRowIndex + 5 >= (listPreview.totalRows || 0) || isLoadingListPreview, children: "Suivant \u2192" })] })] })] }), _jsx(TableContainer, { maxH: "240px", overflowY: "auto", overflowX: "auto", borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsx(Table, { size: "sm", children: (() => {
                                                                                    const displayRows = listPreview.sampleRows.slice(listPreviewStartRowIndex, listPreviewStartRowIndex + 5);
                                                                                    return (_jsxs(_Fragment, { children: [_jsx(Thead, { children: _jsx(Tr, { bg: "gray.50", children: listPreview.headers.map((header) => (_jsx(Th, { children: header }, header))) }) }), _jsx(Tbody, { children: displayRows.map((row, idx) => (_jsx(Tr, { children: listPreview.headers.map((header) => (_jsx(Td, { fontSize: "xs", whiteSpace: "normal", children: row[header] || "" }, header))) }, idx))) })] }));
                                                                                })() }) })] }) }), _jsx(TabPanel, { p: 0, children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Aper\u00E7u des exigences cr\u00E9\u00E9es" }), _jsxs(HStack, { justify: "space-between", mb: 2, children: [_jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["Lignes ", listPreviewStartRowIndex + 1, " \u00E0 ", Math.min(listPreviewStartRowIndex + 5, listPreview.totalRows || 0), " sur ", listPreview.totalRows || 0] }), _jsxs(HStack, { spacing: 1, children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => setListPreviewStartRowIndex(Math.max(0, listPreviewStartRowIndex - 5)), isDisabled: listPreviewStartRowIndex === 0 || isLoadingListPreview, children: "\u2190 Pr\u00E9c\u00E9dent" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setListPreviewStartRowIndex(Math.min(listPreviewStartRowIndex + 5, (listPreview.totalRows || 0) - 1)), isDisabled: listPreviewStartRowIndex + 5 >= (listPreview.totalRows || 0) || isLoadingListPreview, children: "Suivant \u2192" })] })] })] }), _jsx(TableContainer, { maxH: "240px", overflowY: "auto", overflowX: "auto", borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsx(Table, { size: "sm", children: (() => {
                                                                                    const resolvedMapping = resolveListMapping(listPreview.headers, listMapping);
                                                                                    const columns = [
                                                                                        { key: "id", label: "ID" },
                                                                                        { key: "requirementId", label: "Code" },
                                                                                        { key: "requirementTitle", label: "Titre" },
                                                                                        { key: "requirementText", label: "Texte", maxW: "300px" }
                                                                                    ];
                                                                                    const displayRows = listPreview.sampleRows.slice(listPreviewStartRowIndex, listPreviewStartRowIndex + 5);
                                                                                    return (_jsxs(_Fragment, { children: [_jsx(Thead, { children: _jsx(Tr, { bg: "gray.50", children: columns.map((col) => (_jsx(Th, { children: col.label }, col.key))) }) }), _jsx(Tbody, { children: displayRows.map((row, idx) => {
                                                                                                    const idValue = "ID_" + (listPreviewStartRowIndex + idx + 1);
                                                                                                    const codeValue = (resolvedMapping.requirementId && row[resolvedMapping.requirementId]) || "";
                                                                                                    const titleValue = (resolvedMapping.requirementTitle && row[resolvedMapping.requirementTitle]) || "";
                                                                                                    const textValue = (resolvedMapping.requirementText && row[resolvedMapping.requirementText]) || "";
                                                                                                    return (_jsxs(Tr, { children: [_jsx(Td, { fontSize: "xs", fontFamily: "mono", children: idValue }), _jsx(Td, { fontSize: "xs", children: codeValue }), _jsx(Td, { fontSize: "xs", children: titleValue }), _jsx(Td, { fontSize: "xs", maxW: "300px", whiteSpace: "normal", children: textValue })] }, idx));
                                                                                                }) })] }));
                                                                                })() }) })] }) })] })] }) })] })) : (_jsx(Text, { color: "gray.500", children: "Aucun aper\u00E7u disponible." })) }), _jsx(Box, { p: 4, borderTopWidth: "1px", borderTopColor: "gray.200", children: _jsxs(HStack, { spacing: 2, justify: "flex-end", children: [_jsx(Button, { variant: "outline", onClick: onListMappingClose, children: "Annuler" }), _jsx(Button, { colorScheme: "green", onClick: handleConfirmListImport, isLoading: isUploading, isDisabled: !listMapping.requirementText || isLoadingListPreview, children: "Confirmer l'import" })] }) })] })] })] }));
}
