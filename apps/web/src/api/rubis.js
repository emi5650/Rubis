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
export function saveScopingNote(input) {
    return request("/scoping-notes", {
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
export function analyzeDocumentUpload(campaignId, file) {
    const formData = new FormData();
    formData.append("campaignId", campaignId);
    formData.append("file", file);
    return requestForm("/documents/analyze-upload", formData);
}
export function confirmAnalyzedDocument(input) {
    return request("/documents/confirm-upload", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function getDocuments(campaignId) {
    return request(`/documents/${campaignId}`);
}
export function updateDocument(documentId, input) {
    return request(`/documents/item/${documentId}`, {
        method: "PUT",
        body: JSON.stringify(input)
    });
}
export function deleteDocument(documentId, campaignId) {
    return request(`/documents/item/${documentId}`, {
        method: "DELETE",
        body: JSON.stringify({ campaignId })
    });
}
export function uploadRegistryDocument(campaignId, file) {
    const formData = new FormData();
    formData.append("campaignId", campaignId);
    formData.append("file", file);
    return requestForm("/api/documents/upload", formData);
}
export function listRegistryDocuments(campaignId) {
    return request(`/api/documents?campaignId=${encodeURIComponent(campaignId)}`);
}
export function getRegistryDocument(id) {
    return request(`/api/documents/${id}`);
}
export function patchRegistryDocument(id, input) {
    return request(`/api/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
    });
}
export function deleteRegistryDocument(id, campaignId) {
    return request(`/api/documents/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ campaignId })
    });
}
export function createAudit(input) {
    return request("/api/audits", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function ingestAudit(auditId, input) {
    return request(`/api/audits/${auditId}/ingest`, {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function runAudit(auditId, input) {
    return request(`/api/audits/${auditId}/run`, {
        method: "POST",
        body: JSON.stringify(input || {})
    });
}
export function getAuditFindings(auditId) {
    return request(`/api/audits/${auditId}/findings`);
}
export function getAuditScore(auditId) {
    return request(`/api/audits/${auditId}/score`);
}
export function getAuditReport(auditId) {
    return request(`/api/audits/${auditId}/report`);
}
export async function exportRegistryDocumentsCsv(campaignId) {
    const response = await fetch(`${API_BASE}/api/documents/export?campaignId=${encodeURIComponent(campaignId)}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
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
export function importReferentialFromList(file, requirementIdColumn, requirementTitleColumn, requirementTextColumn, scopesColumn, themeLevel1Column, themeLevel1TitleColumn, themeLevel2Column, themeLevel2TitleColumn, themeLevel3Column, themeLevel3TitleColumn, themeLevel4Column, themeLevel4TitleColumn) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("requirementIdColumn", requirementIdColumn);
    formData.append("requirementTitleColumn", requirementTitleColumn);
    formData.append("requirementTextColumn", requirementTextColumn);
    formData.append("scopesColumn", scopesColumn);
    formData.append("themeLevel1Column", themeLevel1Column);
    formData.append("themeLevel1TitleColumn", themeLevel1TitleColumn);
    formData.append("themeLevel2Column", themeLevel2Column);
    formData.append("themeLevel2TitleColumn", themeLevel2TitleColumn);
    formData.append("themeLevel3Column", themeLevel3Column);
    formData.append("themeLevel3TitleColumn", themeLevel3TitleColumn);
    formData.append("themeLevel4Column", themeLevel4Column);
    formData.append("themeLevel4TitleColumn", themeLevel4TitleColumn);
    return requestForm("/referentials/import/list", formData);
}
export function previewListImport(file, sheet) {
    const formData = new FormData();
    formData.append("file", file);
    const url = sheet ? `/referentials/import/list/preview?sheet=${encodeURIComponent(sheet)}` : "/referentials/import/list/preview";
    return requestForm(url, formData);
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
export function getAuditDirectory() {
    return request("/admin/audit-directory");
}
export function createAuditDirectoryMember(input) {
    return request("/admin/audit-directory", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
export function deleteAuditDirectoryMember(id) {
    return request(`/admin/audit-directory/${id}`, {
        method: "DELETE"
    });
}
export function getAuditTeam(campaignId) {
    return request(`/audit-teams/${campaignId}`);
}
export function saveAuditTeam(input) {
    return request("/audit-teams", {
        method: "POST",
        body: JSON.stringify(input)
    });
}
