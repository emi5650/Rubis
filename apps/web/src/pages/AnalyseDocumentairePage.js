import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createDocument, getDocuments, saveDocumentReview } from "../api/rubis";
export function AnalyseDocumentairePage({ campaignId }) {
    const toast = useToast();
    const [documents, setDocuments] = useState([]);
    const [name, setName] = useState("");
    const [theme, setTheme] = useState("");
    const [version, setVersion] = useState("v1");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
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
        if (!campaignId) {
            toast({ status: "warning", title: "Sélectionne une campagne" });
            return;
        }
        try {
            await createDocument({ campaignId, name, theme, version, date, sensitivity, summary });
            setName("");
            setTheme("");
            setSummary("");
            await refreshDocuments();
            toast({ status: "success", title: "Document ajouté" });
        }
        catch (error) {
            toast({ status: "error", title: "Création document", description: String(error) });
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
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Analyse documentaire" }), _jsx(Text, { color: "gray.600", children: "Gestion des preuves documentaires et de leur revue." }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Nouveau document" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(HStack, { spacing: 3, children: [_jsxs(FormControl, { flex: 1, children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom" }), _jsx(Input, { value: name, onChange: (event) => setName(event.target.value) })] }), _jsxs(FormControl, { maxW: "200px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me" }), _jsx(Input, { value: theme, onChange: (event) => setTheme(event.target.value) })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 3 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Version" }), _jsx(Input, { value: version, onChange: (event) => setVersion(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Date" }), _jsx(Input, { type: "date", value: date, onChange: (event) => setDate(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Sensibilit\u00E9" }), _jsx(Input, { value: sensitivity, onChange: (event) => setSensitivity(event.target.value) })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00E9sum\u00E9" }), _jsx(Input, { value: summary, onChange: (event) => setSummary(event.target.value) })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleCreateDocument, children: "Ajouter" }) })] })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Revue documentaire" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Document" }), _jsx(Select, { value: documentId, onChange: (event) => setDocumentId(event.target.value), placeholder: "S\u00E9lectionner un document", children: documents.map((document) => (_jsx("option", { value: document.id, children: document.name }, document.id))) })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Niveau de maturit\u00E9" }), _jsx(Input, { value: maturityLevel, onChange: (event) => setMaturityLevel(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Niveau conformit\u00E9" }), _jsx(Input, { value: complianceLevel, onChange: (event) => setComplianceLevel(event.target.value) })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Points \u00E0 investiguer" }), _jsx(Input, { value: pointsToInvestigate, onChange: (event) => setPointsToInvestigate(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Verdict pr\u00E9liminaire" }), _jsx(Input, { value: preliminaryVerdict, onChange: (event) => setPreliminaryVerdict(event.target.value) })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveReview, children: "Enregistrer la revue" }) })] })] })] }));
}
