import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Stack, Text, useDisclosure, useToast, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Tabs, TabList, TabPanels, Tab, TabPanel, Textarea, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getConfig, getReferentials, importReferential, setConfig, getReferentialRequirements, deleteReferential, importReferentialFromList, importReferentialFromFreeText, exportReferential, previewRubisImport, confirmRubisImport } from "../api/rubis";
export function ParametragePage({ campaignId }) {
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
    const [ollamaModel, setOllamaModel] = useState("mistral");
    const [referentials, setReferentials] = useState([]);
    // Mode 0: Generic import (legacy)
    const [selectedFile, setSelectedFile] = useState(null);
    // Mode 1: Rubis format
    const [rubisFile, setRubisFile] = useState(null);
    // Mode 2: List format
    const [listFile, setListFile] = useState(null);
    const [codeColumn, setCodeColumn] = useState("Code");
    const [textColumn, setTextColumn] = useState("Texte");
    const [scopesColumn, setScopesColumn] = useState("Scopes");
    // Mode 3: Free text
    const [freeTextName, setFreeTextName] = useState("");
    const [freeText, setFreeText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [selectedReferential, setSelectedReferential] = useState(null);
    const [referentialRequirements, setReferentialRequirements] = useState([]);
    const [isLoadingRequirements, setIsLoadingRequirements] = useState(false);
    // Preview modal state
    const [previewData, setPreviewData] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    async function refreshReferentials() {
        const data = await getReferentials();
        setReferentials(data);
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
    }, []);
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
    async function handleImportList() {
        if (!listFile) {
            toast({ status: "warning", title: "Selectionne un fichier" });
            return;
        }
        try {
            setIsUploading(true);
            const result = await importReferentialFromList(listFile, codeColumn, textColumn, scopesColumn);
            toast({ status: "success", title: `Liste importee (${result.requirementCount} exigences)` });
            setListFile(null);
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
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Param\u00E9trage" }), _jsx(Text, { color: "gray.600", children: "Configuration globale Rubis et mod\u00E8le IA actif." }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", color: "gray.700", children: "Campagne active" }), _jsx(Badge, { colorScheme: campaignId ? "green" : "gray", mt: 1, children: campaignId || "Aucune campagne sélectionnée" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Mod\u00E8le Ollama" }), _jsx(Input, { value: ollamaModel, onChange: (event) => setOllamaModel(event.target.value), placeholder: "Ex: mistral, llama2..." })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSave, children: "Enregistrer le mod\u00E8le IA" }) })] }) }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "sm", mb: 1, children: "Referentiels" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Importer un r\u00E9f\u00E9rentiel de 3 fa\u00E7ons diff\u00E9rentes ou exporter un existant." })] }), _jsxs(Tabs, { variant: "enclosed", colorScheme: "blue", children: [_jsxs(TabList, { children: [_jsx(Tab, { children: "Format Rubis" }), _jsx(Tab, { children: "Liste d'exigences" }), _jsx(Tab, { children: "Texte libre" })] }), _jsxs(TabPanels, { children: [_jsx(TabPanel, { children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Importer depuis un fichier structur\u00E9 (PDF, Excel, CSV, TXT)" }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fichier Rubis" }), _jsx(Input, { type: "file", accept: ".pdf,.xlsx,.xls,.csv,.txt", onChange: (event) => setRubisFile(event.target.files?.[0] || null) }), rubisFile && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 2, children: ["Fichier selectionne : ", rubisFile.name] }))] }), _jsx(Button, { colorScheme: "blue", onClick: handleImportRubisFormat, isLoading: isLoadingPreview || isUploading, children: "Importer au format Rubis" })] }) }), _jsx(TabPanel, { children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Importer un fichier avec colonnes (Code, Texte, Scopes, etc.)" }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fichier liste" }), _jsx(Input, { type: "file", accept: ".xlsx,.xls,.csv,.txt", onChange: (event) => setListFile(event.target.files?.[0] || null) }), listFile && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 2, children: ["Fichier selectionne : ", listFile.name] }))] }), _jsxs(HStack, { spacing: 2, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Colonne Code" }), _jsx(Input, { size: "sm", value: codeColumn, onChange: (e) => setCodeColumn(e.target.value), placeholder: "Ex: Code, ID, Req" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Colonne Texte" }), _jsx(Input, { size: "sm", value: textColumn, onChange: (e) => setTextColumn(e.target.value), placeholder: "Ex: Texte, Description" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Colonne Scopes" }), _jsx(Input, { size: "sm", value: scopesColumn, onChange: (e) => setScopesColumn(e.target.value), placeholder: "Ex: Scopes, Tags" })] })] }), _jsx(Button, { colorScheme: "blue", onClick: handleImportList, isLoading: isUploading, children: "Importer la liste" })] }) }), _jsx(TabPanel, { children: _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Coller du texte libre - l'IA en extraira les exigences" }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom du r\u00E9f\u00E9rentiel" }), _jsx(Input, { value: freeTextName, onChange: (e) => setFreeTextName(e.target.value), placeholder: "Ex: Audit de conformit\u00E9 2026" })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Texte libre" }), _jsx(Textarea, { value: freeText, onChange: (e) => setFreeText(e.target.value), rows: 10, placeholder: "Collez votre texte ici... L'IA extraira les exigences." })] }), _jsx(Button, { colorScheme: "blue", onClick: handleImportFreeText, isLoading: isUploading, children: "Transformer le texte en exigences" })] }) })] })] }), _jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Referentiels disponibles" }), _jsxs(Stack, { spacing: 2, children: [referentials.map((item) => (_jsxs(Box, { borderWidth: "1px", borderColor: "gray.200", rounded: "md", p: 3, bg: "blue.50", cursor: "pointer", transition: "all 0.2s", _hover: { bg: "blue.100", borderColor: "blue.400", shadow: "md" }, onClick: () => handleViewReferential(item), children: [_jsxs(Text, { fontSize: "sm", fontWeight: "semibold", children: [item.name, " (v", item.version, ")"] }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["Document: ", item.documentName, " v", item.documentVersion, " - ", item.documentDate] }), _jsxs(Text, { fontSize: "xs", color: "gray.600", children: ["Importe le ", new Date(item.importedAt).toLocaleDateString("fr-FR"), " - ", item.requirementCount, " exigences"] }), _jsx(Text, { fontSize: "xs", color: "blue.600", fontWeight: "semibold", mt: 1, children: "Cliquer pour voir les d\u00E9tails \u2192" })] }, item.id))), referentials.length === 0 && (_jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun referentiel importe." }))] })] })] }) }), _jsxs(Modal, { isOpen: isOpen, onClose: onClose, size: "2xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { maxH: "90vh", children: [_jsxs(ModalHeader, { display: "flex", justifyContent: "space-between", alignItems: "center", pr: 14, children: [_jsxs(Box, { children: [selectedReferential?.name, " (v", selectedReferential?.version, ")"] }), _jsxs(HStack, { spacing: 2, children: [_jsx(Button, { size: "sm", colorScheme: "green", onClick: handleExportReferential, children: "Exporter" }), _jsx(Button, { size: "sm", colorScheme: "red", onClick: handleDeleteReferential, children: "Supprimer" })] })] }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { overflowY: "auto", children: selectedReferential && (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", children: "Informations" }), _jsxs(HStack, { spacing: 4, mt: 2, fontSize: "sm", color: "gray.600", children: [_jsxs(Box, { children: [_jsx(Text, { fontWeight: "semibold", children: "Document" }), _jsx(Text, { children: selectedReferential.documentName })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "semibold", children: "Version" }), _jsx(Text, { children: selectedReferential.documentVersion })] }), _jsxs(Box, { children: [_jsx(Text, { fontWeight: "semibold", children: "Date" }), _jsx(Text, { children: selectedReferential.documentDate })] })] })] }), _jsxs(Box, { children: [_jsxs(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: ["Exigences (", referentialRequirements.length, ")"] }), isLoadingRequirements ? (_jsx(Text, { color: "gray.500", children: "Chargement..." })) : (_jsx(TableContainer, { maxH: "400px", overflowY: "auto", borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { bg: "gray.50", children: [_jsx(Th, { children: "Code" }), _jsx(Th, { children: "Niveau 1" }), _jsx(Th, { children: "Texte" }), _jsx(Th, { children: "Scopes" })] }) }), _jsx(Tbody, { children: referentialRequirements.map((req) => (_jsxs(Tr, { children: [_jsx(Td, { fontSize: "xs", children: req.requirementId }), _jsx(Td, { fontSize: "xs", children: req.themeLevel1Title || req.themeLevel1 || "-" }), _jsxs(Td, { fontSize: "xs", maxW: "300px", whiteSpace: "normal", children: [req.requirementText.substring(0, 100), "..."] }), _jsx(Td, { fontSize: "xs", children: req.scopes.length > 0 ? (_jsx(Stack, { spacing: 0, children: req.scopes.map((scope) => (_jsx(Badge, { size: "sm", colorScheme: "blue", children: scope }, scope))) })) : (_jsx(Text, { children: "-" })) })] }, req.id))) })] }) }))] })] })) })] })] }), _jsxs(Modal, { isOpen: isPreviewOpen, onClose: onPreviewClose, size: "2xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { maxH: "90vh", children: [_jsx(ModalHeader, { children: "Aper\u00E7u de l'import" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { overflowY: "auto", children: isLoadingPreview ? (_jsxs(VStack, { spacing: 4, justify: "center", py: 10, children: [_jsx(Spinner, { size: "lg", color: "blue.500" }), _jsx(Text, { color: "gray.600", children: "Analyse du fichier..." })] })) : previewData ? (_jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { bg: "blue.50", p: 4, borderWidth: "1px", borderColor: "blue.200", rounded: "md", children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: "Informations d\u00E9tect\u00E9es par l'IA" }), _jsxs(Stack, { spacing: 2, fontSize: "sm", children: [_jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "R\u00E9f\u00E9rentiel :" }), _jsxs(Text, { children: [previewData.referentialName, " (v", previewData.referentialVersion, ")"] })] }), _jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "Document :" }), _jsxs(Text, { children: [previewData.documentName, " v", previewData.documentVersion] })] }), _jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "Date :" }), _jsx(Text, { children: previewData.documentDate || "Non détectée" })] }), _jsxs(HStack, { justify: "space-between", children: [_jsx(Text, { fontWeight: "semibold", children: "Exigences :" }), _jsxs(Badge, { colorScheme: "green", children: [previewData.requirementCount, " trouv\u00E9es"] })] })] })] }), _jsxs(Box, { children: [_jsxs(Text, { fontSize: "sm", fontWeight: "semibold", mb: 2, children: ["Aper\u00E7u des exigences (", previewData.requirements.length, " affich\u00E9es", previewData.hasMore && ` + ${previewData.requirementCount - previewData.requirements.length} autres`, ")"] }), _jsx(TableContainer, { maxH: "300px", overflowY: "auto", borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { bg: "gray.50", children: [_jsx(Th, { children: "Code" }), _jsx(Th, { children: "Texte" })] }) }), _jsx(Tbody, { children: previewData.requirements.map((req, idx) => (_jsxs(Tr, { children: [_jsx(Td, { fontSize: "xs", fontWeight: "semibold", children: req.requirementId || "-" }), _jsxs(Td, { fontSize: "xs", maxW: "400px", whiteSpace: "normal", children: [req.requirementText.substring(0, 100), req.requirementText.length > 100 ? "..." : ""] })] }, idx))) })] }) }), previewData.hasMore && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 2, children: ["\u2192 ", previewData.requirementCount - previewData.requirements.length, " exigences suppl\u00E9mentaires d\u00E9tect\u00E9es"] }))] }), _jsxs(Box, { bg: "yellow.50", p: 3, borderWidth: "1px", borderColor: "yellow.200", rounded: "md", fontSize: "xs", color: "gray.700", children: [_jsx(Text, { fontWeight: "semibold", mb: 1, children: "V\u00E9rifier les informations" }), _jsx(Text, { children: "Confirmez que le r\u00E9f\u00E9rentiel et les exigences d\u00E9tect\u00E9es sont corrects avant de valider l'import." })] })] })) : null }), _jsx(Box, { p: 4, borderTopWidth: "1px", borderTopColor: "gray.200", children: _jsxs(HStack, { spacing: 2, justify: "flex-end", children: [_jsx(Button, { variant: "outline", onClick: onPreviewClose, children: "Annuler" }), _jsx(Button, { colorScheme: "green", onClick: handleConfirmRubisImport, isLoading: isUploading, isDisabled: !previewData || isLoadingPreview, children: "Confirmer l'import" })] }) })] })] })] }));
}
