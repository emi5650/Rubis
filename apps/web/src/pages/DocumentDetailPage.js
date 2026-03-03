import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, HStack, Input, Select, Stack, Text, Textarea, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteRegistryDocument, getRegistryDocument, patchRegistryDocument } from "../api/rubis";
export function DocumentDetailPage({ campaignId }) {
    const toast = useToast();
    const navigate = useNavigate();
    const { id = "" } = useParams();
    const [record, setRecord] = useState(null);
    const [events, setEvents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [title, setTitle] = useState("");
    const [version, setVersion] = useState("");
    const [publishedAt, setPublishedAt] = useState("");
    const [author, setAuthor] = useState("");
    const [sensitivity, setSensitivity] = useState("interne");
    const [status, setStatus] = useState("needs_review");
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
        setEvidencePreview(response.record.title.evidence?.snippet ||
            response.record.version.evidence?.snippet ||
            response.record.publishedAt.evidence?.snippet ||
            "");
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
        }
        catch (error) {
            toast({ status: "error", title: "Sauvegarde document", description: String(error) });
        }
        finally {
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
        }
        catch (error) {
            toast({ status: "error", title: "Suppression document", description: String(error) });
        }
        finally {
            setIsDeleting(false);
        }
    }
    if (!record) {
        return (_jsxs(Box, { children: [_jsx(Heading, { size: "md", children: "Document Registry \u2014 D\u00E9tail" }), _jsx(Text, { color: "gray.600", mt: 2, children: "Chargement..." })] }));
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsxs(HStack, { justify: "space-between", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", children: "Document Detail" }), _jsx(Text, { color: "gray.600", mt: 1, children: record.filename })] }), _jsx(Badge, { colorScheme: status === "validated" ? "green" : status === "needs_review" ? "orange" : "gray", children: status })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Champs extraits" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre" }), _jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Version" }), _jsx(Input, { value: version, onChange: (event) => setVersion(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Date de publication" }), _jsx(Input, { type: "date", value: publishedAt, onChange: (event) => setPublishedAt(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Auteur(s)" }), _jsx(Input, { value: author, onChange: (event) => setAuthor(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Sensibilit\u00E9" }), _jsxs(Select, { value: sensitivity, onChange: (event) => setSensitivity(event.target.value), children: [_jsx("option", { value: "public", children: "Public" }), _jsx("option", { value: "interne", children: "Interne" }), _jsx("option", { value: "confidentiel", children: "Confidentiel" }), _jsx("option", { value: "secret", children: "Secret" })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Statut" }), _jsxs(Select, { value: status, onChange: (event) => setStatus(event.target.value), children: [_jsx("option", { value: "imported", children: "imported" }), _jsx("option", { value: "extracted", children: "extracted" }), _jsx("option", { value: "needs_review", children: "needs_review" }), _jsx("option", { value: "validated", children: "validated" }), _jsx("option", { value: "archived", children: "archived" })] })] }), _jsxs(HStack, { children: [_jsx(Button, { colorScheme: "blue", onClick: handleSave, isLoading: isSaving, children: "Enregistrer" }), _jsx(Button, { variant: "outline", colorScheme: "red", onClick: handleDelete, isLoading: isDeleting, children: "Supprimer" }), _jsx(Button, { variant: "ghost", onClick: () => navigate("/document-registry"), children: "Retour" })] })] })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 3, children: "Evidence (aper\u00E7u)" }), _jsx(Textarea, { value: evidencePreview, isReadOnly: true, rows: 5 })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Historique des \u00E9v\u00E9nements" }), _jsxs(VStack, { align: "stretch", spacing: 2, children: [events.map((event) => (_jsxs(Box, { borderWidth: "1px", borderColor: "gray.200", rounded: "md", p: 3, children: [_jsxs(HStack, { justify: "space-between", mb: 1, children: [_jsx(Badge, { colorScheme: event.actor === "system" ? "purple" : "blue", children: event.action }), _jsx(Text, { fontSize: "xs", color: "gray.500", children: new Date(event.timestamp).toLocaleString("fr-FR") })] }), _jsx(Text, { fontSize: "sm", color: "gray.700", children: event.details })] }, event.id))), events.length === 0 ? _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun \u00E9v\u00E9nement." }) : null] })] })] }));
}
