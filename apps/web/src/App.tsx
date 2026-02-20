import { FormEvent, useEffect, useState } from "react";

type Language = "fr" | "en";

const API_URL = "http://localhost:4000";

export function App() {
  const [viewMode, setViewMode] = useState<"workspace" | "dashboard">("workspace");
  const [campaignId, setCampaignId] = useState("");
  const [criterionId, setCriterionId] = useState("");
  const [language, setLanguage] = useState<Language>("fr");
  const [generated, setGenerated] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; theme: string; sensitivity: string }>>([]);
  const [interviewees, setInterviewees] = useState<Array<{ id: string; fullName: string; role: string }>>([]);
  const [themeSuggestion, setThemeSuggestion] = useState("");
  const [suggestedDocuments, setSuggestedDocuments] = useState<Array<{ id: string; name: string }>>([]);
  const [suggestedCriteria, setSuggestedCriteria] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [latestInterviewNoteId, setLatestInterviewNoteId] = useState("");
  const [criterionScore, setCriterionScore] = useState<string>("");
  const [reports, setReports] = useState<Array<{ id: string; title: string; generatedAt: string; version: string }>>([]);
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; timestamp: string; details: string }>>([]);
  const [logPeriod, setLogPeriod] = useState<"7d" | "30d" | "all">("all");
  const [logActionFilter, setLogActionFilter] = useState<string>("all");
  const [knownActions, setKnownActions] = useState<string[]>([]);
  const [dashboardKpis, setDashboardKpis] = useState<{
    documentsCount: number;
    intervieweesCount: number;
    interviewNotesCount: number;
    pendingDocumentsCount: number;
    reportsCount: number;
    questionsCount: number;
  }>({
    documentsCount: 0,
    intervieweesCount: 0,
    interviewNotesCount: 0,
    pendingDocumentsCount: 0,
    reportsCount: 0,
    questionsCount: 0
  });
  const [matrixDetails, setMatrixDetails] = useState<
    Array<{ code: string; title: string; theme: string; weightedAverage: number | null; answeredQuestions: number; totalQuestions: number }>
  >([]);
  const [conformityMatrixSummary, setConformityMatrixSummary] = useState("");
  const [selectedReportTitle, setSelectedReportTitle] = useState("");
  const [selectedReportContent, setSelectedReportContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState("");
  const [generatedQuestionsFromAi, setGeneratedQuestionsFromAi] = useState<
    Array<{ text: string; guidance: string; theme: string }>
  >([]);
  const [referentialFile, setReferentialFile] = useState<File | null>(null);
  const [uploadingReferential, setUploadingReferential] = useState(false);

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Erreur inconnue";
  }

  async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      const backendMessage = payload && typeof payload === "object" ? String((payload as { message?: string }).message || "") : "";
      throw new Error(backendMessage || `HTTP ${response.status}`);
    }

    return payload as T;
  }

  function buildAuditLogUrl(activePeriod: "7d" | "30d" | "all", activeAction: string): string {
    const actionQuery = encodeURIComponent(activeAction || "all");
    return `${API_URL}/audit-log/${campaignId}?period=${activePeriod}&action=${actionQuery}`;
  }

  function syncKnownActions(logItems: Array<{ action: string }>) {
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

    async function loadCampaignData() {
      try {
        setErrorMessage("");
        const [documentData, intervieweeData, reportData, logData] = await Promise.all([
          requestJson<Array<{ id: string; name: string; theme: string; sensitivity: string }>>(`${API_URL}/documents/${campaignId}`),
          requestJson<Array<{ id: string; fullName: string; role: string }>>(`${API_URL}/interviewees/${campaignId}`),
          requestJson<Array<{ id: string; title: string; generatedAt: string; version: string }>>(`${API_URL}/audit-reports/${campaignId}`),
          requestJson<Array<{ id: string; action: string; timestamp: string; details: string }>>(buildAuditLogUrl(logPeriod, logActionFilter))
        ]);

        setDocuments(documentData || []);
        setInterviewees(intervieweeData || []);
        setReports(reportData || []);
        setAuditLogs(logData || []);
        syncKnownActions(logData || []);
      } catch (error) {
        setErrorMessage(`Chargement campagne impossible: ${getErrorMessage(error)}`);
      }
    }

    void loadCampaignData();
  }, [campaignId, logPeriod, logActionFilter]);

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setErrorMessage("");
      const payload = {
        name: String(formData.get("name") || ""),
        framework: String(formData.get("framework") || "PASSI"),
        language
      };

      const data = await requestJson<{ id: string }>(`${API_URL}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setCampaignId(data.id || "");
      setStatus("Campagne créée");
    } catch (error) {
      setErrorMessage(`Création campagne impossible: ${getErrorMessage(error)}`);
    }
  }

  async function createCriterion(event: FormEvent<HTMLFormElement>) {
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
      const data = await requestJson<{ id: string }>(`${API_URL}/criteria`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setCriterionId(data.id || "");
      setStatus("Critère créé");
    } catch (error) {
      setErrorMessage(`Création critère impossible: ${getErrorMessage(error)}`);
    }
  }

  async function generateQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setErrorMessage("");
      const data = await requestJson<{ questions: string[] }>(`${API_URL}/questions/generate`, {
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
    } catch (error) {
      setErrorMessage(`Génération de questions impossible: ${getErrorMessage(error)}`);
    }
  }

  async function generateQuestionsFromReferential(event: FormEvent<HTMLFormElement>) {
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
    formData.append("count", String((event.currentTarget.elements.namedItem("count") as HTMLInputElement)?.value || "5"));

    try {
      setErrorMessage("");
      setUploadingReferential(true);
      const data = await requestJson<{ questions: Array<{ text: string; guidance: string; theme: string }> }>(
        `${API_URL}/generate-questions-from-referential`,
        {
          method: "POST",
          body: formData
        }
      );

      setGeneratedQuestionsFromAi(data.questions || []);
      setStatus(`${data.questions?.length || 0} questions générées à partir du référentiel`);
    } catch (error) {
      setErrorMessage(`Génération via IA impossible: ${getErrorMessage(error)}`);
    } finally {
      setUploadingReferential(false);
    }
  }

  async function addDocument(event: FormEvent<HTMLFormElement>) {
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

  async function saveMetricScale(event: FormEvent<HTMLFormElement>) {
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

  async function saveConvention(event: FormEvent<HTMLFormElement>) {
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

  async function saveScopingNote(event: FormEvent<HTMLFormElement>) {
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

  async function addInterviewee(event: FormEvent<HTMLFormElement>) {
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

  async function saveDocumentReview(event: FormEvent<HTMLFormElement>) {
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

  async function saveAuditPlan(event: FormEvent<HTMLFormElement>) {
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

  async function createInterviewSlot(event: FormEvent<HTMLFormElement>) {
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

  async function loadThemeSuggestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`${API_URL}/interview-slots/suggestions/${campaignId}/${encodeURIComponent(themeSuggestion)}`);
    const data = await response.json();

    setSuggestedDocuments((data.documents || []).map((document: { id: string; name: string }) => ({ id: document.id, name: document.name })));
    setSuggestedCriteria(
      (data.criteria || []).map((criterion: { id: string; code: string; title: string }) => ({
        id: criterion.id,
        code: criterion.code,
        title: criterion.title
      }))
    );
    setStatus("Suggestions de documents chargées");
  }

  async function startInterviewNote(event: FormEvent<HTMLFormElement>) {
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

  async function addAttendance(event: FormEvent<HTMLFormElement>) {
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

  async function addPendingDocument(event: FormEvent<HTMLFormElement>) {
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

  async function markPendingDocumentReceived(event: FormEvent<HTMLFormElement>) {
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

  async function addDocumentReference(event: FormEvent<HTMLFormElement>) {
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

  async function saveInterviewAnswer(event: FormEvent<HTMLFormElement>) {
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

  async function loadCriterionScore(event: FormEvent<HTMLFormElement>) {
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
      const data = await requestJson<{ id: string; title: string; generatedAt: string; version: string; content: string }>(
        `${API_URL}/audit-reports/generate/${campaignId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}"
        }
      );

      setReports((previous) => [
        { id: data.id, title: data.title, generatedAt: data.generatedAt, version: data.version },
        ...previous
      ]);
      setSelectedReportTitle(data.title || "Rapport d'audit");
      setSelectedReportContent(data.content || "");
      setStatus("Rapport d'audit généré");
    } catch (error) {
      setErrorMessage(`Génération du rapport impossible: ${getErrorMessage(error)}`);
    }
  }

  async function loadReports() {
    try {
      setErrorMessage("");
      const data = await requestJson<Array<{ id: string; title: string; generatedAt: string; version: string }>>(
        `${API_URL}/audit-reports/${campaignId}`
      );
      setReports(data || []);
      setStatus("Liste des rapports chargée");
    } catch (error) {
      setErrorMessage(`Chargement des rapports impossible: ${getErrorMessage(error)}`);
    }
  }

  async function loadAuditLogs() {
    try {
      setErrorMessage("");
      const data = await requestJson<Array<{ id: string; action: string; timestamp: string; details: string }>>(
        buildAuditLogUrl(logPeriod, logActionFilter)
      );
      setAuditLogs(data || []);
      syncKnownActions(data || []);
      setStatus("Journal d'actions chargé");
    } catch (error) {
      setErrorMessage(`Chargement du journal impossible: ${getErrorMessage(error)}`);
    }
  }

  async function loadConformityMatrix() {
    try {
      setErrorMessage("");
      const data = await requestJson<{
        criteriaCount: number;
        overallAverage: number | null;
        matrix: Array<{ code: string; title: string; theme: string; weightedAverage: number | null; answeredQuestions: number; totalQuestions: number }>;
      }>(`${API_URL}/conformity-matrix/${campaignId}`);

      const overall = data.overallAverage === null ? "N/A" : Number(data.overallAverage).toFixed(2);
      const top3 = (data.matrix || [])
        .slice(0, 3)
        .map((item) => `${item.code}:${item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2)}`)
        .join(" | ");

      setMatrixDetails(data.matrix || []);
      setConformityMatrixSummary(`Critères: ${data.criteriaCount} | Moyenne globale: ${overall}${top3 ? ` | Aperçu: ${top3}` : ""}`);
      setStatus("Matrice de conformité chargée");
    } catch (error) {
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
      const [documentsData, intervieweesData, interviewNotesData, pendingDocumentsData, reportsData, questionsData, logsData, matrixData] =
        await Promise.all([
          requestJson<Array<{ id: string }>>(`${API_URL}/documents/${campaignId}`),
          requestJson<Array<{ id: string }>>(`${API_URL}/interviewees/${campaignId}`),
          requestJson<Array<{ id: string }>>(`${API_URL}/interview-notes/${campaignId}`),
          requestJson<Array<{ id: string; status: string }>>(`${API_URL}/pending-documents/${campaignId}`),
          requestJson<Array<{ id: string }>>(`${API_URL}/audit-reports/${campaignId}`),
          requestJson<Array<{ id: string }>>(`${API_URL}/questions/${campaignId}`),
          requestJson<Array<{ id: string; action: string; timestamp: string; details: string }>>(buildAuditLogUrl(logPeriod, logActionFilter)),
          requestJson<{
            criteriaCount: number;
            overallAverage: number | null;
            matrix: Array<{ code: string; title: string; theme: string; weightedAverage: number | null; answeredQuestions: number; totalQuestions: number }>;
          }>(`${API_URL}/conformity-matrix/${campaignId}`)
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
    } catch (error) {
      setErrorMessage(`Chargement dashboard impossible: ${getErrorMessage(error)}`);
    }
  }

  async function openReport(reportId: string) {
    try {
      setErrorMessage("");
      const data = await requestJson<{ title: string; content: string }>(`${API_URL}/audit-report/${reportId}`);
      setSelectedReportTitle(data.title || "Rapport d'audit");
      setSelectedReportContent(data.content || "");
      setStatus("Rapport ouvert");
    } catch (error) {
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

  function escapeCsvValue(value: string): string {
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

    const lines: string[] = [];
    lines.push("Matrice de conformité");
    lines.push(`Campagne,${campaignId}`);
    lines.push(`Résumé,${conformityMatrixSummary}`);
    lines.push("");
    lines.push("Détail par critère");
    lines.push(["Code", "Titre", "Thème", "Score pondéré", "Questions notées", "Questions totales"].map(escapeCsvValue).join(";"));

    matrixDetails.forEach((item) => {
      const scoreLabel = item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2);
      lines.push(
        [
          escapeCsvValue(item.code),
          escapeCsvValue(item.title),
          escapeCsvValue(item.theme),
          escapeCsvValue(scoreLabel),
          escapeCsvValue(item.answeredQuestions.toString()),
          escapeCsvValue(item.totalQuestions.toString())
        ].join(";")
      );
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

  async function exportReportDocx(reportId: string, reportTitle: string) {
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
    } catch (error) {
      setErrorMessage(`Export DOCX impossible: ${getErrorMessage(error)}`);
    }
  }

  return (
    <main className="page">
      <h1>Rubis - MVP Audit</h1>
      <p>Phase 1.1: préparation des entretiens et génération de questions.</p>
      <div className="view-switch">
        <button type="button" onClick={() => setViewMode("workspace")}>Mode Saisie</button>
        <button
          type="button"
          onClick={() => {
            setViewMode("dashboard");
            void loadDashboardData();
          }}
        >
          Mode Dashboard
        </button>
      </div>
      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      {viewMode === "dashboard" ? (
        <>
          <section className="card">
            <h2>Dashboard campagne</h2>
            <p>ID campagne: {campaignId || "-"}</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void loadDashboardData();
              }}
            >
              <select value={logPeriod} onChange={(event) => setLogPeriod(event.target.value as "7d" | "30d" | "all") }>
                <option value="7d">Logs 7 jours</option>
                <option value="30d">Logs 30 jours</option>
                <option value="all">Logs tout</option>
              </select>
              <select value={logActionFilter} onChange={(event) => setLogActionFilter(event.target.value)}>
                <option value="all">Actions: toutes</option>
                {knownActions.map((actionName) => (
                  <option key={actionName} value={actionName}>
                    {actionName}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={!campaignId}>
                Rafraîchir KPIs
              </button>
            </form>
            <div className="dashboard-grid">
              <div className="dashboard-kpi"><strong>Documents</strong><span>{dashboardKpis.documentsCount}</span></div>
              <div className="dashboard-kpi"><strong>Interviewés</strong><span>{dashboardKpis.intervieweesCount}</span></div>
              <div className="dashboard-kpi"><strong>Questions</strong><span>{dashboardKpis.questionsCount}</span></div>
              <div className="dashboard-kpi"><strong>Notes entretien</strong><span>{dashboardKpis.interviewNotesCount}</span></div>
              <div className="dashboard-kpi"><strong>Docs en attente</strong><span>{dashboardKpis.pendingDocumentsCount}</span></div>
              <div className="dashboard-kpi"><strong>Rapports</strong><span>{dashboardKpis.reportsCount}</span></div>
            </div>
          </section>

          <section className="card">
            <h2>Matrice de conformité</h2>
            <p>{conformityMatrixSummary || "-"}</p>
            <button type="button" onClick={exportMatrixCsv} disabled={matrixDetails.length === 0}>
              Exporter matrice CSV
            </button>
            <ul>
              {matrixDetails.map((item) => (
                <li key={`${item.code}-${item.title}`}>
                  {item.code} - {item.title} ({item.theme}) : {item.weightedAverage === null ? "N/A" : item.weightedAverage.toFixed(2)} [{item.answeredQuestions}/{item.totalQuestions}]
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Dernières actions</h2>
            <ul>
              {auditLogs.slice(0, 20).map((logItem) => (
                <li key={logItem.id}>
                  {logItem.timestamp} - {logItem.action} - {logItem.details}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}

      {viewMode === "workspace" ? (
        <>

      <section className="card">
        <h2>Créer une campagne</h2>
        <form onSubmit={createCampaign}>
          <input name="name" placeholder="Nom de campagne" required />
          <input name="framework" placeholder="Référentiel (ex: PASSI)" required />
          <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
          <button type="submit">Créer</button>
        </form>
        <p>ID campagne: {campaignId || "-"}</p>
      </section>

      <section className="card">
        <h2>Créer un critère</h2>
        <form onSubmit={createCriterion}>
          <input name="code" placeholder="Code (ex: A.5.1)" required />
          <input name="title" placeholder="Titre du critère" required />
          <input name="theme" placeholder="Thématique" required />
          <button type="submit" disabled={!campaignId}>
            Ajouter
          </button>
        </form>
        <p>ID critère: {criterionId || "-"}</p>
      </section>

      <section className="card">
        <h2>Générer des questions</h2>
        <form onSubmit={generateQuestions}>
          <input name="audienceRole" placeholder="Profil audité (ex: DSI, RSSI)" required />
          <button type="submit" disabled={!criterionId}>
            Générer
          </button>
        </form>
        <ul>
          {generated.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Générer des questions via IA (référentiel)</h2>
        <form onSubmit={generateQuestionsFromReferential}>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls"
            onChange={(e) => setReferentialFile(e.currentTarget.files?.[0] || null)}
            required
          />
          <input type="number" name="count" placeholder="Nombre de questions" defaultValue="5" min="1" max="10" />
          <button type="submit" disabled={!criterionId || !referentialFile || uploadingReferential}>
            {uploadingReferential ? "Génération en cours..." : "Générer via IA"}
          </button>
        </form>
        {generatedQuestionsFromAi.length > 0 && (
          <div>
            <h3>Questions générées</h3>
            <ul>
              {generatedQuestionsFromAi.map((q, idx) => (
                <li key={idx}>
                  <strong>{q.text}</strong>
                  <br />
                  <em>Guidance: {q.guidance}</em>
                  <br />
                  <small>Theme: {q.theme}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Référentiel documentaire (Phase 1.2)</h2>
        <form onSubmit={addDocument}>
          <input name="name" placeholder="Nom du document" required />
          <input name="theme" placeholder="Thématique" required />
          <input name="version" placeholder="Version" defaultValue="1.0" required />
          <input name="date" placeholder="Date (YYYY-MM-DD)" required />
          <select name="sensitivity" defaultValue="Interne">
            <option>Public</option>
            <option>Interne</option>
            <option>Sensible</option>
            <option>Confidentiel</option>
          </select>
          <input name="summary" placeholder="Résumé court" />
          <button type="submit" disabled={!campaignId}>
            Référencer
          </button>
        </form>
        <ul>
          {documents.map((document) => (
            <li key={document.id}>
              {document.name} - {document.theme} ({document.sensitivity})
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Échelles de métriques</h2>
        <form onSubmit={saveMetricScale}>
          <input name="confidentiality" placeholder="Confidentialité (ex: 1-5)" defaultValue="1-5" required />
          <input name="integrity" placeholder="Intégrité (ex: 1-5)" defaultValue="1-5" required />
          <input name="availability" placeholder="Disponibilité (ex: 1-5)" defaultValue="1-5" required />
          <input name="evidence" placeholder="Preuve (ex: 0-3)" defaultValue="0-3" required />
          <button type="submit" disabled={!campaignId}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Convention d'audit</h2>
        <form onSubmit={saveConvention}>
          <input name="auditedOrganization" placeholder="Partie auditée" required />
          <input name="sponsorOrganization" placeholder="Commanditaire" required />
          <select name="auditType" defaultValue="interne">
            <option value="interne">Interne</option>
            <option value="externe">Externe</option>
            <option value="mixte">Mixte</option>
          </select>
          <select name="mode" defaultValue="hybride">
            <option value="sur-site">Sur site</option>
            <option value="distance">Distance</option>
            <option value="hybride">Hybride</option>
          </select>
          <input name="perimeter" placeholder="Périmètre" required />
          <input name="constraints" placeholder="Contraintes" />
          <button type="submit" disabled={!campaignId}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Note de cadrage</h2>
        <form onSubmit={saveScopingNote}>
          <input name="objectives" placeholder="Objectifs" required />
          <input name="assumptions" placeholder="Hypothèses" />
          <input name="exclusions" placeholder="Exclusions" />
          <input name="stakeholders" placeholder="Parties intéressées" />
          <input name="planningConstraints" placeholder="Contraintes de planning" />
          <button type="submit" disabled={!campaignId}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Fiches interviewés (Phase 1.3)</h2>
        <form onSubmit={addInterviewee}>
          <input name="fullName" placeholder="Nom complet" required />
          <input name="role" placeholder="Fonction" required />
          <input name="email" placeholder="Email" required />
          <input name="entity" placeholder="Entité" required />
          <button type="submit" disabled={!campaignId}>
            Ajouter
          </button>
        </form>
        <ul>
          {interviewees.map((interviewee) => (
            <li key={interviewee.id}>
              {interviewee.fullName} - {interviewee.role}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Analyse documentaire</h2>
        <form onSubmit={saveDocumentReview}>
          <input name="documentId" placeholder="ID document" required />
          <select name="maturityLevel" defaultValue="Intermédiaire">
            <option>Initial</option>
            <option>Intermédiaire</option>
            <option>Avancé</option>
          </select>
          <select name="complianceLevel" defaultValue="Partielle">
            <option>Faible</option>
            <option>Partielle</option>
            <option>Élevée</option>
          </select>
          <input name="pointsToInvestigate" placeholder="Points à approfondir" />
          <input name="preliminaryVerdict" placeholder="Verdict préliminaire" />
          <button type="submit" disabled={!campaignId}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Plan d'audit</h2>
        <form onSubmit={saveAuditPlan}>
          <input name="objectives" placeholder="Objectifs" required />
          <input name="scope" placeholder="Périmètre détaillé" required />
          <input name="methods" placeholder="Méthodes (entretiens, analyse)" required />
          <input name="samplingStrategy" placeholder="Stratégie d'échantillonnage" />
          <input name="logistics" placeholder="Logistique" />
          <input name="communicationRules" placeholder="Règles de communication" />
          <button type="submit" disabled={!campaignId}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Créneaux d'entretien</h2>
        <form onSubmit={createInterviewSlot}>
          <input name="title" placeholder="Titre du créneau" required />
          <input name="startAt" placeholder="Début (ISO date-time)" required />
          <input name="endAt" placeholder="Fin (ISO date-time)" required />
          <select name="mode" defaultValue="hybride">
            <option value="sur-site">Sur site</option>
            <option value="distance">Distance</option>
            <option value="hybride">Hybride</option>
          </select>
          <input name="room" placeholder="Salle" />
          <input name="teamsLink" placeholder="Lien Teams" />
          <input name="theme" placeholder="Thème" required />
          <input name="criterionCode" placeholder="Code critère" />
          <input name="participantIds" placeholder="IDs interviewés (séparés par ,)" />
          <input name="associatedDocumentIds" placeholder="IDs documents (séparés par ,)" />
          <label className="checkbox-line">
            <input type="checkbox" name="outlookSyncEnabled" /> Synchroniser Outlook
          </label>
          <input name="outlookEventId" placeholder="ID événement Outlook (optionnel)" />
          <button type="submit" disabled={!campaignId}>
            Créer
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Suggestions documents par thème</h2>
        <form onSubmit={loadThemeSuggestions}>
          <input
            name="themeSuggestion"
            placeholder="Thème à rechercher"
            value={themeSuggestion}
            onChange={(event) => setThemeSuggestion(event.target.value)}
            required
          />
          <button type="submit" disabled={!campaignId}>
            Rechercher
          </button>
        </form>
        <p>Documents suggérés</p>
        <ul>
          {suggestedDocuments.map((document) => (
            <li key={document.id}>
              {document.name}
            </li>
          ))}
        </ul>
        <p>Critères suggérés</p>
        <ul>
          {suggestedCriteria.map((criterion) => (
            <li key={criterion.id}>
              {criterion.code} - {criterion.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Phase 1.4 - Note d'entretien</h2>
        <form onSubmit={startInterviewNote}>
          <input name="slotId" placeholder="ID créneau" required />
          <input name="startedAt" placeholder="Début réel (ISO date-time)" required />
          <input name="endedAt" placeholder="Fin réelle (ISO date-time)" required />
          <input name="pauseStart" placeholder="Début pause (optionnel)" />
          <input name="pauseEnd" placeholder="Fin pause (optionnel)" />
          <input name="freeNotes" placeholder="Notes d'entretien" />
          <button type="submit" disabled={!campaignId}>
            Démarrer / Enregistrer
          </button>
        </form>
        <p>ID note active: {latestInterviewNoteId || "-"}</p>
      </section>

      <section className="card">
        <h2>Présences</h2>
        <form onSubmit={addAttendance}>
          <input name="noteId" placeholder="ID note (optionnel si active)" />
          <input name="intervieweeId" placeholder="ID interviewé (optionnel)" />
          <input name="intervieweeName" placeholder="Nom personne présente" required />
          <label className="checkbox-line">
            <input type="checkbox" name="planned" defaultChecked /> Prévu au plan
          </label>
          <label className="checkbox-line">
            <input type="checkbox" name="present" defaultChecked /> Présent
          </label>
          <button type="submit" disabled={!latestInterviewNoteId}>
            Ajouter présence
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Documents à transmettre</h2>
        <form onSubmit={addPendingDocument}>
          <input name="interviewNoteId" placeholder="ID note (optionnel si active)" />
          <input name="name" placeholder="Nom document attendu" required />
          <input name="requestedFrom" placeholder="Demandé à" required />
          <input name="dueDate" placeholder="Date attendue (YYYY-MM-DD)" required />
          <button type="submit" disabled={!latestInterviewNoteId}>
            Enregistrer demande
          </button>
        </form>
        <form onSubmit={markPendingDocumentReceived}>
          <input name="pendingDocumentId" placeholder="ID document demandé" required />
          <input name="transmittedDate" placeholder="Date de transmission (YYYY-MM-DD)" required />
          <button type="submit">Marquer reçu</button>
        </form>
      </section>

      <section className="card">
        <h2>Références documentaires dans la note</h2>
        <form onSubmit={addDocumentReference}>
          <input name="noteId" placeholder="ID note (optionnel si active)" />
          <input name="documentId" placeholder="ID document existant" />
          <input name="pendingDocumentId" placeholder="ID document à transmettre" />
          <input name="reference" placeholder="Référence (ex: chap. IV.3 PSSI)" required />
          <button type="submit" disabled={!latestInterviewNoteId}>
            Ajouter référence
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Scoring conformité des questions</h2>
        <form onSubmit={saveInterviewAnswer}>
          <input name="interviewNoteId" placeholder="ID note (optionnel si active)" />
          <input name="questionId" placeholder="ID question" required />
          <input name="conformityScore" placeholder="Score (0 à 5)" required />
          <input name="comment" placeholder="Commentaire" />
          <button type="submit" disabled={!latestInterviewNoteId}>
            Enregistrer score
          </button>
        </form>
        <form onSubmit={loadCriterionScore}>
          <input name="criterionId" placeholder="ID critère" required />
          <button type="submit" disabled={!campaignId}>
            Calculer conformité critère
          </button>
        </form>
        <p>{criterionScore}</p>
        <button
          type="button"
          onClick={() => {
            void loadConformityMatrix();
          }}
          disabled={!campaignId}
        >
          Charger matrice globale
        </button>
        <p>{conformityMatrixSummary}</p>
      </section>

      <section className="card">
        <h2>Phase 1.5 - Rapport d'audit (socle MVP)</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void generateAuditReport();
          }}
        >
          <button type="submit" disabled={!campaignId}>
            Générer un rapport
          </button>
          <button
            type="button"
            onClick={() => {
              void loadReports();
            }}
            disabled={!campaignId}
          >
            Rafraîchir les rapports
          </button>
          <button type="button" onClick={exportReportMarkdown} disabled={!selectedReportContent.trim()}>
            Exporter .md
          </button>
          <button
            type="button"
            onClick={() => {
              void loadAuditLogs();
            }}
            disabled={!campaignId}
          >
            Rafraîchir journal
          </button>
        </form>
        <ul>
          {reports.map((report) => (
            <li key={report.id}>
              <button
                type="button"
                onClick={() => {
                  void openReport(report.id);
                }}
              >
                Ouvrir
              </button>{" "}
              <button
                type="button"
                onClick={() => {
                  void exportReportDocx(report.id, report.title);
                }}
              >
                DOCX
              </button>{" "}
              {report.title} ({report.version}) - {report.generatedAt}
            </li>
          ))}
        </ul>
        <textarea
          value={selectedReportContent}
          onChange={(event) => setSelectedReportContent(event.target.value)}
          placeholder="Le contenu du rapport apparaît ici"
          rows={18}
        />
      </section>

      <section className="card">
        <h2>Journal d'actions</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadAuditLogs();
          }}
        >
          <select value={logPeriod} onChange={(event) => setLogPeriod(event.target.value as "7d" | "30d" | "all") }>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="all">Tout</option>
          </select>
          <select value={logActionFilter} onChange={(event) => setLogActionFilter(event.target.value)}>
            <option value="all">Toutes actions</option>
            {knownActions.map((actionName) => (
              <option key={actionName} value={actionName}>
                {actionName}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!campaignId}>Rafraîchir</button>
          <button type="button" onClick={exportFilteredLogsCsv} disabled={auditLogs.length === 0}>Exporter CSV</button>
        </form>
        <ul>
          {auditLogs.slice(0, 20).map((logItem) => (
            <li key={logItem.id}>
              {logItem.timestamp} - {logItem.action} - {logItem.details}
            </li>
          ))}
        </ul>
      </section>

        </>
      ) : null}

      <p>{status}</p>
    </main>
  );
}
