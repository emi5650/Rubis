import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardBody, Divider, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign, getCampaigns, getReferentials } from "../api/rubis";
export function CampaignSelectionPage({ onCampaignChange }) {
    const toast = useToast();
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [referentialCount, setReferentialCount] = useState(0);
    const [name, setName] = useState("");
    const [framework, setFramework] = useState("ISO 19011");
    const [language, setLanguage] = useState("fr");
    async function refreshCampaigns() {
        const data = await getCampaigns();
        setCampaigns(data);
    }
    useEffect(() => {
        refreshCampaigns().catch((error) => {
            toast({ status: "error", title: "Chargement campagnes", description: String(error) });
        });
        getReferentials()
            .then((data) => setReferentialCount(data.length))
            .catch((error) => {
            toast({ status: "error", title: "Chargement referentiels", description: String(error) });
        });
    }, []);
    async function handleCreateCampaign() {
        if (!name.trim()) {
            toast({ status: "warning", title: "Le nom de la campagne est requis" });
            return;
        }
        try {
            const created = await createCampaign({ name, framework, language });
            await refreshCampaigns();
            onCampaignChange(created.id);
            setName("");
            toast({ status: "success", title: "Campagne créée" });
            navigate("/preliminaire");
        }
        catch (error) {
            toast({ status: "error", title: "Création campagne", description: String(error) });
        }
    }
    function handleSelectCampaign() {
        if (!selectedCampaignId) {
            toast({ status: "warning", title: "Veuillez sélectionner une campagne" });
            return;
        }
        onCampaignChange(selectedCampaignId);
        toast({ status: "success", title: "Campagne sélectionnée" });
        navigate("/preliminaire");
    }
    return (_jsx(Box, { minH: "100vh", bg: "gray.50", display: "flex", alignItems: "center", justifyContent: "center", p: 4, children: _jsx(Box, { maxW: "900px", w: "100%", children: _jsxs(VStack, { spacing: 6, align: "stretch", children: [_jsxs(Box, { textAlign: "center", mb: 4, children: [_jsx(Heading, { size: "xl", mb: 2, color: "brand.900", children: "Rubis Audit" }), _jsx(Text, { color: "gray.600", children: "Plateforme de gestion d'audits assist\u00E9e par IA" }), _jsx(Button, { colorScheme: "blue", size: "sm", mt: 3, onClick: () => navigate("/administration"), children: "Administration" })] }), referentialCount === 0 && (_jsxs(Box, { bg: "orange.50", borderWidth: "1px", borderColor: "orange.200", rounded: "lg", p: 4, children: [_jsx(Heading, { size: "sm", mb: 1, children: "Aucun referentiel detecte" }), _jsx(Text, { fontSize: "sm", color: "gray.700", mb: 3, children: "Importe ton referentiel (PDF, Excel, CSV, TXT) pour demarrer. L'IA le mettra au format Rubis." }), _jsx(Button, { colorScheme: "orange", onClick: () => navigate("/parametrage"), children: "Importer un referentiel" })] })), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(VStack, { spacing: 5, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 1, children: "S\u00E9lectionner une campagne existante" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "Reprendre une campagne d'audit en cours" }), _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Campagne" }), _jsx(Select, { value: selectedCampaignId, onChange: (event) => setSelectedCampaignId(event.target.value), placeholder: campaigns.length === 0 ? "Aucune campagne disponible" : "Choisir une campagne...", size: "lg", children: campaigns.map((campaign) => (_jsx("option", { value: campaign.id, children: campaign.name }, campaign.id))) })] }), _jsx(Button, { colorScheme: "blue", size: "lg", onClick: handleSelectCampaign, isDisabled: !selectedCampaignId, children: "Ouvrir cette campagne" })] })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 1, children: "Cr\u00E9er une nouvelle campagne" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "D\u00E9marrer une nouvelle campagne d'audit" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom de la campagne" }), _jsx(Input, { placeholder: "Ex: Audit ISO 27001 - 2026 Q1", value: name, onChange: (event) => setName(event.target.value), size: "lg" })] }), _jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00E9f\u00E9rentiel d'audit" }), _jsxs(Select, { value: framework, onChange: (event) => setFramework(event.target.value), size: "lg", children: [_jsx("option", { value: "ISO 19011", children: "ISO 19011 (Management de l'audit)" }), _jsx("option", { value: "ISO 27001", children: "ISO 27001 (S\u00E9curit\u00E9 de l'information)" }), _jsx("option", { value: "ISO 9001", children: "ISO 9001 (Management de la qualit\u00E9)" }), _jsx("option", { value: "ISO 14001", children: "ISO 14001 (Management environnemental)" }), _jsx("option", { value: "ISO 45001", children: "ISO 45001 (Sant\u00E9 et s\u00E9curit\u00E9)" }), _jsx("option", { value: "Autre", children: "Autre r\u00E9f\u00E9rentiel" })] })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Langue" }), _jsxs(Select, { value: language, onChange: (event) => setLanguage(event.target.value), size: "lg", children: [_jsx("option", { value: "fr", children: "Fran\u00E7ais" }), _jsx("option", { value: "en", children: "English" })] })] }), _jsx(Button, { colorScheme: "green", size: "lg", onClick: handleCreateCampaign, isDisabled: !name.trim(), children: "Cr\u00E9er et commencer" })] })] })] }) }) })] }) }) }));
}
