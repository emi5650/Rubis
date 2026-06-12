import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Card, CardBody, Divider, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign, getCampaigns } from "../api/rubis";
export function CampaignSelectionPage({ onCampaignChange }) {
    const toast = useToast();
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const projectCodePattern = /^[A-Za-z0-9_]+-\d{6}-[A-Za-z0-9_]+-[A-Za-z0-9_-]+$/;
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [name, setName] = useState("");
    const [projectCode, setProjectCode] = useState("");
    async function refreshCampaigns() {
        const data = await getCampaigns();
        setCampaigns(data);
    }
    useEffect(() => {
        refreshCampaigns().catch((error) => {
            toast({ status: "error", title: "Chargement campagnes", description: String(error) });
        });
    }, []);
    async function handleCreateCampaign() {
        if (!name.trim()) {
            toast({ status: "warning", title: "Le nom de la campagne est requis" });
            return;
        }
        if (!projectCode.trim()) {
            toast({ status: "warning", title: "Le code projet est requis" });
            return;
        }
        if (!projectCodePattern.test(projectCode.trim())) {
            toast({
                status: "warning",
                title: "Format code projet invalide",
                description: "Format attendu: ID_Client-999999-Client-Mention"
            });
            return;
        }
        try {
            const created = await createCampaign({
                name: name.trim(),
                projectCode: projectCode.trim().toUpperCase()
            });
            await refreshCampaigns();
            onCampaignChange(created.id);
            setName("");
            setProjectCode("");
            toast({ status: "success", title: "Campagne créée" });
            navigate("/organisation");
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
        navigate("/organisation");
    }
    return (_jsx(Box, { minH: "100vh", bg: "gray.50", display: "flex", alignItems: "center", justifyContent: "center", p: 4, children: _jsx(Box, { maxW: "900px", w: "100%", children: _jsxs(VStack, { spacing: 6, align: "stretch", children: [_jsxs(Box, { textAlign: "center", mb: 4, children: [_jsx(Heading, { size: "xl", mb: 2, color: "brand.900", children: "Rubis Audit" }), _jsx(Text, { color: "gray.600", children: "Choisis une campagne existante ou cr\u00E9e une nouvelle campagne." }), _jsx(Text, { color: "gray.500", fontSize: "sm", mt: 1, children: "Le r\u00E9f\u00E9rentiel d\u2019audit sera saisi \u00E0 l\u2019\u00E9tape suivante." }), _jsx(Button, { colorScheme: "blue", size: "sm", mt: 3, onClick: () => navigate("/administration"), children: "Administration" })] }), _jsx(Card, { children: _jsx(CardBody, { children: _jsxs(VStack, { spacing: 5, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 1, children: "S\u00E9lectionner une campagne existante" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "Reprendre une campagne d'audit en cours" }), _jsxs(VStack, { spacing: 3, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Campagne" }), _jsx(Select, { value: selectedCampaignId, onChange: (event) => setSelectedCampaignId(event.target.value), placeholder: campaigns.length === 0 ? "Aucune campagne disponible" : "Choisir une campagne...", size: "lg", children: campaigns.map((campaign) => (_jsxs("option", { value: campaign.id, children: [campaign.name, " (", campaign.projectCode || "N/A", ")"] }, campaign.id))) })] }), _jsx(Button, { colorScheme: "blue", size: "lg", onClick: handleSelectCampaign, isDisabled: !selectedCampaignId, children: "Ouvrir cette campagne" })] })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Heading, { size: "md", mb: 1, children: "Cr\u00E9er une nouvelle campagne" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "D\u00E9marrer une nouvelle campagne d'audit" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom de la campagne" }), _jsx(Input, { placeholder: "Ex: Audit ISO 27001 - 2026 Q1", value: name, onChange: (event) => setName(event.target.value), size: "lg" })] }), _jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Code projet" }), _jsx(Input, { placeholder: "Ex: ID_Client-999999-Client-Mention", value: projectCode, onChange: (event) => setProjectCode(event.target.value), size: "lg" }), _jsx(Text, { fontSize: "xs", color: "gray.500", mt: 1, children: "Format habituel: ID_Client-999999-Client-Mention" })] })] }), _jsx(Button, { colorScheme: "green", size: "lg", onClick: handleCreateCampaign, isDisabled: !name.trim() || !projectCode.trim(), children: "Cr\u00E9er et commencer" })] })] })] }) }) })] }) }) }));
}
