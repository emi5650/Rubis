import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Divider, Heading, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { generateReport, getAuditLog, getReports } from "../api/rubis";
export function RedactionPage({ campaignId }) {
    const toast = useToast();
    const [reports, setReports] = useState([]);
    const [logs, setLogs] = useState([]);
    async function refreshData() {
        if (!campaignId) {
            setReports([]);
            setLogs([]);
            return;
        }
        const [reportsData, logsData] = await Promise.all([
            getReports(campaignId),
            getAuditLog(campaignId)
        ]);
        setReports(reportsData);
        setLogs(logsData.slice(0, 20));
    }
    useEffect(() => {
        refreshData().catch((error) => {
            toast({ status: "error", title: "Chargement rédaction", description: String(error) });
        });
    }, [campaignId]);
    async function handleGenerate() {
        if (!campaignId) {
            toast({ status: "warning", title: "Sélectionne une campagne" });
            return;
        }
        try {
            await generateReport(campaignId);
            await refreshData();
            toast({ status: "success", title: "Rapport généré" });
        }
        catch (error) {
            toast({ status: "error", title: "Génération rapport", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "R\u00E9daction" }), _jsx(Text, { color: "gray.600", children: "G\u00E9n\u00E9ration de rapports et consultation du journal d\u2019audit." }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(Box, { children: [_jsx(Heading, { size: "sm", mb: 2, children: "G\u00E9n\u00E9rer un rapport" }), _jsx(Text, { fontSize: "sm", color: "gray.600", mb: 3, children: "Cr\u00E9e un nouveau rapport d'audit pour cette campagne." }), _jsx(Button, { colorScheme: "blue", onClick: handleGenerate, children: "G\u00E9n\u00E9rer un rapport d'audit" })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Heading, { size: "sm", mb: 3, children: "Rapports g\u00E9n\u00E9r\u00E9s" }), _jsxs(Stack, { spacing: 2, children: [reports.map((report) => (_jsxs(Text, { fontSize: "sm", children: [report.title, " \u2014 ", new Date(report.generatedAt).toLocaleString("fr-FR"), " (v", report.version, ")"] }, report.id))), reports.length === 0 && _jsx(Text, { color: "gray.500", fontSize: "sm", children: "Aucun rapport g\u00E9n\u00E9r\u00E9." })] })] })] }) }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Journal r\u00E9cent" }), _jsxs(Stack, { spacing: 2, children: [logs.map((log) => (_jsxs(Text, { fontSize: "sm", children: [new Date(log.timestamp).toLocaleString("fr-FR"), " \u2014 ", log.action, " \u2014 ", log.details] }, log.id))), logs.length === 0 && _jsx(Text, { color: "gray.500", fontSize: "sm", children: "Aucun \u00E9v\u00E8nement de journal." })] })] })] }));
}
