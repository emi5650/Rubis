import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, Checkbox, FormControl, FormLabel, Heading, HStack, Input, Select, Stack, Text, Textarea, useToast, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPerson, refreshPersonFromAd, updatePerson } from "../api/rubis";
export function PersonDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [person, setPerson] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [mail, setMail] = useState("");
    const [department, setDepartment] = useState("");
    const [company, setCompany] = useState("");
    const [title, setTitle] = useState("");
    const [passiScopesRaw, setPassiScopesRaw] = useState("");
    const [isAuditManager, setIsAuditManager] = useState(false);
    const [passiAttestationValidUntil, setPassiAttestationValidUntil] = useState("");
    const [purpose, setPurpose] = useState("");
    const [lawfulBasis, setLawfulBasis] = useState("");
    const [tagsRaw, setTagsRaw] = useState("");
    const [notes, setNotes] = useState("");
    const [retentionDays, setRetentionDays] = useState("365");
    const [status, setStatus] = useState("unknown");
    const tags = useMemo(() => tagsRaw.split(",").map((value) => value.trim()).filter(Boolean), [tagsRaw]);
    const passiScopes = useMemo(() => passiScopesRaw.split(",").map((value) => value.trim()).filter(Boolean), [passiScopesRaw]);
    function fillForm(data) {
        setDisplayName(data.displayName || "");
        setMail(data.mail || "");
        setDepartment(data.department || "");
        setCompany(data.company || "");
        setTitle(data.title || "");
        setPassiScopesRaw((data.passiScopes || []).join(", "));
        setIsAuditManager(Boolean(data.isAuditManager));
        setPassiAttestationValidUntil(data.passiAttestationValidUntil || "");
        setPurpose(data.purpose || "");
        setLawfulBasis(data.lawfulBasis || "");
        setTagsRaw((data.tags || []).join(", "));
        setNotes(data.notes || "");
        setRetentionDays(String(data.retentionDays || 365));
        setStatus(data.status || "unknown");
    }
    async function refresh() {
        if (!id) {
            return;
        }
        setIsLoading(true);
        try {
            const data = await getPerson(id);
            setPerson(data);
            fillForm(data);
        }
        catch (error) {
            toast({ status: "error", title: "Chargement personne", description: String(error) });
            navigate("/people");
        }
        finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        void refresh();
    }, [id]);
    async function handleSave() {
        if (!id) {
            return;
        }
        setIsSaving(true);
        try {
            const payloadRetention = Number(retentionDays);
            const updated = await updatePerson(id, {
                displayName: displayName.trim() || undefined,
                mail: mail.trim() || undefined,
                department: department.trim() || undefined,
                company: company.trim() || undefined,
                title: title.trim() || undefined,
                passiScopes,
                isAuditManager,
                passiAttestationValidUntil: passiAttestationValidUntil.trim() || undefined,
                purpose: purpose.trim() || undefined,
                lawfulBasis: lawfulBasis.trim() || undefined,
                tags,
                notes: notes.trim() || undefined,
                retentionDays: Number.isFinite(payloadRetention) ? Math.max(1, Math.floor(payloadRetention)) : undefined,
                status
            });
            setPerson(updated);
            fillForm(updated);
            toast({ status: "success", title: "Personne mise à jour" });
        }
        catch (error) {
            toast({ status: "error", title: "Mise à jour personne", description: String(error) });
        }
        finally {
            setIsSaving(false);
        }
    }
    async function handleRefreshAd() {
        if (!id) {
            return;
        }
        setIsRefreshing(true);
        try {
            const updated = await refreshPersonFromAd(id);
            setPerson(updated);
            fillForm(updated);
            toast({ status: "success", title: "Rafraîchissement AD lancé" });
        }
        catch (error) {
            toast({ status: "error", title: "Rafraîchissement AD", description: String(error) });
        }
        finally {
            setIsRefreshing(false);
        }
    }
    if (!id) {
        return _jsx(Text, { children: "Identifiant invalide." });
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsxs(HStack, { justify: "space-between", children: [_jsx(Heading, { size: "md", children: "Person Detail" }), _jsxs(HStack, { children: [_jsx(Button, { variant: "outline", onClick: () => navigate("/people"), children: "Retour annuaire" }), _jsx(Button, { onClick: () => void handleRefreshAd(), isLoading: isRefreshing, children: "Refresh AD" })] })] }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(HStack, { children: [_jsx(Badge, { colorScheme: status === "active" ? "green" : status === "disabled" ? "orange" : "gray", children: status }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Source: ", person?.source || "-"] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Mis \u00E0 jour: ", person ? new Date(person.updatedAt).toLocaleString("fr-FR") : "-"] })] }), _jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Nom affich\u00E9" }), _jsx(Input, { value: displayName, onChange: (event) => setDisplayName(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Email" }), _jsx(Input, { value: mail, onChange: (event) => setMail(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { maxW: "220px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Statut" }), _jsxs(Select, { value: status, onChange: (event) => setStatus(event.target.value), children: [_jsx("option", { value: "active", children: "active" }), _jsx("option", { value: "disabled", children: "disabled" }), _jsx("option", { value: "unknown", children: "unknown" })] })] })] }), _jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "D\u00E9partement" }), _jsx(Input, { value: department, onChange: (event) => setDepartment(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Soci\u00E9t\u00E9" }), _jsx(Input, { value: company, onChange: (event) => setCompany(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Fonction" }), _jsx(Input, { value: title, onChange: (event) => setTitle(event.target.value), isDisabled: isLoading })] })] }), _jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Port\u00E9es PASSI (virgules)" }), _jsx(Input, { value: passiScopesRaw, onChange: (event) => setPassiScopesRaw(event.target.value), placeholder: "ex: GOV, APP, INFRA", isDisabled: isLoading })] }), _jsxs(FormControl, { maxW: "260px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Fin validit\u00E9 attestation PASSI" }), _jsx(Input, { type: "date", value: passiAttestationValidUntil, onChange: (event) => setPassiAttestationValidUntil(event.target.value), isDisabled: isLoading })] })] }), _jsx(Box, { children: _jsx(Checkbox, { isChecked: isAuditManager, onChange: (event) => setIsAuditManager(event.target.checked), isDisabled: isLoading, children: "Responsable d'audit PASSI" }) }), _jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Finalit\u00E9" }), _jsx(Input, { value: purpose, onChange: (event) => setPurpose(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Base l\u00E9gale" }), _jsx(Input, { value: lawfulBasis, onChange: (event) => setLawfulBasis(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { maxW: "220px", children: [_jsx(FormLabel, { fontSize: "sm", children: "R\u00E9tention (jours)" }), _jsx(Input, { type: "number", min: 1, value: retentionDays, onChange: (event) => setRetentionDays(event.target.value), isDisabled: isLoading })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Tags (s\u00E9par\u00E9s par virgule)" }), _jsx(Input, { value: tagsRaw, onChange: (event) => setTagsRaw(event.target.value), isDisabled: isLoading })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Notes" }), _jsx(Textarea, { rows: 4, value: notes, onChange: (event) => setNotes(event.target.value), isDisabled: isLoading })] }), _jsxs(Text, { fontSize: "sm", color: "gray.500", children: ["Retention until: ", person?.retentionUntil ? new Date(person.retentionUntil).toLocaleString("fr-FR") : "-"] }), _jsx(Box, { children: _jsx(Button, { onClick: () => void handleSave(), isLoading: isSaving, children: "Enregistrer" }) })] }) })] }));
}
