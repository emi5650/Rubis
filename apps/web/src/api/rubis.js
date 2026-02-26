const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
async function request(path, init) {
    const hasBody = init?.body !== undefined && init?.body !== null;
    const response = await fetch(`${API_BASE}${path}`, {
        headers: hasBody
            ? {
                "Content-Type": "application/json",
                ...(init?.headers || {})
            }
            : { ...(init?.headers || {}) },
        ...init
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
        const message = payload && typeof payload === "object" ? String(payload.message || "") : "";
        throw new Error(message || `HTTP ${response.status}`);
    }
    return payload;
}
async function requestForm(path, formData) {
    const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        body: formData
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
        const message = payload && typeof payload === "object" ? String(payload.message || "") : "";
        throw new Error(message || `HTTP ${response.status}`);
    }
    return payload;
}
export function getCampaigns() {
    return request("/campaigns");
}
export function createCampaign(input) {
    return request("/campaigns", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function createCriterion(input) {
    return request("/criteria", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function getCriteria(campaignId) {
    return request(`/criteria/${campaignId}`);
}
export function saveConvention(input) {
    return request("/conventions", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function saveAuditPlan(input) {
    return request("/audit-plans", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function createDocument(input) {
    return request("/documents", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function getDocuments(campaignId) {
    return request(`/documents/${campaignId}`);
}
export function saveDocumentReview(input) {
    return request("/document-reviews", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function createInterviewee(input) {
    return request("/interviewees", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function getInterviewees(campaignId) {
    return request(`/interviewees/${campaignId}`);
}
export function createInterviewSlot(input) {
    return request("/interview-slots", {
        method: "POST",
        body: JSON.stringify({
            ...input,
            participantIds: [],
            associatedDocumentIds: [],
            outlookSyncEnabled: false,
            outlookEventId: ""
        })
    });
}
export function getInterviewSlots(campaignId) {
    return request(`/interview-slots/${campaignId}`);
}
export function generateReport(campaignId) {
    return request(`/audit-reports/generate/${campaignId}`, { method: "POST" });
}
export function getReports(campaignId) {
    return request(`/audit-reports/${campaignId}`);
}
export function getAuditLog(campaignId) {
    return request(`/audit-log/${campaignId}?period=all&action=all`);
}
export function getConfig() {
    return request("/config");
}
export function setConfig(ollamaModel) {
    return request("/config", {
        method: "POST",
        body: JSON.stringify({ ollamaModel })
    });
}
export function getReferentials() {
    return request("/referentials");
}
export function getReferentialRequirements(referentialId) {
    return request(`/referentials/${referentialId}/requirements`);
}
export function importReferential(file) {
    const formData = new FormData();
    formData.append("file", file);
    return requestForm("/referentials/import", formData);
}
export function getOpenAiKeyStatus() {
    return request("/admin/openai-key/status");
}
export function deleteReferential(referentialId) {
    return request(`/referentials/${referentialId}`, {
        method: "DELETE"
    });
}
export function previewRubisImport(file) {
    const formData = new FormData();
    formData.append("file", file);
    return requestForm("/referentials/import/preview/rubis", formData);
}
export function confirmRubisImport(file) {
    const formData = new FormData();
    formData.append("file", file);
    return requestForm("/referentials/import/confirm/rubis", formData);
}
export function importReferentialFromRubisFormat(file) {
    const formData = new FormData();
    formData.append("file", file);
    return requestForm("/referentials/import/rubis", formData);
}
export function importReferentialFromList(file, codeColumn, textColumn, scopesColumn) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("codeColumn", codeColumn);
    formData.append("textColumn", textColumn);
    formData.append("scopesColumn", scopesColumn);
    return requestForm("/referentials/import/list", formData);
}
export function importReferentialFromFreeText(name, text) {
    return request("/referentials/import/freetext", {
        method: "POST",
        body: JSON.stringify({ name, text })
    });
}
export function exportReferential(referentialId) {
    return request(`/referentials/${referentialId}/export`, { method: "GET" });
}
export function setOpenAiKey(apiKey) {
    return request("/admin/openai-key", {
        method: "POST",
        body: JSON.stringify({ apiKey })
    });
}
