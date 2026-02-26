import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, FormControl, FormLabel, Heading, HStack, Input, SimpleGrid, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createCriterion, getCriteria, saveAuditPlan } from "../api/rubis";
export function PreparationPage({ campaignId }) {
    const toast = useToast();
    const [criteria, setCriteria] = useState([]);
    const [code, setCode] = useState("");
    const [title, setTitle] = useState("");
    const [theme, setTheme] = useState("");
    const [objectives, setObjectives] = useState("");
    const [scope, setScope] = useState("");
    const [methods, setMethods] = useState("");
    const [samplingStrategy, setSamplingStrategy] = useState("");
    const [logistics, setLogistics] = useState("");
    const [communicationRules, setCommunicationRules] = useState("");
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
    async function handleSavePlan() {
        if (!campaignId) {
            toast({ status: "warning", title: "Sélectionne une campagne" });
            return;
        }
        try {
            await saveAuditPlan({ campaignId, objectives, scope, methods, samplingStrategy, logistics, communicationRules });
            toast({ status: "success", title: "Plan d’audit enregistré" });
        }
        catch (error) {
            toast({ status: "error", title: "Plan d’audit", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Pr\u00E9paration" }), _jsx(Text, { color: "gray.600", children: "Structuration des crit\u00E8res et planification de l\u2019audit." }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Crit\u00E8res" }), _jsx(VStack, { spacing: 4, align: "stretch", mb: 4, children: _jsxs(HStack, { spacing: 3, children: [_jsxs(FormControl, { maxW: "120px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Code" }), _jsx(Input, { value: code, onChange: (event) => setCode(event.target.value) })] }), _jsxs(FormControl, { flex: 1, children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre" }), _jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value) })] }), _jsxs(FormControl, { maxW: "200px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me" }), _jsx(Input, { value: theme, onChange: (event) => setTheme(event.target.value) })] }), _jsx(Box, { pt: 7, children: _jsx(Button, { colorScheme: "blue", onClick: handleCreateCriterion, children: "Ajouter" }) })] }) }), _jsxs(Stack, { spacing: 2, children: [criteria.map((criterion) => (_jsxs(Text, { fontSize: "sm", children: [criterion.code, " \u2014 ", criterion.title, " (", criterion.theme, ")"] }, criterion.id))), criteria.length === 0 && _jsx(Text, { color: "gray.500", fontSize: "sm", children: "Aucun crit\u00E8re pour cette campagne." })] })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Plan d\u2019audit" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Objectifs" }), _jsx(Input, { value: objectives, onChange: (event) => setObjectives(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "P\u00E9rim\u00E8tre" }), _jsx(Input, { value: scope, onChange: (event) => setScope(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "M\u00E9thodes" }), _jsx(Input, { value: methods, onChange: (event) => setMethods(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Strat\u00E9gie d'\u00E9chantillonnage" }), _jsx(Input, { value: samplingStrategy, onChange: (event) => setSamplingStrategy(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Logistique" }), _jsx(Input, { value: logistics, onChange: (event) => setLogistics(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00E8gles de communication" }), _jsx(Input, { value: communicationRules, onChange: (event) => setCommunicationRules(event.target.value) })] })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSavePlan, children: "Enregistrer le plan" }) })] })] })] }));
}
