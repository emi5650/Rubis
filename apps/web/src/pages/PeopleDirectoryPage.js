import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Box, Button, FormHelperText, FormControl, FormLabel, Heading, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useToast, useDisclosure, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deletePersonRecord, exportPeopleCsv, getSessionAdStatus, getPeople, hasValidSessionAdCredentials, importFromAd, searchAd, setSessionAdCredentials } from "../api/rubis";
const STATUS_OPTIONS = [
    { label: "Tous", value: "all" },
    { label: "Actif", value: "active" },
    { label: "Désactivé", value: "disabled" },
    { label: "Inconnu", value: "unknown" }
];
export function PeopleDirectoryPage({ campaignId }) {
    const toast = useToast();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [passiManagerFilter, setPassiManagerFilter] = useState("all");
    const [passiValiditySort, setPassiValiditySort] = useState("none");
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [adMode, setAdMode] = useState("auto");
    const [adIdentifiersRaw, setAdIdentifiersRaw] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [deletingPersonId, setDeletingPersonId] = useState(null);
    const [adLogin, setAdLogin] = useState("");
    const [adPassword, setAdPassword] = useState("");
    const [pendingAdImport, setPendingAdImport] = useState(false);
    const [adSessionRemainingSeconds, setAdSessionRemainingSeconds] = useState(0);
    const [resolvedIdentifiersForImport, setResolvedIdentifiersForImport] = useState([]);
    const [ambiguousMatches, setAmbiguousMatches] = useState([]);
    const { isOpen: isAdAuthOpen, onOpen: openAdAuth, onClose: closeAdAuth } = useDisclosure();
    const { isOpen: isAdChoiceOpen, onOpen: openAdChoice, onClose: closeAdChoice } = useDisclosure();
    useEffect(() => {
        const timer = setInterval(() => {
            const status = getSessionAdStatus();
            setAdSessionRemainingSeconds(status.remainingSeconds);
        }, 1000);
        const init = getSessionAdStatus();
        setAdSessionRemainingSeconds(init.remainingSeconds);
        return () => clearInterval(timer);
    }, []);
    async function refreshPeople() {
        setIsLoading(true);
        try {
            const response = await getPeople({
                q: query.trim() || undefined,
                campaignId: campaignId || undefined,
                status: status === "all" ? undefined : status,
                includeDeleted
            });
            setItems(response.items);
        }
        catch (error) {
            toast({ status: "error", title: "Chargement annuaire", description: String(error) });
        }
        finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        void refreshPeople();
    }, [campaignId]);
    const adIdentifiers = useMemo(() => adIdentifiersRaw
        .split(/[\n,;]/g)
        .map((value) => value.trim())
        .filter(Boolean), [adIdentifiersRaw]);
    const filteredItems = useMemo(() => {
        const next = passiManagerFilter === "all"
            ? [...items]
            : items.filter((person) => {
                const isManager = Boolean(person.isAuditManager);
                return passiManagerFilter === "yes" ? isManager : !isManager;
            });
        if (passiValiditySort === "expiring_asc") {
            next.sort((a, b) => {
                const aDate = a.passiAttestationValidUntil
                    ? new Date(`${a.passiAttestationValidUntil}T00:00:00`).getTime()
                    : Number.POSITIVE_INFINITY;
                const bDate = b.passiAttestationValidUntil
                    ? new Date(`${b.passiAttestationValidUntil}T00:00:00`).getTime()
                    : Number.POSITIVE_INFINITY;
                if (aDate === bDate) {
                    return b.updatedAt.localeCompare(a.updatedAt);
                }
                return aDate - bDate;
            });
        }
        return next;
    }, [items, passiManagerFilter, passiValiditySort]);
    function renderPassiValidity(person) {
        if (!person.passiAttestationValidUntil) {
            return _jsx(Text, { as: "span", color: "gray.500", children: "-" });
        }
        const validityDate = new Date(`${person.passiAttestationValidUntil}T00:00:00`);
        const today = new Date();
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const msDiff = validityDate.getTime() - todayOnly.getTime();
        const daysDiff = Math.floor(msDiff / 86400000);
        let colorScheme = "green";
        let label = "Valide";
        if (daysDiff < 0) {
            colorScheme = "red";
            label = "Expiré";
        }
        else if (daysDiff <= 30) {
            colorScheme = "orange";
            label = "Expire bientôt";
        }
        return (_jsxs(HStack, { spacing: 2, children: [_jsx(Text, { as: "span", children: validityDate.toLocaleDateString("fr-FR") }), _jsx(Badge, { colorScheme: colorScheme, children: label })] }));
    }
    async function handleSearch() {
        await refreshPeople();
    }
    async function handleExportCsv() {
        setIsExporting(true);
        try {
            const blob = await exportPeopleCsv({
                q: query.trim() || undefined,
                campaignId: campaignId || undefined,
                status: status === "all" ? undefined : status,
                includeDeleted
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `people-directory-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        }
        catch (error) {
            toast({ status: "error", title: "Export CSV", description: String(error) });
        }
        finally {
            setIsExporting(false);
        }
    }
    async function handleDeletePerson(person) {
        const label = person.displayName || person.mail || person.id;
        if (!window.confirm(`Supprimer '${label}' de l'annuaire ?`)) {
            return;
        }
        setDeletingPersonId(person.id);
        try {
            await deletePersonRecord(person.id);
            toast({ status: "success", title: "Personne supprimée" });
            await refreshPeople();
        }
        catch (error) {
            toast({ status: "error", title: "Suppression", description: String(error) });
        }
        finally {
            setDeletingPersonId(null);
        }
    }
    function getCandidateIdentifier(candidate) {
        return (candidate.userPrincipalName || candidate.mail || candidate.samAccountName || "").trim();
    }
    function getCandidateLabel(candidate) {
        const primary = candidate.displayName || candidate.mail || candidate.userPrincipalName || candidate.samAccountName || "Utilisateur";
        const secondary = [candidate.mail, candidate.userPrincipalName, candidate.samAccountName]
            .filter(Boolean)
            .join(" | ");
        return secondary ? `${primary} — ${secondary}` : primary;
    }
    function rankCandidateForQuery(query, candidate) {
        const q = query.trim().toLowerCase();
        const mail = (candidate.mail || "").trim().toLowerCase();
        const upn = (candidate.userPrincipalName || "").trim().toLowerCase();
        const sam = (candidate.samAccountName || "").trim().toLowerCase();
        const display = (candidate.displayName || "").trim().toLowerCase();
        if (mail === q || upn === q || sam === q)
            return 0;
        if (mail.startsWith(q) || upn.startsWith(q) || sam.startsWith(q))
            return 1;
        if (display.includes(q))
            return 2;
        return 3;
    }
    async function resolveIdentifiersForImport() {
        const resolved = [];
        const ambiguous = [];
        for (const identifier of adIdentifiers) {
            const result = await searchAd({ q: identifier, mode: adMode });
            if (result.count === 0) {
                throw new Error(`Aucun résultat AD pour '${identifier}'`);
            }
            if (result.count === 1) {
                const candidateIdentifier = getCandidateIdentifier(result.items[0]);
                if (!candidateIdentifier) {
                    throw new Error(`Résultat AD invalide pour '${identifier}'`);
                }
                resolved.push(candidateIdentifier);
                continue;
            }
            const selectableCandidates = result.items
                .filter((candidate) => Boolean(getCandidateIdentifier(candidate)))
                .sort((a, b) => rankCandidateForQuery(identifier, a) - rankCandidateForQuery(identifier, b));
            if (selectableCandidates.length === 0) {
                throw new Error(`Résultats AD non exploitables pour '${identifier}'`);
            }
            ambiguous.push({
                query: identifier,
                candidates: selectableCandidates,
                selectedIndex: 0
            });
        }
        if (ambiguous.length > 0) {
            setResolvedIdentifiersForImport(resolved);
            setAmbiguousMatches(ambiguous);
            openAdChoice();
            return null;
        }
        return resolved;
    }
    async function performAdImport(identifiers) {
        setIsImporting(true);
        try {
            const result = await importFromAd({
                campaignId: campaignId || undefined,
                mode: "auto",
                identifiers
            });
            const firstError = result.job.errors && result.job.errors.length > 0 ? result.job.errors[0] : "";
            toast({
                status: result.summary.failed > 0 ? "warning" : "success",
                title: "Import AD terminé",
                description: `${result.summary.success} succès / ${result.summary.failed} échec(s)${firstError ? ` — ${firstError}` : ""}`
            });
            setAdIdentifiersRaw("");
            await refreshPeople();
        }
        catch (error) {
            toast({ status: "error", title: "Import AD", description: String(error) });
        }
        finally {
            setIsImporting(false);
        }
    }
    async function startAdImportFlow() {
        if (adIdentifiers.length === 0) {
            toast({ status: "warning", title: "Importer depuis AD", description: "Ajoutez au moins un identifiant." });
            return;
        }
        if (!hasValidSessionAdCredentials()) {
            setPendingAdImport(true);
            openAdAuth();
            return;
        }
        try {
            const identifiers = await resolveIdentifiersForImport();
            if (!identifiers) {
                return;
            }
            await performAdImport(identifiers);
        }
        catch (error) {
            toast({ status: "error", title: "Recherche AD", description: String(error) });
        }
    }
    async function handleImportFromAd() {
        await startAdImportFlow();
    }
    async function handleConfirmAmbiguousSelection() {
        const selectedIdentifiers = [...resolvedIdentifiersForImport];
        for (const item of ambiguousMatches) {
            const candidate = item.candidates[item.selectedIndex];
            const identifier = getCandidateIdentifier(candidate);
            if (!identifier) {
                toast({ status: "error", title: "Sélection AD", description: `Aucun identifiant exploitable pour '${item.query}'` });
                return;
            }
            selectedIdentifiers.push(identifier);
        }
        closeAdChoice();
        setAmbiguousMatches([]);
        setResolvedIdentifiersForImport([]);
        await performAdImport(selectedIdentifiers);
    }
    function handleAmbiguousChoiceChange(index, selectedIndex) {
        setAmbiguousMatches((previous) => previous.map((item, currentIndex) => currentIndex === index
            ? {
                ...item,
                selectedIndex
            }
            : item));
    }
    async function handleConfirmAdCredentials() {
        if (!adLogin.trim() || !adPassword) {
            toast({ status: "warning", title: "Identifiants AD requis", description: "Saisissez login et mot de passe AD." });
            return;
        }
        setSessionAdCredentials({ login: adLogin.trim(), password: adPassword });
        const status = getSessionAdStatus();
        setAdSessionRemainingSeconds(status.remainingSeconds);
        setAdPassword("");
        closeAdAuth();
        if (pendingAdImport) {
            setPendingAdImport(false);
            await startAdImportFlow();
        }
    }
    return (_jsxs(Stack, { spacing: 6, children: [_jsx(Heading, { size: "md", children: "People Directory" }), _jsx(Text, { color: "gray.600", children: "Annuaire local synchronisable avec Active Directory." }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Recherche" }), _jsx(Input, { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Nom, email, login..." })] }), _jsxs(FormControl, { maxW: "220px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Statut" }), _jsx(Select, { value: status, onChange: (event) => setStatus(event.target.value), children: STATUS_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs(FormControl, { maxW: "220px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Supprim\u00E9s" }), _jsxs(Select, { value: includeDeleted ? "1" : "0", onChange: (event) => setIncludeDeleted(event.target.value === "1"), children: [_jsx("option", { value: "0", children: "Exclus" }), _jsx("option", { value: "1", children: "Inclus" })] })] }), _jsxs(FormControl, { maxW: "260px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Responsable PASSI" }), _jsxs(Select, { value: passiManagerFilter, onChange: (event) => setPassiManagerFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Tous" }), _jsx("option", { value: "yes", children: "Oui" }), _jsx("option", { value: "no", children: "Non" })] })] }), _jsxs(FormControl, { maxW: "280px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Tri validit\u00E9 PASSI" }), _jsxs(Select, { value: passiValiditySort, onChange: (event) => setPassiValiditySort(event.target.value), children: [_jsx("option", { value: "none", children: "Aucun" }), _jsx("option", { value: "expiring_asc", children: "Expiration proche d'abord" })] })] }), _jsx(Button, { onClick: () => void handleSearch(), isLoading: isLoading, children: "Filtrer" }), _jsx(Button, { onClick: () => void handleExportCsv(), isLoading: isExporting, children: "Export CSV" })] }), _jsx(Box, { overflowX: "auto", children: _jsxs(Table, { size: "sm", children: [_jsx(Thead, { children: _jsxs(Tr, { children: [_jsx(Th, { children: "Nom" }), _jsx(Th, { children: "Email" }), _jsx(Th, { children: "Statut" }), _jsx(Th, { children: "Resp. audit PASSI" }), _jsx(Th, { children: "Port\u00E9es PASSI" }), _jsx(Th, { children: "Validit\u00E9 attestation" }), _jsx(Th, { children: "D\u00E9partement" }), _jsx(Th, { children: "Soci\u00E9t\u00E9" }), _jsx(Th, { children: "Mis \u00E0 jour" }), _jsx(Th, { children: "Actions" })] }) }), _jsxs(Tbody, { children: [filteredItems.map((person) => (_jsxs(Tr, { children: [_jsx(Td, { children: person.displayName || "-" }), _jsx(Td, { children: person.mail || "-" }), _jsx(Td, { children: _jsx(Badge, { colorScheme: person.status === "active" ? "green" : person.status === "disabled" ? "orange" : "gray", children: person.status || "unknown" }) }), _jsx(Td, { children: _jsx(Badge, { colorScheme: person.isAuditManager ? "purple" : "gray", children: person.isAuditManager ? "Oui" : "Non" }) }), _jsx(Td, { children: person.passiScopes && person.passiScopes.length > 0 ? person.passiScopes.join(", ") : "-" }), _jsx(Td, { children: renderPassiValidity(person) }), _jsx(Td, { children: person.department || "-" }), _jsx(Td, { children: person.company || "-" }), _jsx(Td, { children: new Date(person.updatedAt).toLocaleString("fr-FR") }), _jsx(Td, { children: _jsxs(HStack, { spacing: 2, children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => navigate(`/people/${person.id}`), children: "Ouvrir" }), _jsx(Button, { size: "sm", variant: "outline", colorScheme: "red", isLoading: deletingPersonId === person.id, onClick: () => void handleDeletePerson(person), children: "Supprimer" })] }) })] }, person.id))), !isLoading && filteredItems.length === 0 ? (_jsx(Tr, { children: _jsx(Td, { colSpan: 10, children: _jsx(Text, { fontSize: "sm", color: "gray.500", children: "Aucun r\u00E9sultat." }) }) })) : null] })] }) })] }) }), _jsx(Box, { bg: "white", p: 6, borderWidth: "1px", borderColor: "gray.200", rounded: "lg", children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsx(Text, { fontSize: "sm", fontWeight: "semibold", color: "gray.700", children: "Import depuis AD" }), _jsxs(HStack, { children: [_jsx(Badge, { colorScheme: adSessionRemainingSeconds > 0 ? "green" : "orange", children: adSessionRemainingSeconds > 0 ? "Session AD active" : "Session AD expirée" }), _jsx(Text, { fontSize: "xs", color: "gray.500", children: adSessionRemainingSeconds > 0
                                        ? `Expiration dans ${Math.floor(adSessionRemainingSeconds / 60)}:${String(adSessionRemainingSeconds % 60).padStart(2, "0")}`
                                        : "Saisie demandée au prochain import AD" })] }), _jsxs(HStack, { align: "end", spacing: 3, children: [_jsxs(FormControl, { maxW: "220px", children: [_jsx(FormLabel, { fontSize: "sm", children: "Mode de recherche" }), _jsxs(Select, { value: adMode, onChange: (event) => setAdMode(event.target.value), children: [_jsx("option", { value: "auto", children: "auto" }), _jsx("option", { value: "email", children: "email" }), _jsx("option", { value: "login", children: "login" }), _jsx("option", { value: "upn", children: "upn" }), _jsx("option", { value: "name", children: "name" })] })] }), _jsxs(FormControl, { children: [_jsx(FormLabel, { fontSize: "sm", children: "Identifiants (s\u00E9par\u00E9s par virgule ou ligne)" }), _jsx(Input, { value: adIdentifiersRaw, onChange: (event) => setAdIdentifiersRaw(event.target.value), placeholder: "john.doe, jane.doe@domain.tld" })] }), _jsx(Button, { onClick: () => void handleImportFromAd(), isLoading: isImporting, children: "Importer AD" })] })] }) }), _jsxs(Modal, { isOpen: isAdAuthOpen, onClose: closeAdAuth, isCentered: true, children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "Connexion Active Directory" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Login AD" }), _jsx(Input, { value: adLogin, onChange: (event) => setAdLogin(event.target.value), placeholder: "prenom.nom@domaine.local", autoComplete: "username" })] }), _jsxs(FormControl, { isRequired: true, children: [_jsx(FormLabel, { fontSize: "sm", children: "Mot de passe AD" }), _jsx(Input, { type: "password", value: adPassword, onChange: (event) => setAdPassword(event.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password" }), _jsx(FormHelperText, { children: "Session AD active 5 minutes apr\u00E8s la derni\u00E8re action d'import AD." })] })] }) }), _jsxs(ModalFooter, { children: [_jsx(Button, { variant: "ghost", mr: 3, onClick: closeAdAuth, children: "Annuler" }), _jsx(Button, { bg: "#CF022B", color: "white", _hover: { bg: "#B60226" }, onClick: () => void handleConfirmAdCredentials(), children: "Continuer" })] })] })] }), _jsxs(Modal, { isOpen: isAdChoiceOpen, onClose: closeAdChoice, isCentered: true, size: "xl", children: [_jsx(ModalOverlay, {}), _jsxs(ModalContent, { children: [_jsx(ModalHeader, { children: "S\u00E9lection des personnes AD" }), _jsx(ModalCloseButton, {}), _jsx(ModalBody, { children: _jsxs(VStack, { spacing: 4, align: "stretch", children: [_jsx(Text, { fontSize: "sm", color: "gray.600", children: "Plusieurs correspondances AD ont \u00E9t\u00E9 trouv\u00E9es. S\u00E9lectionnez la bonne entr\u00E9e pour chaque recherche." }), ambiguousMatches.map((item, index) => (_jsxs(FormControl, { children: [_jsxs(FormLabel, { fontSize: "sm", children: ["Recherche: ", item.query] }), _jsx(Select, { value: String(item.selectedIndex), onChange: (event) => handleAmbiguousChoiceChange(index, Number(event.target.value)), children: item.candidates.map((candidate, candidateIndex) => (_jsx("option", { value: candidateIndex, children: getCandidateLabel(candidate) }, `${item.query}-${candidateIndex}`))) })] }, `${item.query}-${index}`)))] }) }), _jsxs(ModalFooter, { children: [_jsx(Button, { variant: "ghost", mr: 3, onClick: closeAdChoice, children: "Annuler" }), _jsx(Button, { bg: "#CF022B", color: "white", _hover: { bg: "#B60226" }, onClick: () => void handleConfirmAmbiguousSelection(), children: "Importer la s\u00E9lection" })] })] })] })] }));
}
