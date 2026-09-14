const BASE_REVIEW_URL = "http://localhost:8080/review";

let deleteModalInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get("id");

    if (!reviewId) {
        showError("No review ID provided in URL.");
        document.getElementById("loadingSpinner").classList.add("d-none");
        return;
    }

    loadReportDetails(reviewId);

    const modalEl = document.getElementById("deleteConfirmModal");
    if (modalEl) {
        deleteModalInstance = new bootstrap.Modal(modalEl);
    }

    const deleteBtn = document.getElementById("deleteReportBtn");
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            if (deleteModalInstance) {
                deleteModalInstance.show();
            }
        });
    }

    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => executeDeleteReport(reviewId));
    }
});

async function loadReportDetails(id) {
    const spinner = document.getElementById("loadingSpinner");
    const content = document.getElementById("reportContent");

    try {
        const response = await fetch(`${BASE_REVIEW_URL}/${encodeURIComponent(id)}`);
        if (!response.ok) {
            throw new Error(`Failed to load report (Status: ${response.status})`);
        }

        const result = await response.json();
        if (result.code === 200 && result.dataObject) {
            renderReport(result.dataObject);
            spinner.classList.add("d-none");
            content.classList.remove("d-none");
        } else {
            showError(result.message || "Failed to load report details.");
            spinner.classList.add("d-none");
        }
    } catch (err) {
        showError(err.message || "Network error. Could not connect to review service.");
        spinner.classList.add("d-none");
    }
}

