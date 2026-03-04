import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Flex, Heading, Input, Stack, Tag, Text, Textarea, useToast } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { createAudit, getAuditFindings, getAuditReport, getAuditScore, ingestAudit, runAudit } from "../api/rubis";
const DEFAULT_CONTROLS = [
    {
        id: "CTRL-DOC-01",
        domain: "gouvernance",
        text: "La politique de sécurité est formalisée, approuvée et diffusée."
    },
    {
        id: "CTRL-DOC-02",
        domain: "acces",
        text: "La revue des droits d'accès est tracée et réalisée périodiquement."
    }
];
export function AuditPocPage({ campaignId }) {
    const toast = useToast();
    const [auditId, setAuditId] = useState("");
    const [referentialId, setReferentialId] = useState("POC-SCHOOL");
    const [ingestPath, setIngestPath] = useState("data_school/docs");
    const [controlsJson, setControlsJson] = useState(JSON.stringify(DEFAULT_CONTROLS, null, 2));
    const [isRunning, setIsRunning] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [findings, setFindings] = useState([]);
    const [globalScore, setGlobalScore] = useState(null);
    const [reportMarkdown, setReportMarkdown] = useState("");
    const [attackPaths, setAttackPaths] = useState([]);
    const [ingestSummary, setIngestSummary] = useState(null);
    const canRun = useMemo(() => campaignId.length > 0 && auditId.trim().length > 0, [campaignId, auditId]);
    async function handleCreateAudit() {
        try {
            const created = await createAudit({
                name: `POC ${new Date().toLocaleString("fr-FR")}`,
                referentialId
            });
            setAuditId(created.id);
            toast({ status: "success", title: "Audit créé", description: created.id });
        }
        catch (error) {
            toast({
                status: "error",
                title: "Création impossible",
                description: error instanceof Error ? error.message : "Erreur inconnue"
            });
        }
    }
    async function handleRun() {
        if (!canRun) {
            return;
        }
        try {
            setIsRunning(true);
            let controls;
            try {
                controls = JSON.parse(controlsJson);
            }
            catch {
                throw new Error("Le JSON des contrôles est invalide.");
            }
            await runAudit(auditId.trim(), { referentialId, controls });
            const findingsResponse = await getAuditFindings(auditId.trim());
            const scoreResponse = await getAuditScore(auditId.trim());
            const reportResponse = await getAuditReport(auditId.trim());
            setFindings(findingsResponse.findings || []);
            setGlobalScore(scoreResponse.score?.globalScore ?? null);
            setReportMarkdown(reportResponse.report || "");
            setAttackPaths((reportResponse.attackPaths || []).map((item) => ({
                id: item.id,
                title: item.title,
                riskLevel: item.riskLevel
            })));
            toast({ status: "success", title: "Évaluation terminée" });
        }
        catch (error) {
            toast({
                status: "error",
                title: "Exécution impossible",
                description: error instanceof Error ? error.message : "Erreur inconnue"
            });
        }
        finally {
            setIsRunning(false);
        }
    }
    async function handleLoadReport() {
        if (!auditId.trim()) {
            return;
        }
        try {
            setIsLoadingReport(true);
            const reportResponse = await getAuditReport(auditId.trim());
            setReportMarkdown(reportResponse.report || "");
            setAttackPaths((reportResponse.attackPaths || []).map((item) => ({
                id: item.id,
                title: item.title,
                riskLevel: item.riskLevel
            })));
            toast({ status: "success", title: "Rapport chargé" });
        }
        catch (error) {
            toast({
                status: "error",
                title: "Chargement rapport impossible",
                description: error instanceof Error ? error.message : "Erreur inconnue"
            });
        }
        finally {
            setIsLoadingReport(false);
        }
    }
    async function handleCopyReport() {
        if (!reportMarkdown.trim()) {
            return;
        }
        try {
            await navigator.clipboard.writeText(reportMarkdown);
            toast({ status: "success", title: "Rapport copié" });
        }
        catch {
            toast({ status: "error", title: "Copie impossible" });
        }
    }
    function handleExportReport() {
        if (!reportMarkdown.trim()) {
            return;
        }
        const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `audit-report-${auditId.trim() || "poc"}.md`;
        anchor.click();
        URL.revokeObjectURL(url);
    }
    async function handleIngest() {
        if (!auditId.trim()) {
            return;
        }
        try {
            setIsIngesting(true);
            const response = await ingestAudit(auditId.trim(), {
                folderPath: ingestPath.trim() || "data_school/docs"
            });
            setIngestSummary(response.ingest);
            toast({
                status: "success",
                title: "Ingest terminé",
                description: `${response.ingest.ingestedDocuments} document(s), ${response.ingest.ingestedChunks} chunk(s)`
            });
        }
        catch (error) {
            toast({
                status: "error",
                title: "Ingest impossible",
                description: error instanceof Error ? error.message : "Erreur inconnue"
            });
        }
        finally {
            setIsIngesting(false);
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", children: "POC Audit RAG" }), _jsx(Text, { color: "gray.600", mt: 1, children: "Ex\u00E9cute /api/audits/:id/run puis affiche les constats avec citations." })] }), _jsxs(Stack, { spacing: 3, bg: "white", p: 4, rounded: "md", shadow: "sm", borderWidth: "1px", borderColor: "gray.200", children: [_jsxs(Flex, { gap: 3, direction: { base: "column", md: "row" }, children: [_jsx(Input, { value: auditId, onChange: (event) => setAuditId(event.target.value), placeholder: "Audit ID" }), _jsx(Input, { value: referentialId, onChange: (event) => setReferentialId(event.target.value), placeholder: "Referential ID" }), _jsx(Button, { onClick: handleCreateAudit, colorScheme: "blue", variant: "outline", children: "Cr\u00E9er audit" })] }), _jsxs(Flex, { gap: 3, direction: { base: "column", md: "row" }, children: [_jsx(Input, { value: ingestPath, onChange: (event) => setIngestPath(event.target.value), placeholder: "Chemin dossier docs (ex: data_school/docs)" }), _jsx(Button, { isLoading: isIngesting, onClick: handleIngest, colorScheme: "teal", variant: "outline", isDisabled: !auditId.trim(), children: "Ingest docs" })] }), ingestSummary ? (_jsxs(Text, { fontSize: "sm", color: "gray.600", children: ["Ingest: ", ingestSummary.ingestedDocuments, " document(s), ", ingestSummary.ingestedChunks, " chunk(s),", " ", ingestSummary.skippedFiles.length, " fichier(s) ignor\u00E9(s)"] })) : null, _jsx(Textarea, { value: controlsJson, onChange: (event) => setControlsJson(event.target.value), minH: "180px", fontFamily: "mono", fontSize: "sm" }), _jsx(Button, { isLoading: isRunning, onClick: handleRun, colorScheme: "orange", isDisabled: !canRun, children: "Lancer l'\u00E9valuation" }), _jsx(Button, { isLoading: isLoadingReport, onClick: handleLoadReport, colorScheme: "purple", variant: "outline", isDisabled: !auditId.trim(), children: "Charger rapport" })] }), _jsxs(Box, { bg: "white", p: 4, rounded: "md", shadow: "sm", borderWidth: "1px", borderColor: "gray.200", children: [_jsxs(Flex, { justify: "space-between", align: "center", mb: 3, children: [_jsx(Heading, { size: "sm", children: "Findings" }), _jsxs(Tag, { colorScheme: "purple", children: ["Score global: ", globalScore ?? "-"] })] }), findings.length === 0 ? (_jsx(Text, { color: "gray.500", children: "Aucun r\u00E9sultat pour le moment." })) : (_jsx(Stack, { spacing: 3, children: findings.map((finding) => (_jsxs(Box, { p: 3, borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: [_jsxs(Flex, { justify: "space-between", align: "center", mb: 2, children: [_jsx(Text, { fontWeight: "semibold", children: finding.controlId }), _jsx(Tag, { colorScheme: finding.status === "CONFORME" ? "green" : finding.status === "INDETERMINE" ? "yellow" : "red", children: finding.status })] }), _jsx(Text, { fontSize: "sm", color: "gray.700", mb: 2, children: finding.rationale }), _jsxs(Text, { fontSize: "xs", color: "gray.500", children: ["Citations: ", finding.citations.length, " \u2022 Gaps: ", finding.evidenceGaps.length, " \u2022 Questions: ", finding.followUpQuestions.length] })] }, `${finding.controlId}-${finding.updatedAt}`))) }))] }), _jsxs(Box, { bg: "white", p: 4, rounded: "md", shadow: "sm", borderWidth: "1px", borderColor: "gray.200", children: [_jsxs(Flex, { justify: "space-between", align: "center", mb: 3, children: [_jsx(Heading, { size: "sm", children: "Rapport" }), _jsxs(Flex, { gap: 2, children: [_jsx(Button, { size: "sm", variant: "outline", onClick: handleCopyReport, isDisabled: !reportMarkdown.trim(), children: "Copier" }), _jsx(Button, { size: "sm", colorScheme: "purple", variant: "outline", onClick: handleExportReport, isDisabled: !reportMarkdown.trim(), children: "Export .md" })] })] }), attackPaths.length > 0 ? (_jsx(Stack, { spacing: 2, mb: 3, children: attackPaths.map((path) => (_jsxs(Flex, { justify: "space-between", align: "center", p: 2, borderWidth: "1px", borderColor: "gray.200", rounded: "md", children: [_jsx(Text, { fontSize: "sm", children: path.title }), _jsx(Tag, { colorScheme: path.riskLevel === "high" ? "red" : path.riskLevel === "medium" ? "orange" : "green", children: path.riskLevel })] }, path.id))) })) : null, _jsx(Textarea, { isReadOnly: true, value: reportMarkdown, minH: "240px", fontFamily: "mono", fontSize: "sm", placeholder: "Le rapport markdown appara\u00EEtra ici." })] })] }));
}
