import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createCriterion, getCriteria } from "../api/rubis";
export function PreparationPage({ campaignId }) {
    const toast = useToast();
    const [criteria, setCriteria] = useState([]);
    const [code, setCode] = useState("");
    const [title, setTitle] = useState("");
    const [theme, setTheme] = useState("");
    async function refreshCriteria() {
        if (!campaignId) {
            setCriteria([]);
            return;
        }
        const data = await getCriteria(campaignId);
        setCriteria(data);
    }
    useEffect(() => {
        refreshCriteria().catch((error) => {
            toast({ status: "error", title: "Chargement critères", description: String(error) });
        });
    }, [campaignId]);
    async function handleCreateCriterion() {
        if (!campaignId) {
            toast({ status: "warning", title: "Sélectionne une campagne" });
            return;
        }
        try {
            await createCriterion({ campaignId, code, title, theme });
            setCode("");
            setTitle("");
            setTheme("");
            await refreshCriteria();
            toast({ status: "success", title: "Critère ajouté" });
        }
        catch (error) {
            toast({ status: "error", title: "Création critère", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Pr\u00E9paration" }), _jsx(Text, { color: "gray.600", children: "Structuration des crit\u00E8res d\u2019audit." }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Crit\u00E8res" }), _jsx(VStack, { spacing: 4, align: "stretch", mb: 4, children: _jsxs(HStack, { spacing: 3, children: [_jsxs(FormControl, { maxW: "120px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Code" }), _jsx(Input, { value: code, onChange: (event) => setCode(event.target.value) })] }), _jsxs(FormControl, { flex: 1, children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre" }), _jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value) })] }), _jsxs(FormControl, { maxW: "200px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me" }), _jsx(Input, { value: theme, onChange: (event) => setTheme(event.target.value) })] }), _jsx(Box, { pt: 7, children: _jsx(Button, { colorScheme: "blue", onClick: handleCreateCriterion, children: "Ajouter" }) })] }) }), _jsxs(Stack, { spacing: 2, children: [criteria.map((criterion) => (_jsxs(Text, { fontSize: "sm", children: [criterion.code, " \u2014 ", criterion.title, " (", criterion.theme, ")"] }, criterion.id))), criteria.length === 0 && _jsx(Text, { color: "gray.500", fontSize: "sm", children: "Aucun crit\u00E8re pour cette campagne." })] })] })] }));
}
