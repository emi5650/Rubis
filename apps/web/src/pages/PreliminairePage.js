import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, Checkbox, CheckboxGroup, FormControl, FormLabel, Heading, HStack, Input, Select, SimpleGrid, Spinner, Progress, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { getAuditDirectory, getAuditTeam, saveAuditPlan, saveAuditTeam, saveConvention, saveScopingNote } from "../api/rubis";
import { PASSI_CHECKLIST_TOTAL_ITEMS, PassiChecklist, passiChecklistStorageKey } from "../components/PassiChecklist";
export function PreliminairePage({ campaignId }) {
    const toast = useToast();
    const [auditDirectory, setAuditDirectory] = useState([]);
    const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState([]);
    const [isLoadingTeamData, setIsLoadingTeamData] = useState(false);
    const [isSavingTeam, setIsSavingTeam] = useState(false);
    const [checklistProgress, setChecklistProgress] = useState(0);
    const [auditedOrganization, setAuditedOrganization] = useState("");
    const [sponsorOrganization, setSponsorOrganization] = useState("");
    const [auditType, setAuditType] = useState("interne");
    const [perimeter, setPerimeter] = useState("");
    const [constraints, setConstraints] = useState("");
    const [mode, setMode] = useState("hybride");
    const [objectives, setObjectives] = useState("");
    const [assumptions, setAssumptions] = useState("");
    const [exclusions, setExclusions] = useState("");
    const [stakeholders, setStakeholders] = useState("");
    const [planningConstraints, setPlanningConstraints] = useState("");
    const [planObjectives, setPlanObjectives] = useState("");
    const [scope, setScope] = useState("");
    const [methods, setMethods] = useState("");
    const [samplingStrategy, setSamplingStrategy] = useState("");
    const [logistics, setLogistics] = useState("");
    const [communicationRules, setCommunicationRules] = useState("");
    useEffect(() => {
        if (!campaignId) {
            setChecklistProgress(0);
            return;
        }
        try {
            const raw = localStorage.getItem(passiChecklistStorageKey(campaignId));
            const checked = raw ? JSON.parse(raw) : {};
            const checkedCount = Object.values(checked).filter(Boolean).length;
            const progress = PASSI_CHECKLIST_TOTAL_ITEMS > 0 ? Math.round((checkedCount / PASSI_CHECKLIST_TOTAL_ITEMS) * 100) : 0;
            setChecklistProgress(progress);
        }
        catch {
            setChecklistProgress(0);
        }
    }, [campaignId]);
    useEffect(() => {
        let cancelled = false;
        async function loadTeamData() {
            if (!campaignId) {
                setAuditDirectory([]);
                setSelectedTeamMemberIds([]);
                return;
            }
            setIsLoadingTeamData(true);
            try {
                const [directory, team] = await Promise.all([getAuditDirectory(), getAuditTeam(campaignId)]);
                if (cancelled)
                    return;
                const availableIds = new Set(directory.map((member) => member.id));
                setAuditDirectory(directory);
                setSelectedTeamMemberIds(team.memberIds.filter((id) => availableIds.has(id)));
            }
            catch (error) {
                if (!cancelled) {
                    toast({ status: "error", title: "Equipe", description: String(error) });
                }
            }
            finally {
                if (!cancelled) {
                    setIsLoadingTeamData(false);
                }
            }
        }
        loadTeamData();
        return () => {
            cancelled = true;
        };
    }, [campaignId]);
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
    async function handleSaveScopingNote() {
        if (!campaignId) {
            toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
            return;
        }
        try {
            await saveScopingNote({
                campaignId,
                objectives,
                assumptions,
                exclusions,
                stakeholders,
                planningConstraints
            });
            toast({ status: "success", title: "Note de cadrage enregistrée" });
        }
        catch (error) {
            toast({ status: "error", title: "Note de cadrage", description: String(error) });
        }
    }
    async function handleSaveAuditPlan() {
        if (!campaignId) {
            toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
            return;
        }
        try {
            await saveAuditPlan({
                campaignId,
                objectives: planObjectives,
                scope,
                methods,
                samplingStrategy,
                logistics,
                communicationRules
            });
            toast({ status: "success", title: "Plan d’audit enregistré" });
        }
        catch (error) {
            toast({ status: "error", title: "Plan d’audit", description: String(error) });
        }
    }
    async function handleSaveTeam() {
        if (!campaignId) {
            toast({ status: "warning", title: "Aucune campagne sélectionnée", description: "Retournez à l'accueil pour choisir une campagne" });
            return;
        }
        try {
            setIsSavingTeam(true);
            await saveAuditTeam({ campaignId, memberIds: selectedTeamMemberIds });
            toast({ status: "success", title: "Equipe enregistrée" });
        }
        catch (error) {
            toast({ status: "error", title: "Equipe", description: String(error) });
        }
        finally {
            setIsSavingTeam(false);
        }
    }
    const documentsCompletion = useMemo(() => {
        const isFilled = (value) => value.trim().length > 0;
        const conventionComplete = isFilled(auditedOrganization) &&
            isFilled(sponsorOrganization) &&
            isFilled(perimeter);
        const scopingComplete = isFilled(objectives) &&
            isFilled(stakeholders) &&
            isFilled(planningConstraints);
        const planComplete = isFilled(planObjectives) &&
            isFilled(scope) &&
            isFilled(methods);
        const completedSections = [conventionComplete, scopingComplete, planComplete].filter(Boolean).length;
        const progress = Math.round((completedSections / 3) * 100);
        return {
            completedSections,
            progress,
            complete: completedSections === 3
        };
    }, [
        auditedOrganization,
        sponsorOrganization,
        perimeter,
        objectives,
        stakeholders,
        planningConstraints,
        planObjectives,
        scope,
        methods
    ]);
    const checklistComplete = checklistProgress === 100;
    const teamComplete = selectedTeamMemberIds.length > 0;
    const directoryComplete = auditDirectory.length > 0;
    const documentsComplete = documentsCompletion.complete;
    const completedTabs = [checklistComplete, teamComplete, directoryComplete, documentsComplete].filter(Boolean).length;
    const globalProgress = Math.round((completedTabs / 4) * 100);
    function statusBadge(complete, inProgress) {
        if (complete) {
            return _jsx(Badge, { colorScheme: "green", children: "Complet" });
        }
        if (inProgress) {
            return _jsx(Badge, { colorScheme: "orange", children: "En cours" });
        }
        return _jsx(Badge, { colorScheme: "gray", children: "\u00C0 faire" });
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { children: [_jsx(Heading, { size: "md", children: "Organisation" }), _jsx(Text, { color: "gray.600", mt: 1, children: "Gestion structur\u00E9e par onglets: checklist, \u00E9quipe, annuaire et documents." })] }), _jsxs(Box, { bg: "white", p: 4, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsxs(Stack, { direction: { base: "column", md: "row" }, align: { base: "flex-start", md: "center" }, justify: "space-between", mb: 2, children: [_jsx(Text, { fontSize: "sm", color: "gray.700", fontWeight: "semibold", children: "Progression Organisation" }), _jsxs(Badge, { colorScheme: globalProgress === 100 ? "green" : "orange", children: [completedTabs, "/4 onglets complets"] })] }), _jsx(Progress, { value: globalProgress, size: "sm", colorScheme: "orange", rounded: "md" })] }), _jsxs(Tabs, { variant: "enclosed", colorScheme: "orange", bg: "white", borderWidth: "1px", borderColor: "gray.200", rounded: "lg", p: 4, children: [_jsxs(TabList, { children: [_jsx(Tab, { children: _jsxs(HStack, { spacing: 2, children: [_jsx(Text, { children: "Checklist" }), statusBadge(checklistComplete, checklistProgress > 0)] }) }), _jsx(Tab, { children: _jsxs(HStack, { spacing: 2, children: [_jsx(Text, { children: "Equipe" }), statusBadge(teamComplete, selectedTeamMemberIds.length > 0)] }) }), _jsx(Tab, { children: _jsxs(HStack, { spacing: 2, children: [_jsx(Text, { children: "Annuaire" }), statusBadge(directoryComplete, directoryComplete)] }) }), _jsx(Tab, { children: _jsxs(HStack, { spacing: 2, children: [_jsx(Text, { children: "Documents" }), statusBadge(documentsComplete, documentsCompletion.progress > 0)] }) })] }), _jsxs(TabPanels, { children: [_jsx(TabPanel, { px: 0, children: _jsx(PassiChecklist, { campaignId: campaignId, onProgressChange: setChecklistProgress }) }), _jsx(TabPanel, { px: 0, children: _jsxs(Box, { bg: "white", p: 2, children: [_jsx(Heading, { size: "sm", mb: 1, children: "Equipe" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "S\u00E9lection des auditeurs/experts pour la campagne en cours." }), isLoadingTeamData ? (_jsxs(HStack, { children: [_jsx(Spinner, { size: "sm" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Chargement de l'annuaire..." })] })) : auditDirectory.length === 0 ? (_jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun membre dans l'annuaire. Ajoutez-les depuis Param\u00E9trage." })) : (_jsxs(VStack, { align: "stretch", spacing: 4, children: [_jsx(CheckboxGroup, { value: selectedTeamMemberIds, onChange: (values) => setSelectedTeamMemberIds(values), children: _jsx(VStack, { align: "stretch", spacing: 2, children: auditDirectory.map((member) => (_jsx(Checkbox, { value: member.id, children: _jsxs(HStack, { spacing: 2, children: [_jsx(Text, { children: member.fullName }), _jsx(Badge, { colorScheme: member.profile === "expert" ? "purple" : "orange", children: member.profile }), member.email && _jsxs(Text, { fontSize: "xs", color: "gray.500", children: ["(", member.email, ")"] })] }) }, member.id))) }) }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveTeam, isLoading: isSavingTeam, children: "Enregistrer l'\u00E9quipe" }) })] }))] }) }), _jsx(TabPanel, { px: 0, children: _jsxs(Box, { bg: "white", p: 2, children: [_jsx(Heading, { size: "sm", mb: 1, children: "Annuaire" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "R\u00E9f\u00E9rence en lecture seule de l'annuaire administr\u00E9 dans Param\u00E9trage." }), isLoadingTeamData ? (_jsxs(HStack, { children: [_jsx(Spinner, { size: "sm" }), _jsx(Text, { fontSize: "sm", color: "gray.600", children: "Chargement..." })] })) : auditDirectory.length === 0 ? (_jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun membre disponible." })) : (_jsx(VStack, { align: "stretch", spacing: 2, children: auditDirectory.map((member) => (_jsxs(HStack, { justify: "space-between", borderWidth: "1px", borderColor: "gray.200", rounded: "md", px: 3, py: 2, children: [_jsx(Text, { children: member.fullName }), _jsxs(HStack, { spacing: 2, children: [_jsx(Badge, { colorScheme: member.profile === "expert" ? "purple" : "orange", children: member.profile }), _jsx(Text, { fontSize: "xs", color: "gray.500", children: member.email || "-" })] })] }, member.id))) }))] }) }), _jsx(TabPanel, { px: 0, children: _jsxs(Stack, { spacing: 6, children: [_jsxs(Box, { bg: "white", p: 2, children: [_jsx(Heading, { size: "sm", mb: 1, children: "Convention d'audit" }), _jsx(Text, { fontSize: "sm", color: "gray.500", mb: 4, children: "Optionnelle selon le type d'audit (ex: audit de maturit\u00E9)." }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Organisation audit\u00E9e" }), _jsx(Input, { value: auditedOrganization, onChange: (event) => setAuditedOrganization(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Organisation sponsor" }), _jsx(Input, { value: sponsorOrganization, onChange: (event) => setSponsorOrganization(event.target.value) })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Type d'audit" }), _jsxs(Select, { value: auditType, onChange: (event) => setAuditType(event.target.value), children: [_jsx("option", { value: "interne", children: "Interne" }), _jsx("option", { value: "externe", children: "Externe" }), _jsx("option", { value: "mixte", children: "Mixte" })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Mode" }), _jsxs(Select, { value: mode, onChange: (event) => setMode(event.target.value), children: [_jsx("option", { value: "sur-site", children: "Sur site" }), _jsx("option", { value: "distance", children: "Distance" }), _jsx("option", { value: "hybride", children: "Hybride" })] })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "P\u00E9rim\u00E8tre" }), _jsx(Input, { value: perimeter, onChange: (event) => setPerimeter(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Contraintes" }), _jsx(Input, { value: constraints, onChange: (event) => setConstraints(event.target.value) })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveConvention, children: "Enregistrer la convention (optionnel)" }) })] })] }), _jsxs(Box, { bg: "white", p: 2, children: [_jsx(Heading, { size: "sm", mb: 4, children: "Note de cadrage" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Objectifs" }), _jsx(Input, { value: objectives, onChange: (event) => setObjectives(event.target.value) })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Hypoth\u00E8ses" }), _jsx(Input, { value: assumptions, onChange: (event) => setAssumptions(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Exclusions" }), _jsx(Input, { value: exclusions, onChange: (event) => setExclusions(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Parties prenantes" }), _jsx(Input, { value: stakeholders, onChange: (event) => setStakeholders(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Contraintes de planning" }), _jsx(Input, { value: planningConstraints, onChange: (event) => setPlanningConstraints(event.target.value) })] })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveScopingNote, children: "Enregistrer la note de cadrage" }) })] })] }), _jsxs(Box, { bg: "white", p: 2, children: [_jsx(Heading, { size: "sm", mb: 4, children: "Plan d\u2019audit" }), _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Objectifs" }), _jsx(Input, { value: planObjectives, onChange: (event) => setPlanObjectives(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "P\u00E9rim\u00E8tre" }), _jsx(Input, { value: scope, onChange: (event) => setScope(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "M\u00E9thodes" }), _jsx(Input, { value: methods, onChange: (event) => setMethods(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Strat\u00E9gie d'\u00E9chantillonnage" }), _jsx(Input, { value: samplingStrategy, onChange: (event) => setSamplingStrategy(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Logistique" }), _jsx(Input, { value: logistics, onChange: (event) => setLogistics(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00E8gles de communication" }), _jsx(Input, { value: communicationRules, onChange: (event) => setCommunicationRules(event.target.value) })] })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleSaveAuditPlan, children: "Enregistrer le plan d\u2019audit" }) })] })] })] }) })] })] })] }));
}
