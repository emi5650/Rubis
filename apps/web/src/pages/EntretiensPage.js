import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, Stack, Text, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createInterviewee, createInterviewSlot, getInterviewees, getInterviewSlots } from "../api/rubis";
export function EntretiensPage({ campaignId }) {
    const toast = useToast();
    const [interviewees, setInterviewees] = useState([]);
    const [slots, setSlots] = useState([]);
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [entity, setEntity] = useState("");
    const [slotTitle, setSlotTitle] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [mode, setMode] = useState("hybride");
    const [room, setRoom] = useState("");
    const [teamsLink, setTeamsLink] = useState("");
    const [theme, setTheme] = useState("");
    const [criterionCode, setCriterionCode] = useState("");
    async function refreshData() {
        if (!campaignId) {
            setInterviewees([]);
            setSlots([]);
            return;
        }
        const [intervieweesData, slotsData] = await Promise.all([
            getInterviewees(campaignId),
            getInterviewSlots(campaignId)
        ]);
        setInterviewees(intervieweesData);
        setSlots(slotsData);
    }
    useEffect(() => {
        refreshData().catch((error) => {
            toast({ status: "error", title: "Chargement entretiens", description: String(error) });
        });
    }, [campaignId]);
    async function handleCreateInterviewee() {
        if (!campaignId) {
            toast({ status: "warning", title: "Sélectionne une campagne" });
            return;
        }
        try {
            await createInterviewee({ campaignId, fullName, role, email, entity });
            setFullName("");
            setRole("");
            setEmail("");
            setEntity("");
            await refreshData();
            toast({ status: "success", title: "Interviewé ajouté" });
        }
        catch (error) {
            toast({ status: "error", title: "Interviewé", description: String(error) });
        }
    }
    async function handleCreateSlot() {
        if (!campaignId) {
            toast({ status: "warning", title: "Sélectionne une campagne" });
            return;
        }
        try {
            await createInterviewSlot({ campaignId, title: slotTitle, startAt, endAt, mode, room, teamsLink, theme, criterionCode });
            setSlotTitle("");
            setStartAt("");
            setEndAt("");
            setTheme("");
            setCriterionCode("");
            await refreshData();
            toast({ status: "success", title: "Créneau ajouté" });
        }
        catch (error) {
            toast({ status: "error", title: "Créneau", description: String(error) });
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "Entretiens" }), _jsx(Text, { color: "gray.600", children: "Pilotage des interview\u00E9s et des cr\u00E9neaux d\u2019entretien." }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Interview\u00E9s" }), _jsxs(VStack, { spacing: 4, align: "stretch", mb: 4, children: [_jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom complet" }), _jsx(Input, { value: fullName, onChange: (event) => setFullName(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00F4le" }), _jsx(Input, { value: role, onChange: (event) => setRole(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: (event) => setEmail(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Entit\u00E9" }), _jsx(Input, { value: entity, onChange: (event) => setEntity(event.target.value) })] })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleCreateInterviewee, children: "Ajouter" }) })] }), _jsxs(Stack, { spacing: 2, children: [interviewees.map((item) => (_jsxs(Text, { fontSize: "sm", children: [item.fullName, " \u2014 ", item.role, " (", item.email, ")"] }, item.id))), interviewees.length === 0 && _jsx(Text, { color: "gray.500", fontSize: "sm", children: "Aucun interview\u00E9." })] })] }), _jsxs(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: [_jsx(Heading, { size: "sm", mb: 4, children: "Cr\u00E9neaux" }), _jsxs(VStack, { spacing: 4, align: "stretch", mb: 4, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Titre" }), _jsx(Input, { value: slotTitle, onChange: (event) => setSlotTitle(event.target.value) })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 3 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "D\u00E9but" }), _jsx(Input, { type: "datetime-local", value: startAt, onChange: (event) => setStartAt(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fin" }), _jsx(Input, { type: "datetime-local", value: endAt, onChange: (event) => setEndAt(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Mode" }), _jsxs(Select, { value: mode, onChange: (event) => setMode(event.target.value), children: [_jsx("option", { value: "sur-site", children: "Sur site" }), _jsx("option", { value: "distance", children: "Distance" }), _jsx("option", { value: "hybride", children: "Hybride" })] })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Salle" }), _jsx(Input, { value: room, onChange: (event) => setRoom(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Lien Teams" }), _jsx(Input, { value: teamsLink, onChange: (event) => setTeamsLink(event.target.value) })] })] }), _jsxs(SimpleGrid, { columns: { base: 1, md: 2 }, spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Th\u00E8me" }), _jsx(Input, { value: theme, onChange: (event) => setTheme(event.target.value) })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Code crit\u00E8re" }), _jsx(Input, { value: criterionCode, onChange: (event) => setCriterionCode(event.target.value) })] })] }), _jsx(Box, { children: _jsx(Button, { colorScheme: "blue", onClick: handleCreateSlot, children: "Ajouter le cr\u00E9neau" }) })] }), _jsxs(Stack, { spacing: 2, children: [slots.map((slot) => (_jsxs(Text, { fontSize: "sm", children: [slot.title, " \u2014 ", slot.startAt, " \u2192 ", slot.endAt, " (", slot.mode, ")"] }, slot.id))), slots.length === 0 && _jsx(Text, { color: "gray.500", fontSize: "sm", children: "Aucun cr\u00E9neau." })] })] })] }));
}
