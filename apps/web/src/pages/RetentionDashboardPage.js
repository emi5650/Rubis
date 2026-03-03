import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Heading, HStack, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getExpiredPeople, purgeExpiredPeople } from "../api/rubis";
export function RetentionDashboardPage() {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [previewCount, setPreviewCount] = useState(null);
    async function refreshExpired() {
        setIsLoading(true);
        try {
            const data = await getExpiredPeople(500);
            setItems(data.items);
        }
        catch (error) {
            toast({ status: "error", title: "Chargement rétention", description: String(error) });
        }
        finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        void refreshExpired();
    }, []);
    async function handleDryRun() {
        setIsPurging(true);
        try {
            const result = await purgeExpiredPeople({ dryRun: true, limit: 500 });
            setPreviewCount(result.selectedCount);
            toast({ status: "info", title: "Dry-run purge", description: `${result.selectedCount} enregistrement(s) éligible(s)` });
        }
        catch (error) {
            toast({ status: "error", title: "Dry-run purge", description: String(error) });
        }
        finally {
            setIsPurging(false);
        }
    }
    async function handlePurge() {
        setIsPurging(true);
        try {
            const result = await purgeExpiredPeople({ dryRun: false, limit: 500 });
            toast({ status: "success", title: "Purge soft exécutée", description: `${result.selectedCount} enregistrement(s) marqués supprimés` });
            setPreviewCount(null);
            await refreshExpired();
        }
        catch (error) {
            toast({ status: "error", title: "Purge soft", description: String(error) });
        }
        finally {
            setIsPurging(false);
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "RGPD Retention" }), _jsx(Text, { color: "gray.600", children: "Suivi des enregistrements expir\u00E9s et purge logique." }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(HStack, { children: [_jsx(Button, { onClick: () => void handleDryRun(), isLoading: isPurging, children: "Dry-run purge expired" }), _jsx(Button, { onClick: () => void handlePurge(), isLoading: isPurging, children: "Purge expired" }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Expir\u00E9s: ", items.length] }), previewCount !== null ? _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Pr\u00E9visualisation: ", previewCount] }) : null] }), _jsx(Box, { overflowX: "auto", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Nom" }), _jsx(Th, { children: "Email" }), _jsx(Th, { children: "Campagne" }), _jsx(Th, { children: "Retention until" }), _jsx(Th, { children: "Statut" })] }) }), _jsxs(Tbody, { children: [items.map((person) => (_jsxs(Tr, { children: [_jsx(Td, { children: person.displayName || "-" }), _jsx(Td, { children: person.mail || "-" }), _jsx(Td, { children: person.campaignId || "-" }), _jsx(Td, { children: person.retentionUntil ? new Date(person.retentionUntil).toLocaleString("fr-FR") : "-" }), _jsx(Td, { children: person.deletedAt ? "deleted" : person.status || "unknown" })] }, person.id))), !isLoading && items.length === 0 ? (_jsx(Tr, { children: _jsx(Td, { colSpan: 5, children: _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun enregistrement expir\u00E9." }) }) })) : null] })] }) })] }) })] }));
}
