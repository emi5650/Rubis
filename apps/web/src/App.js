import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
const API_URL = "http://localhost:4000";
export function App() {
    const [viewMode, setViewMode] = useState("workspace");
    const [campaignId, setCampaignId] = useState("");
    const [criterionId, setCriterionId] = useState("");
    const [language, setLanguage] = useState("fr");
    const [ollamaModel, setOllamaModel] = useState("mistral");
    const [ollamaModels, setOllamaModels] = useState(["mistral", "gemma3:4b"]);
    const [generated, setGenerated] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [interviewees, setInterviewees] = useState([]);
    const [themeSuggestion, setThemeSuggestion] = useState("");
    const [suggestedDocuments, setSuggestedDocuments] = useState([]);
    const [suggestedCriteria, setSuggestedCriteria] = useState([]);
    const [latestInterviewNoteId, setLatestInterviewNoteId] = useState("");
    const [criterionScore, setCriterionScore] = useState("");
    const [reports, setReports] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [logPeriod, setLogPeriod] = useState("all");
    const [logActionFilter, setLogActionFilter] = useState("all");
    const [knownActions, setKnownActions] = useState([]);
    const [dashboardKpis, setDashboardKpis] = useState({
        documentsCount: 0,
        intervieweesCount: 0,
        interviewNotesCount: 0,
        pendingDocumentsCount: 0,
        reportsCount: 0,
        questionsCount: 0
    });
    const [matrixDetails, setMatrixDetails] = useState([]);
    const [conformityMatrixSummary, setConformityMatrixSummary] = useState("");
    const [selectedReportTitle, setSelectedReportTitle] = useState("");
    const [selectedReportContent, setSelectedReportContent] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [status, setStatus] = useState("");
    const [generatedQuestionsFromAi, setGeneratedQuestionsFromAi] = useState([]);
    const [referentialFile, setReferentialFile] = useState(null);
    const [uploadingReferential, setUploadingReferential] = useState(false);
    function getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return "Erreur inconnue";
    }
    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const payload = isJson ? await response.json() : null;
        if (!response.ok) {
            const backendMessage = payload && typeof payload === "object" ? String(payload.message || "") : "";
            throw new Error(backendMessage || `HTTP ${response.status}`);
        }
        return payload;
    }
    function buildAuditLogUrl(activePeriod, activeAction) {
        const actionQuery = encodeURIComponent(activeAction || "all");
        return `${API_URL}/audit-log/${campaignId}?period=${activePeriod}&action=${actionQuery}`;
    }
    function syncKnownActions(logItems) {
        const incoming = Array.from(new Set(logItems.map((item) => item.action).filter((value) => value.length > 0)));
        setKnownActions((previous) => Array.from(new Set([...previous, ...incoming])).sort());
    }
    useEffect(() => {
        if (!campaignId) {
            setDocuments([]);
            setInterviewees([]);
            setReports([]);
            setAuditLogs([]);
            setKnownActions([]);
            setConformityMatrixSummary("");
            return;
        }
        // Load current Ollama model on campaign change
        async function loadConfig() {
            try {
                const config = await requestJson(`${API_URL}/config`);
                setOllamaModel(config.ollamaModel);
            }
            catch (error) {
                console.error("Failed to load config:", error);
            }
        }
        async function loadCampaignData() {
            try {
                setErrorMessage("");
                const [documentData, intervieweeData, reportData, logData] = await Promise.all([
                    requestJson(`${API_URL}/documents/${campaignId}`),
                    requestJson(`${API_URL}/interviewees/${campaignId}`),
                    requestJson(`${API_URL}/audit-reports/${campaignId}`),
                    requestJson(buildAuditLogUrl(logPeriod, logActionFilter))
                ]);
                setDocuments(documentData || []);
                setInterviewees(intervieweeData || []);
                setReports(reportData || []);
                setAuditLogs(logData || []);
                syncKnownActions(logData || []);
            }
            catch (error) {
                setErrorMessage(`Chargement campagne impossible: ${getErrorMessage(error)}`);
            }
        }
        void loadConfig();
        void loadCampaignData();
    }, [campaignId, logPeriod, logActionFilter]);
    async function createCampaign(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            setErrorMessage("");
            const payload = {
                name: String(formData.get("name") || ""),
                framework: String(formData.get("framework") || "PASSI"),
                language
            };
            const data = await requestJson(`${API_URL}/campaigns`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            setCampaignId(data.id || "");
            setStatus("Campagne créée");
        }
        catch (error) {
            setErrorMessage(`Création campagne impossible: ${getErrorMessage(error)}`);
        }
    }
    async function createCriterion(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = {
            campaignId,
            code: String(formData.get("code") || ""),
            title: String(formData.get("title") || ""),
            theme: String(formData.get("theme") || "")
        };
        try {
            setErrorMessage("");
            const data = await requestJson(`${API_URL}/criteria`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            setCriterionId(data.id || "");
            setStatus("Critère créé");
        }
        catch (error) {
            setErrorMessage(`Création critère impossible: ${getErrorMessage(error)}`);
        }
    }
    async function generateQuestions(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        try {
            setErrorMessage("");
            const data = await requestJson(`${API_URL}/questions/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    criterionId,
                    audienceRole: String(formData.get("audienceRole") || "RSSI"),
                    language
                })
            });
            setGenerated(data.questions || []);
            setStatus("Questions générées");
        }
        catch (error) {
            setErrorMessage(`Génération de questions impossible: ${getErrorMessage(error)}`);
        }
    }
    async function switchOllamaModel(modelName) {
        try {
            setErrorMessage("");
            await requestJson(`${API_URL}/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ollamaModel: modelName })
            });
            setOllamaModel(modelName);
            setStatus(`Modèle Ollama changé: ${modelName}`);
        }
        catch (error) {
            setErrorMessage(`Impossible de changer le modèle: ${getErrorMessage(error)}`);
        }
    }
    async function generateQuestionsFromReferential(event) {
        event.preventDefault();
        if (!referentialFile || !criterionId) {
            setErrorMessage("Fichier référentiel et critère requis");
            return;
        }
        const formData = new FormData();
        formData.append("file", referentialFile);
        formData.append("campaignId", campaignId);
        formData.append("criterionCode", "AI-GEN"); // Placeholder, could be from form
        formData.append("criterionTitle", "AI Generated Questions");
        formData.append("language", language);
        formData.append("count", String(event.currentTarget.elements.namedItem("count")?.value || "5"));
        try {
            setErrorMessage("");
            setUploadingReferential(true);
            const data = await requestJson(`${API_URL}/generate-questions-from-referential`, {
                method: "POST",
                body: formData
            });
            setGeneratedQuestionsFromAi(data.questions || []);
            setStatus(`${data.questions?.length || 0} questions générées à partir du référentiel`);
        }
        catch (error) {
            setErrorMessage(`Génération via IA impossible: ${getErrorMessage(error)}`);
        }
        finally {
            setUploadingReferential(false);
        }
    }
    async function addDocument(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = {
            campaignId,
            name: String(formData.get("name") || ""),
            theme: String(formData.get("theme") || ""),
            version: String(formData.get("version") || "1.0"),
            date: String(formData.get("date") || ""),
            sensitivity: String(formData.get("sensitivity") || "Interne"),
            summary: String(formData.get("summary") || "")
        };
        const response = await fetch(`${API_URL}/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        setDocuments((previous) => [{ id: data.id, name: data.name, theme: data.theme, sensitivity: data.sensitivity }, ...previous]);
        setStatus("Document référencé");
    }
    async function saveMetricScale(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/metric-scales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                confidentiality: String(formData.get("confidentiality") || "1-5"),
                integrity: String(formData.get("integrity") || "1-5"),
                availability: String(formData.get("availability") || "1-5"),
                evidence: String(formData.get("evidence") || "0-3")
            })
        });
        setStatus("Échelles de métriques enregistrées");
    }
    async function saveConvention(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/conventions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                auditedOrganization: String(formData.get("auditedOrganization") || ""),
                sponsorOrganization: String(formData.get("sponsorOrganization") || ""),
                auditType: String(formData.get("auditType") || "interne"),
                perimeter: String(formData.get("perimeter") || ""),
                constraints: String(formData.get("constraints") || ""),
                mode: String(formData.get("mode") || "hybride")
            })
        });
        setStatus("Convention d'audit enregistrée");
    }
    async function saveScopingNote(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/scoping-notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                objectives: String(formData.get("objectives") || ""),
                assumptions: String(formData.get("assumptions") || ""),
                exclusions: String(formData.get("exclusions") || ""),
                stakeholders: String(formData.get("stakeholders") || ""),
                planningConstraints: String(formData.get("planningConstraints") || "")
            })
        });
        setStatus("Note de cadrage enregistrée");
    }
    async function addInterviewee(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const response = await fetch(`${API_URL}/interviewees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                fullName: String(formData.get("fullName") || ""),
                role: String(formData.get("role") || ""),
                email: String(formData.get("email") || ""),
                entity: String(formData.get("entity") || "")
            })
        });
        const data = await response.json();
        setInterviewees((previous) => [{ id: data.id, fullName: data.fullName, role: data.role }, ...previous]);
        setStatus("Fiche interviewé enregistrée");
    }
    async function saveDocumentReview(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/document-reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                documentId: String(formData.get("documentId") || ""),
                maturityLevel: String(formData.get("maturityLevel") || ""),
                complianceLevel: String(formData.get("complianceLevel") || ""),
                pointsToInvestigate: String(formData.get("pointsToInvestigate") || ""),
                preliminaryVerdict: String(formData.get("preliminaryVerdict") || "")
            })
        });
        setStatus("Analyse documentaire enregistrée");
    }
    async function saveAuditPlan(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/audit-plans`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                objectives: String(formData.get("objectives") || ""),
                scope: String(formData.get("scope") || ""),
                methods: String(formData.get("methods") || ""),
                samplingStrategy: String(formData.get("samplingStrategy") || ""),
                logistics: String(formData.get("logistics") || ""),
                communicationRules: String(formData.get("communicationRules") || "")
            })
        });
        setStatus("Plan d'audit enregistré");
    }
    async function createInterviewSlot(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const participantIds = String(formData.get("participantIds") || "")
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        const associatedDocumentIds = String(formData.get("associatedDocumentIds") || "")
            .split(",")
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        await fetch(`${API_URL}/interview-slots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                title: String(formData.get("title") || ""),
                startAt: String(formData.get("startAt") || ""),
                endAt: String(formData.get("endAt") || ""),
                mode: String(formData.get("mode") || "hybride"),
                room: String(formData.get("room") || ""),
                teamsLink: String(formData.get("teamsLink") || ""),
                theme: String(formData.get("theme") || ""),
                criterionCode: String(formData.get("criterionCode") || ""),
                participantIds,
                associatedDocumentIds,
                outlookSyncEnabled: formData.get("outlookSyncEnabled") === "on",
                outlookEventId: String(formData.get("outlookEventId") || "")
            })
        });
        setStatus("Créneau d'entretien enregistré");
    }
    async function loadThemeSuggestions(event) {
        event.preventDefault();
        const response = await fetch(`${API_URL}/interview-slots/suggestions/${campaignId}/${encodeURIComponent(themeSuggestion)}`);
        const data = await response.json();
        setSuggestedDocuments((data.documents || []).map((document) => ({ id: document.id, name: document.name })));
        setSuggestedCriteria((data.criteria || []).map((criterion) => ({
            id: criterion.id,
            code: criterion.code,
            title: criterion.title
        })));
        setStatus("Suggestions de documents chargées");
    }
    async function startInterviewNote(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const pauseStart = String(formData.get("pauseStart") || "");
        const pauseEnd = String(formData.get("pauseEnd") || "");
        const pauses = pauseStart && pauseEnd ? [{ startAt: pauseStart, endAt: pauseEnd }] : [];
        const response = await fetch(`${API_URL}/interview-notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                slotId: String(formData.get("slotId") || ""),
                startedAt: String(formData.get("startedAt") || ""),
                endedAt: String(formData.get("endedAt") || ""),
                pauses,
                freeNotes: String(formData.get("freeNotes") || "")
            })
        });
        const data = await response.json();
        setLatestInterviewNoteId(data.id || "");
        setStatus("Note d'entretien enregistrée");
    }
    async function addAttendance(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const noteId = String(formData.get("noteId") || latestInterviewNoteId);
        await fetch(`${API_URL}/interview-notes/${noteId}/attendances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                intervieweeId: String(formData.get("intervieweeId") || ""),
                intervieweeName: String(formData.get("intervieweeName") || ""),
                planned: formData.get("planned") === "on",
                present: formData.get("present") === "on"
            })
        });
        setStatus("Présence enregistrée");
    }
    async function addPendingDocument(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/pending-documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                interviewNoteId: String(formData.get("interviewNoteId") || latestInterviewNoteId),
                name: String(formData.get("name") || ""),
                requestedFrom: String(formData.get("requestedFrom") || ""),
                dueDate: String(formData.get("dueDate") || "")
            })
        });
        setStatus("Document à transmettre enregistré");
    }
    async function markPendingDocumentReceived(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const pendingDocumentId = String(formData.get("pendingDocumentId") || "");
        await fetch(`${API_URL}/pending-documents/${pendingDocumentId}/transmitted`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                transmittedDate: String(formData.get("transmittedDate") || "")
            })
        });
        setStatus("Transmission du document mise à jour");
    }
    async function addDocumentReference(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const noteId = String(formData.get("noteId") || latestInterviewNoteId);
        await fetch(`${API_URL}/interview-notes/${noteId}/document-references`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                documentId: String(formData.get("documentId") || ""),
                pendingDocumentId: String(formData.get("pendingDocumentId") || ""),
                reference: String(formData.get("reference") || "")
            })
        });
        setStatus("Référence documentaire ajoutée dans la note");
    }
    async function saveInterviewAnswer(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await fetch(`${API_URL}/interview-answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                campaignId,
                interviewNoteId: String(formData.get("interviewNoteId") || latestInterviewNoteId),
                questionId: String(formData.get("questionId") || ""),
                conformityScore: Number(formData.get("conformityScore") || 0),
                comment: String(formData.get("comment") || "")
            })
        });
        setStatus("Score de conformité enregistré");
    }
    async function loadCriterionScore(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const criterionIdToScore = String(formData.get("criterionId") || "");
        const response = await fetch(`${API_URL}/criteria-score/${campaignId}/${criterionIdToScore}`);
        const data = await response.json();
        const average = data.weightedAverage === null ? "N/A" : Number(data.weightedAverage).toFixed(2);
        setCriterionScore(`Questions notées: ${data.answeredQuestions} / Score pondéré: ${average}`);
        setStatus("Conformité du critère calculée");
    }
    async function generateAuditReport() {
        try {
            setErrorMessage("");
            const data = await requestJson(`${API_URL}/audit-reports/generate/${campaignId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}"
            });
            setReports((previous) => [
                { id: data.id, title: data.title, generatedAt: data.generatedAt, version: data.version },
                ...previous
            ]);
            setSelectedReportTitle(data.title || "Rapport d'audit");
            setSelectedReportContent(data.content || "");
            setStatus("Rapport d'audit généré");
        }
        catch (error) {
            setErrorMessage(`Génération du rapport impossible: ${getErrorMessage(error)}`);
        }
    }
    async function loadReports() {
        try {
            setErrorMessage("");
            const data = await requestJson(`${API_URL}/audit-reports/${campaignId}`);
            setReports(data || []);
            setStatus("Liste des rapports chargée");
        }
        catch (error) {
            setErrorMessage(`Chargement des rapports impossible: ${getErrorMessage(error)}`);
        }
    }
    async function loadAuditLogs() {
        try {
            setErrorMessage("");
            const data = await requestJson(buildAuditLogUrl(logPeriod, logActionFilter));
            setAuditLogs(data || []);
            syncKnownActions(data || []);
            setStatus("Journal d'actions chargé");
        }
        catch (error) {
            setErrorMessage(`Chargement du journal impossible: ${getErrorMessage(error)}`);
        }
    }
    async function loadConformityMatrix() {
        try {
            setErrorMessage("");
            const data = await requestJson(`${API_URL}/conformity-matrix/${campaignId}`);
            const overall = data.overallAverage === null ? "N/A" : Number(data.overallAverage).toFixed(2);
            const top3 = (data.matrix || [])
                .slice(0, 3)
                .map((item) => `${item.code}:${item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2)}`)
                .join(" | ");
            setMatrixDetails(data.matrix || []);
            setConformityMatrixSummary(`Critères: ${data.criteriaCount} | Moyenne globale: ${overall}${top3 ? ` | Aperçu: ${top3}` : ""}`);
            setStatus("Matrice de conformité chargée");
        }
        catch (error) {
            setErrorMessage(`Chargement matrice impossible: ${getErrorMessage(error)}`);
        }
    }
    async function loadDashboardData() {
        if (!campaignId) {
            setErrorMessage("Sélectionne une campagne avant de charger le dashboard");
            return;
        }
        try {
            setErrorMessage("");
            const [documentsData, intervieweesData, interviewNotesData, pendingDocumentsData, reportsData, questionsData, logsData, matrixData] = await Promise.all([
                requestJson(`${API_URL}/documents/${campaignId}`),
                requestJson(`${API_URL}/interviewees/${campaignId}`),
                requestJson(`${API_URL}/interview-notes/${campaignId}`),
                requestJson(`${API_URL}/pending-documents/${campaignId}`),
                requestJson(`${API_URL}/audit-reports/${campaignId}`),
                requestJson(`${API_URL}/questions/${campaignId}`),
                requestJson(buildAuditLogUrl(logPeriod, logActionFilter)),
                requestJson(`${API_URL}/conformity-matrix/${campaignId}`)
            ]);
            const pendingOpen = (pendingDocumentsData || []).filter((item) => item.status === "requested").length;
            const overall = matrixData.overallAverage === null ? "N/A" : Number(matrixData.overallAverage).toFixed(2);
            setDashboardKpis({
                documentsCount: (documentsData || []).length,
                intervieweesCount: (intervieweesData || []).length,
                interviewNotesCount: (interviewNotesData || []).length,
                pendingDocumentsCount: pendingOpen,
                reportsCount: (reportsData || []).length,
                questionsCount: (questionsData || []).length
            });
            setAuditLogs(logsData || []);
            syncKnownActions(logsData || []);
            setMatrixDetails(matrixData.matrix || []);
            setConformityMatrixSummary(`Critères: ${matrixData.criteriaCount} | Moyenne globale: ${overall}`);
            setStatus("Dashboard chargé");
        }
        catch (error) {
            setErrorMessage(`Chargement dashboard impossible: ${getErrorMessage(error)}`);
        }
    }
    async function openReport(reportId) {
        try {
            setErrorMessage("");
            const data = await requestJson(`${API_URL}/audit-report/${reportId}`);
            setSelectedReportTitle(data.title || "Rapport d'audit");
            setSelectedReportContent(data.content || "");
            setStatus("Rapport ouvert");
        }
        catch (error) {
            setErrorMessage(`Ouverture du rapport impossible: ${getErrorMessage(error)}`);
        }
    }
    function exportReportMarkdown() {
        if (!selectedReportContent.trim()) {
            setErrorMessage("Aucun rapport à exporter");
            return;
        }
        const safeTitle = (selectedReportTitle || "rapport-audit")
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        const blob = new Blob([selectedReportContent], { type: "text/markdown;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `${safeTitle || "rapport-audit"}.md`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(objectUrl);
        setStatus("Rapport exporté en .md");
    }
    function escapeCsvValue(value) {
        const normalized = value.replace(/\r?\n|\r/g, " ");
        const escaped = normalized.replace(/"/g, '""');
        return `"${escaped}"`;
    }
    function exportFilteredLogsCsv() {
        if (auditLogs.length === 0) {
            setErrorMessage("Aucun log à exporter pour le filtre actif");
            return;
        }
        const header = ["timestamp", "action", "details"];
        const rows = auditLogs.map((item) => [
            escapeCsvValue(item.timestamp),
            escapeCsvValue(item.action),
            escapeCsvValue(item.details)
        ]);
        const csvContent = [header.join(";"), ...rows.map((columns) => columns.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const suffix = `${logPeriod}-${(logActionFilter || "all").replace(/[^a-z0-9-_]+/gi, "-")}`;
        anchor.href = url;
        anchor.download = `audit-log-${suffix}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setStatus("Journal filtré exporté en CSV");
    }
    function exportMatrixCsv() {
        if (matrixDetails.length === 0) {
            setErrorMessage("Aucune matrice à exporter");
            return;
        }
        const lines = [];
        lines.push("Matrice de conformité");
        lines.push(`Campagne,${campaignId}`);
        lines.push(`Résumé,${conformityMatrixSummary}`);
        lines.push("");
        lines.push("Détail par critère");
        lines.push(["Code", "Titre", "Thème", "Score pondéré", "Questions notées", "Questions totales"].map(escapeCsvValue).join(";"));
        matrixDetails.forEach((item) => {
            const scoreLabel = item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2);
            lines.push([
                escapeCsvValue(item.code),
                escapeCsvValue(item.title),
                escapeCsvValue(item.theme),
                escapeCsvValue(scoreLabel),
                escapeCsvValue(item.answeredQuestions.toString()),
                escapeCsvValue(item.totalQuestions.toString())
            ].join(";"));
        });
        const csvContent = lines.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const now = new Date().toISOString().slice(0, 10);
        anchor.href = url;
        anchor.download = `conformity-matrix-${now}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setStatus("Matrice de conformité exportée en CSV");
    }
    async function exportReportDocx(reportId, reportTitle) {
        try {
            setErrorMessage("");
            const response = await fetch(`${API_URL}/audit-report/${reportId}/docx`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            const safeTitle = reportTitle
                .toLowerCase()
                .replace(/[^a-z0-9-_]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "");
            anchor.href = objectUrl;
            anchor.download = `${safeTitle || "rapport-audit"}.docx`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(objectUrl);
            setStatus("Rapport exporté en .docx");
        }
        catch (error) {
            setErrorMessage(`Export DOCX impossible: ${getErrorMessage(error)}`);
        }
    }
    return (_jsxs("main", { className: "page", children: [_jsx("h1", { children: "Rubis - MVP Audit" }), _jsx("p", { children: "Phase 1.1: pr\u00E9paration des entretiens et g\u00E9n\u00E9ration de questions." }), _jsxs("div", { className: "view-switch", children: [_jsx("button", { type: "button", onClick: () => setViewMode("workspace"), children: "Mode Saisie" }), _jsx("button", { type: "button", onClick: () => {
                            setViewMode("dashboard");
                            void loadDashboardData();
                        }, children: "Mode Dashboard" })] }), errorMessage ? _jsx("p", { className: "status-error", children: errorMessage }) : null, viewMode === "dashboard" ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Dashboard campagne" }), _jsxs("p", { children: ["ID campagne: ", campaignId || "-"] }), _jsxs("form", { onSubmit: (event) => {
                                    event.preventDefault();
                                    void loadDashboardData();
                                }, children: [_jsxs("select", { value: logPeriod, onChange: (event) => setLogPeriod(event.target.value), children: [_jsx("option", { value: "7d", children: "Logs 7 jours" }), _jsx("option", { value: "30d", children: "Logs 30 jours" }), _jsx("option", { value: "all", children: "Logs tout" })] }), _jsxs("select", { value: logActionFilter, onChange: (event) => setLogActionFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Actions: toutes" }), knownActions.map((actionName) => (_jsx("option", { value: actionName, children: actionName }, actionName)))] }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Rafra\u00EEchir KPIs" })] }), _jsxs("div", { className: "dashboard-grid", children: [_jsxs("div", { className: "dashboard-kpi", children: [_jsx("strong", { children: "Documents" }), _jsx("span", { children: dashboardKpis.documentsCount })] }), _jsxs("div", { className: "dashboard-kpi", children: [_jsx("strong", { children: "Interview\u00E9s" }), _jsx("span", { children: dashboardKpis.intervieweesCount })] }), _jsxs("div", { className: "dashboard-kpi", children: [_jsx("strong", { children: "Questions" }), _jsx("span", { children: dashboardKpis.questionsCount })] }), _jsxs("div", { className: "dashboard-kpi", children: [_jsx("strong", { children: "Notes entretien" }), _jsx("span", { children: dashboardKpis.interviewNotesCount })] }), _jsxs("div", { className: "dashboard-kpi", children: [_jsx("strong", { children: "Docs en attente" }), _jsx("span", { children: dashboardKpis.pendingDocumentsCount })] }), _jsxs("div", { className: "dashboard-kpi", children: [_jsx("strong", { children: "Rapports" }), _jsx("span", { children: dashboardKpis.reportsCount })] })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Matrice de conformit\u00E9" }), _jsx("p", { children: conformityMatrixSummary || "-" }), _jsx("button", { type: "button", onClick: exportMatrixCsv, disabled: matrixDetails.length === 0, children: "Exporter matrice CSV" }), _jsx("ul", { children: matrixDetails.map((item) => (_jsxs("li", { children: [item.code, " - ", item.title, " (", item.theme, ") : ", item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2), " [", item.answeredQuestions, "/", item.totalQuestions, "]"] }, `${item.code}-${item.title}`))) })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Derni\u00E8res actions" }), _jsx("ul", { children: auditLogs.slice(0, 20).map((logItem) => (_jsxs("li", { children: [logItem.timestamp, " - ", logItem.action, " - ", logItem.details] }, logItem.id))) })] })] })) : null, viewMode === "workspace" ? (_jsxs(_Fragment, { children: [_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Cr\u00E9er une campagne" }), _jsxs("form", { onSubmit: createCampaign, children: [_jsx("input", { name: "name", placeholder: "Nom de campagne", required: true }), _jsxs("select", { name: "framework", required: true, children: [_jsx("option", { value: "", children: "-- S\u00E9lectionner un r\u00E9f\u00E9rentiel --" }), _jsxs("optgroup", { label: "ISO/IEC", children: [_jsx("option", { value: "ISO/IEC 27001", children: "ISO/IEC 27001 - Management de la s\u00E9curit\u00E9 de l'information" }), _jsx("option", { value: "ISO/IEC 27002", children: "ISO/IEC 27002 - Code de bonnes pratiques" }), _jsx("option", { value: "ISO/IEC 27005", children: "ISO/IEC 27005 - Gestion des risques" }), _jsx("option", { value: "ISO 19011", children: "ISO 19011 - Lignes directrices pour l'audit" })] }), _jsxs("optgroup", { label: "France - R\u00E9glementaire", children: [_jsx("option", { value: "PASSI", children: "PASSI - Prestataire d'Audit de la SSI" }), _jsx("option", { value: "LPM", children: "LPM - Loi de Programmation Militaire + Arr\u00EAt\u00E9 sectoriel" }), _jsx("option", { value: "II901", children: "II901 - Instruction Interminist\u00E9rielle (Classification D\u00E9fense)" }), _jsx("option", { value: "ANSSI", children: "ANSSI - R\u00E8gles et recommandations" }), _jsx("option", { value: "HDS", children: "HDS - H\u00E9bergement de Donn\u00E9es de Sant\u00E9" }), _jsx("option", { value: "RGS", children: "RGS - R\u00E9f\u00E9rentiel G\u00E9n\u00E9ral de S\u00E9curit\u00E9" })] }), _jsxs("optgroup", { label: "Luxembourg", children: [_jsx("option", { value: "CSSF 21/768", children: "CSSF Circulaire 21/768 - Secteur financier" }), _jsx("option", { value: "CSSF 17/654", children: "CSSF Circulaire 17/654 - PSF" })] }), _jsxs("optgroup", { label: "Union Europ\u00E9enne", children: [_jsx("option", { value: "NIS2", children: "NIS2 - Network and Information Security Directive" }), _jsx("option", { value: "GDPR", children: "GDPR/RGPD - Protection des donn\u00E9es personnelles" }), _jsx("option", { value: "DORA", children: "DORA - Digital Operational Resilience Act" })] }), _jsxs("optgroup", { label: "International", children: [_jsx("option", { value: "NIST CSF", children: "NIST Cybersecurity Framework" }), _jsx("option", { value: "CIS Controls", children: "CIS Controls - Center for Internet Security" }), _jsx("option", { value: "SOC 2", children: "SOC 2 - Service Organization Control" }), _jsx("option", { value: "PCI-DSS", children: "PCI-DSS - Payment Card Industry Data Security" }), _jsx("option", { value: "COBIT", children: "COBIT - Control Objectives for IT" })] }), _jsx("optgroup", { label: "Autre", children: _jsx("option", { value: "Custom", children: "R\u00E9f\u00E9rentiel personnalis\u00E9" }) })] }), _jsxs("select", { value: language, onChange: (event) => setLanguage(event.target.value), children: [_jsx("option", { value: "fr", children: "Fran\u00E7ais" }), _jsx("option", { value: "en", children: "English" })] }), _jsx("button", { type: "submit", children: "Cr\u00E9er" })] }), _jsxs("p", { children: ["ID campagne: ", campaignId || "-"] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Cr\u00E9er un crit\u00E8re" }), _jsxs("form", { onSubmit: createCriterion, children: [_jsx("input", { name: "code", placeholder: "Code (ex: A.5.1)", required: true }), _jsx("input", { name: "title", placeholder: "Titre du crit\u00E8re", required: true }), _jsx("input", { name: "theme", placeholder: "Th\u00E9matique", required: true }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Ajouter" })] }), _jsxs("p", { children: ["ID crit\u00E8re: ", criterionId || "-"] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "G\u00E9n\u00E9rer des questions" }), _jsxs("form", { onSubmit: generateQuestions, children: [_jsx("input", { name: "audienceRole", placeholder: "Profil audit\u00E9 (ex: DSI, RSSI)", required: true }), _jsx("button", { type: "submit", disabled: !criterionId, children: "G\u00E9n\u00E9rer" })] }), _jsx("ul", { children: generated.map((question) => (_jsx("li", { children: question }, question))) })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Configuration IA" }), _jsxs("div", { children: [_jsxs("label", { children: ["Mod\u00E8le Ollama actuel: ", _jsx("strong", { children: ollamaModel })] }), _jsx("div", { style: { marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }, children: ollamaModels.map((model) => (_jsx("button", { onClick: () => switchOllamaModel(model), style: {
                                                padding: "8px 12px",
                                                backgroundColor: ollamaModel === model ? "#4CAF50" : "#ddd",
                                                color: ollamaModel === model ? "white" : "black",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "14px"
                                            }, children: model }, model))) })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "G\u00E9n\u00E9rer des questions via IA (r\u00E9f\u00E9rentiel)" }), _jsxs("form", { onSubmit: generateQuestionsFromReferential, children: [_jsx("input", { type: "file", accept: ".pdf,.xlsx,.xls", onChange: (e) => setReferentialFile(e.currentTarget.files?.[0] || null), required: true }), _jsx("input", { type: "number", name: "count", placeholder: "Nombre de questions", defaultValue: "5", min: "1", max: "10" }), _jsx("button", { type: "submit", disabled: !criterionId || !referentialFile || uploadingReferential, children: uploadingReferential ? "Génération en cours..." : "Générer via IA" })] }), generatedQuestionsFromAi.length > 0 && (_jsxs("div", { children: [_jsx("h3", { children: "Questions g\u00E9n\u00E9r\u00E9es" }), _jsx("ul", { children: generatedQuestionsFromAi.map((q, idx) => (_jsxs("li", { children: [_jsx("strong", { children: q.text }), _jsx("br", {}), _jsxs("em", { children: ["Guidance: ", q.guidance] }), _jsx("br", {}), _jsxs("small", { children: ["Theme: ", q.theme] })] }, idx))) })] }))] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "R\u00E9f\u00E9rentiel documentaire (Phase 1.2)" }), _jsxs("form", { onSubmit: addDocument, children: [_jsx("input", { name: "name", placeholder: "Nom du document", required: true }), _jsx("input", { name: "theme", placeholder: "Th\u00E9matique", required: true }), _jsx("input", { name: "version", placeholder: "Version", defaultValue: "1.0", required: true }), _jsx("input", { name: "date", placeholder: "Date (YYYY-MM-DD)", required: true }), _jsxs("select", { name: "sensitivity", defaultValue: "Interne", children: [_jsx("option", { children: "Public" }), _jsx("option", { children: "Interne" }), _jsx("option", { children: "Sensible" }), _jsx("option", { children: "Confidentiel" })] }), _jsx("input", { name: "summary", placeholder: "R\u00E9sum\u00E9 court" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "R\u00E9f\u00E9rencer" })] }), _jsx("ul", { children: documents.map((document) => (_jsxs("li", { children: [document.name, " - ", document.theme, " (", document.sensitivity, ")"] }, document.id))) })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "\u00C9chelles de m\u00E9triques" }), _jsxs("form", { onSubmit: saveMetricScale, children: [_jsx("input", { name: "confidentiality", placeholder: "Confidentialit\u00E9 (ex: 1-5)", defaultValue: "1-5", required: true }), _jsx("input", { name: "integrity", placeholder: "Int\u00E9grit\u00E9 (ex: 1-5)", defaultValue: "1-5", required: true }), _jsx("input", { name: "availability", placeholder: "Disponibilit\u00E9 (ex: 1-5)", defaultValue: "1-5", required: true }), _jsx("input", { name: "evidence", placeholder: "Preuve (ex: 0-3)", defaultValue: "0-3", required: true }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Enregistrer" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Convention d'audit" }), _jsxs("form", { onSubmit: saveConvention, children: [_jsx("input", { name: "auditedOrganization", placeholder: "Partie audit\u00E9e", required: true }), _jsx("input", { name: "sponsorOrganization", placeholder: "Commanditaire", required: true }), _jsxs("select", { name: "auditType", defaultValue: "interne", children: [_jsx("option", { value: "interne", children: "Interne" }), _jsx("option", { value: "externe", children: "Externe" }), _jsx("option", { value: "mixte", children: "Mixte" })] }), _jsxs("select", { name: "mode", defaultValue: "hybride", children: [_jsx("option", { value: "sur-site", children: "Sur site" }), _jsx("option", { value: "distance", children: "Distance" }), _jsx("option", { value: "hybride", children: "Hybride" })] }), _jsx("input", { name: "perimeter", placeholder: "P\u00E9rim\u00E8tre", required: true }), _jsx("input", { name: "constraints", placeholder: "Contraintes" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Enregistrer" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Note de cadrage" }), _jsxs("form", { onSubmit: saveScopingNote, children: [_jsx("input", { name: "objectives", placeholder: "Objectifs", required: true }), _jsx("input", { name: "assumptions", placeholder: "Hypoth\u00E8ses" }), _jsx("input", { name: "exclusions", placeholder: "Exclusions" }), _jsx("input", { name: "stakeholders", placeholder: "Parties int\u00E9ress\u00E9es" }), _jsx("input", { name: "planningConstraints", placeholder: "Contraintes de planning" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Enregistrer" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Fiches interview\u00E9s (Phase 1.3)" }), _jsxs("form", { onSubmit: addInterviewee, children: [_jsx("input", { name: "fullName", placeholder: "Nom complet", required: true }), _jsx("input", { name: "role", placeholder: "Fonction", required: true }), _jsx("input", { name: "email", placeholder: "Email", required: true }), _jsx("input", { name: "entity", placeholder: "Entit\u00E9", required: true }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Ajouter" })] }), _jsx("ul", { children: interviewees.map((interviewee) => (_jsxs("li", { children: [interviewee.fullName, " - ", interviewee.role] }, interviewee.id))) })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Analyse documentaire" }), _jsxs("form", { onSubmit: saveDocumentReview, children: [_jsx("input", { name: "documentId", placeholder: "ID document", required: true }), _jsxs("select", { name: "maturityLevel", defaultValue: "Interm\u00E9diaire", children: [_jsx("option", { children: "Initial" }), _jsx("option", { children: "Interm\u00E9diaire" }), _jsx("option", { children: "Avanc\u00E9" })] }), _jsxs("select", { name: "complianceLevel", defaultValue: "Partielle", children: [_jsx("option", { children: "Faible" }), _jsx("option", { children: "Partielle" }), _jsx("option", { children: "\u00C9lev\u00E9e" })] }), _jsx("input", { name: "pointsToInvestigate", placeholder: "Points \u00E0 approfondir" }), _jsx("input", { name: "preliminaryVerdict", placeholder: "Verdict pr\u00E9liminaire" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Enregistrer" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Plan d'audit" }), _jsxs("form", { onSubmit: saveAuditPlan, children: [_jsx("input", { name: "objectives", placeholder: "Objectifs", required: true }), _jsx("input", { name: "scope", placeholder: "P\u00E9rim\u00E8tre d\u00E9taill\u00E9", required: true }), _jsx("input", { name: "methods", placeholder: "M\u00E9thodes (entretiens, analyse)", required: true }), _jsx("input", { name: "samplingStrategy", placeholder: "Strat\u00E9gie d'\u00E9chantillonnage" }), _jsx("input", { name: "logistics", placeholder: "Logistique" }), _jsx("input", { name: "communicationRules", placeholder: "R\u00E8gles de communication" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Enregistrer" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Cr\u00E9neaux d'entretien" }), _jsxs("form", { onSubmit: createInterviewSlot, children: [_jsx("input", { name: "title", placeholder: "Titre du cr\u00E9neau", required: true }), _jsx("input", { name: "startAt", placeholder: "D\u00E9but (ISO date-time)", required: true }), _jsx("input", { name: "endAt", placeholder: "Fin (ISO date-time)", required: true }), _jsxs("select", { name: "mode", defaultValue: "hybride", children: [_jsx("option", { value: "sur-site", children: "Sur site" }), _jsx("option", { value: "distance", children: "Distance" }), _jsx("option", { value: "hybride", children: "Hybride" })] }), _jsx("input", { name: "room", placeholder: "Salle" }), _jsx("input", { name: "teamsLink", placeholder: "Lien Teams" }), _jsx("input", { name: "theme", placeholder: "Th\u00E8me", required: true }), _jsx("input", { name: "criterionCode", placeholder: "Code crit\u00E8re" }), _jsx("input", { name: "participantIds", placeholder: "IDs interview\u00E9s (s\u00E9par\u00E9s par ,)" }), _jsx("input", { name: "associatedDocumentIds", placeholder: "IDs documents (s\u00E9par\u00E9s par ,)" }), _jsxs("label", { className: "checkbox-line", children: [_jsx("input", { type: "checkbox", name: "outlookSyncEnabled" }), " Synchroniser Outlook"] }), _jsx("input", { name: "outlookEventId", placeholder: "ID \u00E9v\u00E9nement Outlook (optionnel)" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Cr\u00E9er" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Suggestions documents par th\u00E8me" }), _jsxs("form", { onSubmit: loadThemeSuggestions, children: [_jsx("input", { name: "themeSuggestion", placeholder: "Th\u00E8me \u00E0 rechercher", value: themeSuggestion, onChange: (event) => setThemeSuggestion(event.target.value), required: true }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Rechercher" })] }), _jsx("p", { children: "Documents sugg\u00E9r\u00E9s" }), _jsx("ul", { children: suggestedDocuments.map((document) => (_jsx("li", { children: document.name }, document.id))) }), _jsx("p", { children: "Crit\u00E8res sugg\u00E9r\u00E9s" }), _jsx("ul", { children: suggestedCriteria.map((criterion) => (_jsxs("li", { children: [criterion.code, " - ", criterion.title] }, criterion.id))) })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Phase 1.4 - Note d'entretien" }), _jsxs("form", { onSubmit: startInterviewNote, children: [_jsx("input", { name: "slotId", placeholder: "ID cr\u00E9neau", required: true }), _jsx("input", { name: "startedAt", placeholder: "D\u00E9but r\u00E9el (ISO date-time)", required: true }), _jsx("input", { name: "endedAt", placeholder: "Fin r\u00E9elle (ISO date-time)", required: true }), _jsx("input", { name: "pauseStart", placeholder: "D\u00E9but pause (optionnel)" }), _jsx("input", { name: "pauseEnd", placeholder: "Fin pause (optionnel)" }), _jsx("input", { name: "freeNotes", placeholder: "Notes d'entretien" }), _jsx("button", { type: "submit", disabled: !campaignId, children: "D\u00E9marrer / Enregistrer" })] }), _jsxs("p", { children: ["ID note active: ", latestInterviewNoteId || "-"] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Pr\u00E9sences" }), _jsxs("form", { onSubmit: addAttendance, children: [_jsx("input", { name: "noteId", placeholder: "ID note (optionnel si active)" }), _jsx("input", { name: "intervieweeId", placeholder: "ID interview\u00E9 (optionnel)" }), _jsx("input", { name: "intervieweeName", placeholder: "Nom personne pr\u00E9sente", required: true }), _jsxs("label", { className: "checkbox-line", children: [_jsx("input", { type: "checkbox", name: "planned", defaultChecked: true }), " Pr\u00E9vu au plan"] }), _jsxs("label", { className: "checkbox-line", children: [_jsx("input", { type: "checkbox", name: "present", defaultChecked: true }), " Pr\u00E9sent"] }), _jsx("button", { type: "submit", disabled: !latestInterviewNoteId, children: "Ajouter pr\u00E9sence" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Documents \u00E0 transmettre" }), _jsxs("form", { onSubmit: addPendingDocument, children: [_jsx("input", { name: "interviewNoteId", placeholder: "ID note (optionnel si active)" }), _jsx("input", { name: "name", placeholder: "Nom document attendu", required: true }), _jsx("input", { name: "requestedFrom", placeholder: "Demand\u00E9 \u00E0", required: true }), _jsx("input", { name: "dueDate", placeholder: "Date attendue (YYYY-MM-DD)", required: true }), _jsx("button", { type: "submit", disabled: !latestInterviewNoteId, children: "Enregistrer demande" })] }), _jsxs("form", { onSubmit: markPendingDocumentReceived, children: [_jsx("input", { name: "pendingDocumentId", placeholder: "ID document demand\u00E9", required: true }), _jsx("input", { name: "transmittedDate", placeholder: "Date de transmission (YYYY-MM-DD)", required: true }), _jsx("button", { type: "submit", children: "Marquer re\u00E7u" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "R\u00E9f\u00E9rences documentaires dans la note" }), _jsxs("form", { onSubmit: addDocumentReference, children: [_jsx("input", { name: "noteId", placeholder: "ID note (optionnel si active)" }), _jsx("input", { name: "documentId", placeholder: "ID document existant" }), _jsx("input", { name: "pendingDocumentId", placeholder: "ID document \u00E0 transmettre" }), _jsx("input", { name: "reference", placeholder: "R\u00E9f\u00E9rence (ex: chap. IV.3 PSSI)", required: true }), _jsx("button", { type: "submit", disabled: !latestInterviewNoteId, children: "Ajouter r\u00E9f\u00E9rence" })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Scoring conformit\u00E9 des questions" }), _jsxs("form", { onSubmit: saveInterviewAnswer, children: [_jsx("input", { name: "interviewNoteId", placeholder: "ID note (optionnel si active)" }), _jsx("input", { name: "questionId", placeholder: "ID question", required: true }), _jsx("input", { name: "conformityScore", placeholder: "Score (0 \u00E0 5)", required: true }), _jsx("input", { name: "comment", placeholder: "Commentaire" }), _jsx("button", { type: "submit", disabled: !latestInterviewNoteId, children: "Enregistrer score" })] }), _jsxs("form", { onSubmit: loadCriterionScore, children: [_jsx("input", { name: "criterionId", placeholder: "ID crit\u00E8re", required: true }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Calculer conformit\u00E9 crit\u00E8re" })] }), _jsx("p", { children: criterionScore }), _jsx("button", { type: "button", onClick: () => {
                                    void loadConformityMatrix();
                                }, disabled: !campaignId, children: "Charger matrice globale" }), _jsx("p", { children: conformityMatrixSummary })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Phase 1.5 - Rapport d'audit (socle MVP)" }), _jsxs("form", { onSubmit: (event) => {
                                    event.preventDefault();
                                    void generateAuditReport();
                                }, children: [_jsx("button", { type: "submit", disabled: !campaignId, children: "G\u00E9n\u00E9rer un rapport" }), _jsx("button", { type: "button", onClick: () => {
                                            void loadReports();
                                        }, disabled: !campaignId, children: "Rafra\u00EEchir les rapports" }), _jsx("button", { type: "button", onClick: exportReportMarkdown, disabled: !selectedReportContent.trim(), children: "Exporter .md" }), _jsx("button", { type: "button", onClick: () => {
                                            void loadAuditLogs();
                                        }, disabled: !campaignId, children: "Rafra\u00EEchir journal" })] }), _jsx("ul", { children: reports.map((report) => (_jsxs("li", { children: [_jsx("button", { type: "button", onClick: () => {
                                                void openReport(report.id);
                                            }, children: "Ouvrir" }), " ", _jsx("button", { type: "button", onClick: () => {
                                                void exportReportDocx(report.id, report.title);
                                            }, children: "DOCX" }), " ", report.title, " (", report.version, ") - ", report.generatedAt] }, report.id))) }), _jsx("textarea", { value: selectedReportContent, onChange: (event) => setSelectedReportContent(event.target.value), placeholder: "Le contenu du rapport appara\u00EEt ici", rows: 18 })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "Journal d'actions" }), _jsxs("form", { onSubmit: (event) => {
                                    event.preventDefault();
                                    void loadAuditLogs();
                                }, children: [_jsxs("select", { value: logPeriod, onChange: (event) => setLogPeriod(event.target.value), children: [_jsx("option", { value: "7d", children: "7 jours" }), _jsx("option", { value: "30d", children: "30 jours" }), _jsx("option", { value: "all", children: "Tout" })] }), _jsxs("select", { value: logActionFilter, onChange: (event) => setLogActionFilter(event.target.value), children: [_jsx("option", { value: "all", children: "Toutes actions" }), knownActions.map((actionName) => (_jsx("option", { value: actionName, children: actionName }, actionName)))] }), _jsx("button", { type: "submit", disabled: !campaignId, children: "Rafra\u00EEchir" }), _jsx("button", { type: "button", onClick: exportFilteredLogsCsv, disabled: auditLogs.length === 0, children: "Exporter CSV" })] }), _jsx("ul", { children: auditLogs.slice(0, 20).map((logItem) => (_jsxs("li", { children: [logItem.timestamp, " - ", logItem.action, " - ", logItem.details] }, logItem.id))) })] })] })) : null, _jsx("p", { children: status })] }));
}