function renderReport(data) {
    const scoreEl = document.getElementById("reportScore");
    scoreEl.textContent = data.qualityScore;
    scoreEl.className = "score-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold fs-3 rounded-circle shadow";
    
    if (data.qualityScore >= 90) scoreEl.classList.add("score-excellent");
    else if (data.qualityScore >= 75) scoreEl.classList.add("score-good");
    else if (data.qualityScore >= 60) scoreEl.classList.add("score-average");
    else scoreEl.classList.add("score-poor");

    document.getElementById("reportLanguage").textContent = data.language || "Code";
    document.getElementById("reportTimestamp").innerHTML = `<i class="bi bi-clock me-1"></i> ${data.createdAt || "Just now"}`;

    const syntaxContainer = document.getElementById("syntaxErrorsContainer");
    syntaxContainer.innerHTML = '<h5 class="mb-3"><i class="bi bi-bug text-danger"></i> Syntax Errors</h5>';
    if (data.syntaxErrors && data.syntaxErrors.length > 0) {
        data.syntaxErrors.forEach(err => {
            syntaxContainer.innerHTML += `
                <div class="alert alert-danger shadow-sm mb-3 border-0 border-start border-danger border-4">
                    <strong>Line ${err.line || '?'}:</strong> ${err.error} <br>
                    <small class="text-dark">${err.description}</small>
                </div>`;
        });
    } else {
        syntaxContainer.innerHTML += '<p class="text-success small fw-bold"><i class="bi bi-check-circle-fill"></i> No syntax errors found.</p>';
    }

    const vulnContainer = document.getElementById("securityVulnContainer");
    vulnContainer.innerHTML = '<h5 class="mt-4 mb-3"><i class="bi bi-shield-x text-danger"></i> Security Vulnerabilities</h5>';
    if (data.securityVulnerabilities && data.securityVulnerabilities.length > 0) {
        data.securityVulnerabilities.forEach(vuln => {
            const badgeClass = getSeverityBadgeClass(vuln.severity);
            const borderClass = (vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH') ? 'border-danger' : 'border-warning';
            vulnContainer.innerHTML += `
                <div class="card shadow-sm mb-3 border-0 border-start ${borderClass} border-4">
                    <div class="card-body py-2 px-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="mb-0 fw-bold">${vuln.title} <span class="text-muted small fw-normal">(${vuln.cwe || 'N/A'})</span></h6>
                            <span class="badge ${badgeClass}">${vuln.severity}</span>
                        </div>
                        <p class="mb-1 small text-dark">${vuln.description}</p>
                        ${vuln.line ? `<div class="text-muted small"><i class="bi bi-geo-alt"></i> Line: ${vuln.line}</div>` : ''}
                    </div>
                </div>`;
        });
    } else {
        vulnContainer.innerHTML += '<p class="text-success small fw-bold"><i class="bi bi-shield-check"></i> No security vulnerabilities found.</p>';
    }

    const recContainer = document.getElementById("recommendationsContainer");
    recContainer.innerHTML = '<h5 class="mb-3"><i class="bi bi-lightbulb text-warning"></i> Code Recommendations</h5>';
    if (data.recommendations && data.recommendations.length > 0) {
        data.recommendations.forEach(rec => {
            const badgeClass = getSeverityBadgeClass(rec.priority);
            recContainer.innerHTML += `
                <div class="card shadow-sm mb-3 border-0 border-start border-info border-4">
                    <div class="card-body py-2 px-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="badge bg-secondary">${rec.category}</span>
                            <span class="badge ${badgeClass}">${rec.priority}</span>
                        </div>
                        <p class="mb-1 fw-medium">${rec.suggestion}</p>
                        ${rec.line ? `<small class="text-muted"><i class="bi bi-geo-alt"></i> Line: ${rec.line}</small>` : ''}
                    </div>
                </div>`;
        });
    } else {
        recContainer.innerHTML += '<p class="text-muted">No specific recommendations recorded.</p>';
    }

    if (data.updatedCode) {
        document.getElementById("refactoredFileName").innerHTML = `<i class="bi bi-file-code"></i> ${data.updatedCode.fileName || "Refactored Code"}`;
        document.getElementById("refactoredCodeBlock").textContent = data.updatedCode.fixedCode || "// No refactored code available";
    }
}

async function executeDeleteReport(id) {
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const spinner = document.getElementById("deleteSpinner");

    confirmBtn.disabled = true;
    spinner.classList.remove("d-none");

    try {
        const response = await fetch(`${BASE_REVIEW_URL}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        if (response.ok) {
            deleteModalInstance.hide();
            showSuccessBanner("Report deleted successfully. Redirecting to history...");
            setTimeout(() => {
                window.location.href = "review-history.html";
            }, 1200);
        } else {
            const data = await response.json();
            showError(data.message || "Failed to delete report.");
            deleteModalInstance.hide();
        }
    } catch (e) {
        showError("Network error: Could not reach the server to delete report.");
        deleteModalInstance.hide();
    } finally {
        confirmBtn.disabled = false;
        spinner.classList.add("d-none");
    }
}

function copyRefactoredCode() {
    const code = document.getElementById("refactoredCodeBlock").textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast("Refactored code copied to clipboard!", "success");
    }).catch(() => {
        showToast("Failed to copy code.", "danger");
    });
}

function getSeverityBadgeClass(severity) {
    if (!severity) return 'bg-secondary';
    switch (severity.toUpperCase()) {
        case 'CRITICAL': return 'badge-critical';
        case 'HIGH': return 'badge-high';
        case 'MEDIUM': return 'badge-medium';
        case 'LOW': return 'badge-low';
        default: return 'bg-secondary';
    }
}

function showSuccessBanner(msg) {
    const alertBox = document.getElementById("statusAlert");
    alertBox.className = "alert alert-success shadow-sm d-flex align-items-center fade-in rounded-4 border-0 mb-4";
    alertBox.innerHTML = `<i class="bi bi-check-circle-fill me-2 fs-5"></i> <span>${msg}</span>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showError(msg) {
    const alertBox = document.getElementById("statusAlert");
    alertBox.className = "alert alert-danger shadow-sm rounded-4 border-0 mb-4";
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
}

function showToast(message, type = "success") {
    const toastEl = document.getElementById("systemToast");
    const toastBody = document.getElementById("systemToastBody");
    if (!toastEl || !toastBody) return;

    toastEl.className = "toast align-items-center text-white custom-saas-toast border-0 mb-3";
    
    if (type === "success") {
        toastEl.classList.add("bg-success");
        toastBody.innerHTML = `<i class="bi bi-check-circle-fill fs-5"></i> <span>${message}</span>`;
    } else {
        toastEl.classList.add("bg-danger");
        toastBody.innerHTML = `<i class="bi bi-exclamation-triangle-fill fs-5"></i> <span>${message}</span>`;
    }

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
    toast.show();
}