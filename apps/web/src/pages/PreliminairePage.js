import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { saveConvention } from "../api/rubis";
export function PreliminairePage({ campaignId }) {
    const toast = useToast();
    const [auditedOrganization, setAuditedOrganization] = useState("");
    const [sponsorOrganization, setSponsorOrganization] = useState("");
    const [auditType, setAuditType] = useState("interne");
    const [perimeter, setPerimeter] = useState("");
    const [constraints, setConstraints] = useState("");
    const [mode, setMode] = useState("hybride");
    async function handleSaveConvention() {
        if (!campaignId) {
            toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
            return;
        }
        try {
            await saveConvention({
                campaignId,
                auditedOrganization,
                sponsorOrganization,
                auditType,
                perimeter,
                constraints,
                mode
            });
            toast({ status: "success", title: "Convention enregistrée" });
        }
        catch (error) {
            toast({ status: "error", title: "Convention", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", children: "Pr\u00E9liminaire" }), _jsx(Text, { color: "gray.600", mt: 1, children: "Convention d'audit et param\u00E8tres initiaux." }), campaignId && (_jsxs(Badge, { colorScheme: "green", mt: 2, fontSize: "sm", px: 3, py: 1, children: ["Campagne active : ", campaignId] })), !campaignId && (_jsx(Badge, { colorScheme: "red", mt: 2, fontSize: "sm", px: 3, py: 1, children: "Aucune campagne s\u00E9lectionn\u00E9e" }))] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Convention d'audit" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Organisation audit\u00E9e" }), _jsx(Input, { value: auditedOrganization, onChange: (event) => setAuditedOrganization(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Organisation sponsor" }), _jsx(Input, { value: sponsorOrganization, onChange: (event) => setSponsorOrganization(event.target.value) })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Type d'audit" }), _jsxs(Select, { value: auditType, onChange: (event) => setAuditType(event.target.value), children: [_jsx("option", { value: "interne", children: "Interne" }), _jsx("option", { value: "externe", children: "Externe" }), _jsx("option", { value: "mixte", children: "Mixte" })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Mode" }), _jsxs(Select, { value: mode, onChange: (event) => setMode(event.target.value), children: [_jsx("option", { value: "sur-site", children: "Sur site" }), _jsx("option", { value: "distance", children: "Distance" }), _jsx("option", { value: "hybride", children: "Hybride" })] })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "P\u00E9rim\u00E8tre" }), _jsx(Input, { value: perimeter, onChange: (event) => setPerimeter(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Contraintes" }), _jsx(Input, { value: constraints, onChange: (event) => setConstraints(event.target.value) })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveConvention, children: "Enregistrer la convention" }) })] })] })] }));
}
