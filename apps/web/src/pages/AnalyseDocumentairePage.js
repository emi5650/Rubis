import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { analyzeDocumentUpload, confirmAnalyzedDocument, getDocuments, saveDocumentReview } from "../api/rubis";
export function AnalyseDocumentairePage({ campaignId }) {
    const toast = useToast();
    const [documents, setDocuments] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [tempUploadId, setTempUploadId] = useState("");
    const [extractedBy, setExtractedBy] = useState("fallback");
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
        }
        catch (error) {
            toast({ status: "error", title: "Analyse documentaire", description: String(error) });
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Validation document", description: String(error) });
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Revue documentaire", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Analyse documentaire" }), _jsx(Text, { color: "gray.600", children: "Upload intelligent des documents audit\u00E9s, validation des m\u00E9tadonn\u00E9es puis revue documentaire." }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 1, children: "Import intelligent d'un document audit\u00E9" }), _jsx(Text, { fontSize: "sm", color: "gray.600", mb: 4, children: "L'IA extrait les m\u00E9tadonn\u00E9es; tu valides puis le document est enregistr\u00E9 avec un ID interne." }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fichier (PDF, Office, image, texte)" }), _jsx(Input, { type: "file", onChange: (event) => setSelectedFile(event.target.files?.[0] || null), accept: ".pdf,.txt,.csv,.xlsx,.xls,.docx,image/*" })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleCreateDocument, isLoading: isAnalyzing, children: "Analyser le document avec l'IA" }) }), tempUploadId ? (_jsxs(_Fragment, { children: [_jsx(HStack, { children: _jsx(Badge, { colorScheme: extractedBy === "fallback" ? "orange" : "green", children: extractedBy === "ollama"
                                                ? "Extraction IA Mistral (Ollama)"
                                                : extractedBy === "openai"
                                                    ? "Extraction IA OpenAI"
                                                    : "Extraction fallback" }) }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre" }), _jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Version" }), _jsx(Input, { value: version, onChange: (event) => setVersion(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Date de publication" }), _jsx(Input, { type: "date", value: publicationDate, onChange: (event) => setPublicationDate(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nombre de pages" }), _jsx(Input, { type: "number", min: 1, value: pageCount, onChange: (event) => setPageCount(event.target.value) })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Auteurs (s\u00E9par\u00E9s par virgule)" }), _jsx(Input, { value: authors, onChange: (event) => setAuthors(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Historique" }), _jsx(Textarea, { value: history, onChange: (event) => setHistory(event.target.value), rows: 3 })] }), _jsx(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 3, children: _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Sensibilit\u00E9" }), _jsxs(Select, { value: sensitivity, onChange: (event) => setSensitivity(event.target.value), children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "interne", children: "Interne" }), _jsx("option", { value: "confidentiel", children: "Confidentiel" }), _jsx("option", { value: "secret", children: "Secret" })] })] }) }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00E9sum\u00E9" }), _jsx(Textarea, { value: summary, onChange: (event) => setSummary(event.target.value), rows: 4 })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleConfirmDocument, isLoading: isConfirming, children: "Valider et enregistrer le document" }) })] })) : null] })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "R\u00E9f\u00E9rentiel documentaire de l'audit" }), _jsx(TableContainer, { borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { bg: "gray.50", children: _jsxs(Tr, { children: [_jsx(Th, { children: "ID interne" }), _jsx(Th, { children: "Titre" }), _jsx(Th, { children: "Version" }), _jsx(Th, { children: "Date" }), _jsx(Th, { children: "Auteurs" }), _jsx(Th, { children: "Pages" }), _jsx(Th, { children: "Sensibilit\u00E9" })] }) }), _jsxs(Tbody, { children: [documents.map((document) => (_jsxs(Tr, { children: [_jsx(Td, { children: document.internalId || "-" }), _jsx(Td, { children: document.name }), _jsx(Td, { children: document.version || "-" }), _jsx(Td, { children: document.date || "-" }), _jsx(Td, { children: document.authors || "-" }), _jsx(Td, { children: document.pageCount ?? "-" }), _jsx(Td, { children: document.sensitivity })] }, document.id))), documents.length === 0 ? (_jsx(Tr, { children: _jsx(Td, { colSpan: 7, children: _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun document enregistr\u00E9 pour cette campagne." }) }) })) : null] })] }) })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Revue documentaire" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Document" }), _jsx(Select, { value: documentId, onChange: (event) => setDocumentId(event.target.value), placeholder: "S\u00E9lectionner un document", children: documents.map((document) => (_jsx("option", { value: document.id, children: document.internalId ? `${document.internalId} — ${document.name}` : document.name }, document.id))) })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Version" }), _jsx(Input, { value: maturityLevel, onChange: (event) => setMaturityLevel(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Niveau conformit\u00E9" }), _jsx(Input, { value: complianceLevel, onChange: (event) => setComplianceLevel(event.target.value) })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Points \u00E0 investiguer" }), _jsx(Input, { value: pointsToInvestigate, onChange: (event) => setPointsToInvestigate(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Verdict pr\u00E9liminaire" }), _jsx(Input, { value: preliminaryVerdict, onChange: (event) => setPreliminaryVerdict(event.target.value) })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveReview, children: "Enregistrer la revue" }) })] })] })] }));
}
