import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exportRegistryDocumentsCsv, listRegistryDocuments, uploadRegistryDocument } from "../api/rubis";
export function DocumentRegistryPage({ campaignId }) {
    const toast = useToast();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
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
        }
        catch (error) {
            toast({ status: "error", title: "Upload document", description: String(error) });
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Export CSV", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", children: "Document Registry" }), _jsx(Text, { color: "gray.600", mt: 1, children: "R\u00E9f\u00E9rentiel documentaire sans IA, avec validation et tra\u00E7abilit\u00E9." })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Importer un document" }), _jsxs(Stack, { spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fichier" }), _jsx(Input, { type: "file", onChange: (event) => setSelectedFile(event.target.files?.[0] || null), accept: ".pdf,.txt,.csv,.xlsx,.xls,.docx,image/*" })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleUpload, isLoading: isUploading, children: "Importer" }) })] })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsxs(HStack, { justify: "space-between", mb: 4, children: [_jsx(Heading, { size: "sm", children: "Documents" }), _jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { maxW: "260px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Filtre statut" }), _jsxs(Select, { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Tous" }), _jsx("option", { value: "imported", children: "imported" }), _jsx("option", { value: "extracted", children: "extracted" }), _jsx("option", { value: "needs_review", children: "needs_review" }), _jsx("option", { value: "validated", children: "validated" }), _jsx("option", { value: "archived", children: "archived" })] })] }), _jsx(Button, { variant: "outline", onClick: handleExportCsv, children: "Exporter CSV" })] })] }), _jsx(TableContainer, { borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { bg: "gray.50", children: _jsxs(Tr, { children: [_jsx(Th, { children: "Titre" }), _jsx(Th, { children: "Version" }), _jsx(Th, { children: "Publi\u00E9 le" }), _jsx(Th, { children: "Sensibilit\u00E9" }), _jsx(Th, { children: "Statut" }), _jsx(Th, { children: "Maj" }), _jsx(Th, { textAlign: "right", children: "Action" })] }) }), _jsxs(Tbody, { children: [filteredDocuments.map((item) => (_jsxs(Tr, { children: [_jsx(Td, { children: item.title.value || item.filename }), _jsx(Td, { children: item.version.value || "-" }), _jsx(Td, { children: item.publishedAt.value || "-" }), _jsx(Td, { children: item.sensitivity.value || "-" }), _jsx(Td, { children: _jsx(Badge, { colorScheme: item.status === "validated" ? "green" : item.status === "needs_review" ? "orange" : "gray", children: item.status }) }), _jsx(Td, { children: new Date(item.updatedAt).toLocaleString("fr-FR") }), _jsx(Td, { textAlign: "right", children: _jsx(Button, { size: "xs", variant: "outline", colorScheme: "blue", onClick: () => navigate(`/document-registry/${item.id}`), children: "D\u00E9tails" }) })] }, item.id))), filteredDocuments.length === 0 ? (_jsx(Tr, { children: _jsx(Td, { colSpan: 7, children: _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun document pour ce filtre." }) }) })) : null] })] }) })] })] }));
}
