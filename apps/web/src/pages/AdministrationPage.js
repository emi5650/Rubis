import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, FormControl, FormLabel, Heading, Input, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getOpenAiKeyStatus, setOpenAiKey } from "../api/rubis";
export function AdministrationPage({ campaignId }) {
    const toast = useToast();
    const [apiKey, setApiKey] = useState("");
    const [configured, setConfigured] = useState(false);
    const [updatedAt, setUpdatedAt] = useState(null);
    useEffect(() => {
        getOpenAiKeyStatus()
            .then((status) => {
            setConfigured(status.configured);
            setUpdatedAt(status.updatedAt);
        })
            .catch((error) => {
            toast({ status: "error", title: "Chargement clé OpenAI", description: String(error) });
        });
    }, []);
    async function handleSaveKey() {
        if (!apiKey.trim()) {
            toast({ status: "warning", title: "Clé API requise" });
            return;
        }
        try {
            const result = await setOpenAiKey(apiKey.trim());
            setConfigured(result.configured);
            setUpdatedAt(new Date().toISOString());
            setApiKey("");
            toast({ status: "success", title: "Clé OpenAI enregistrée" });
        }
        catch (error) {
            toast({ status: "error", title: "Clé OpenAI", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Administration" }), _jsx(Text, { color: "gray.600", children: "Gestion des acc\u00E8s et des int\u00E9grations externes." }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", color: "gray.700", children: "Cl\u00E9 API OpenAI" }), _jsx(Badge, { colorScheme: configured ? "green" : "red", mt: 1, children: configured ? "Configurée" : "Non configurée" }), updatedAt && (_jsxs(Text, { fontSize: "xs", color: "gray.500", mt: 1, children: ["Derniere mise a jour : ", new Date(updatedAt).toLocaleString("fr-FR")] }))] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nouvelle cl\u00E9 OpenAI" }), _jsx(Input, { type: "password", value: apiKey, onChange: (event) => setApiKey(event.target.value), placeholder: "sk-..." })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveKey, children: "Enregistrer la cl\u00E9" }) })] }) }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(Text, { fontSize: "sm", color: "gray.600", children: ["Campagne active : ", campaignId || "Aucune campagne sélectionnée"] }) })] }));
}
