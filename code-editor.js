const ANALYZE_API_URL = "http://localhost:8080/review/analyze";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("codeReviewForm");
    const snippetInput = document.getElementById("codeSnippet");
    const fileInput = document.getElementById("codeFile");
    const userEmail = sessionStorage.getItem("userEmail");
    
    function setupSidebarByRole() {
        const userRole = sessionStorage.getItem("userRole"); 
        
        const title = document.getElementById("brandTitle");
        const subtitle = document.getElementById("brandSubtitle");
        const icon = document.getElementById("brandIcon");
        
        const navDash = document.getElementById("navDashboard");
        const navUsers = document.getElementById("navUsers");
        const navReviews = document.getElementById("navReviews");
        const navUserView = document.getElementById("navUserView");
        const navProfile = document.getElementById("navProfile");
        
        const dropDash = document.getElementById("dropdownDashboard");
        const dropProfile = document.getElementById("dropdownProfile");

        if (userRole !== "ADMIN") {
            if (title) title.textContent = "Developer";
            if (subtitle) subtitle.textContent = "Workspace";
            if (icon) icon.className = "bi bi-cpu-fill";

            if (navDash) {
                navDash.href = "user-dashboard.html";
                navDash.innerHTML = '<i class="bi bi-speedometer2"></i><span>Dashboard</span>';
            }
            if (navReviews) {
                navReviews.href = "review-history.html";
                navReviews.innerHTML = '<i class="bi bi-clock-history"></i><span>Review History</span>';
            }
            if (navProfile) {
                navProfile.classList.remove("d-none");
                navProfile.innerHTML = '<i class="bi bi-person"></i><span>My Profile</span>';
                navProfile.href = "user-profile.html";
            }
            
            if (navUsers) navUsers.classList.add("d-none");
            if (navUserView) navUserView.classList.add("d-none");

            if (dropDash) dropDash.href = "user-dashboard.html";
            if (dropProfile) dropProfile.classList.remove("d-none");

        } else {
            if (title) title.textContent = "System Admin";
            if (subtitle) subtitle.textContent = "Console v2.0";
            if (icon) icon.className = "bi bi-shield-lock-fill";

            if (navDash) {
                navDash.href = "admin-dashboard.html";
                navDash.innerHTML = '<i class="bi bi-house-door-fill"></i><span>Dashboard</span>';
            }
            if (navReviews) {
                navReviews.href = "admin-dashboard.html#reviewsSection";
                navReviews.innerHTML = '<i class="bi bi-star-fill"></i><span>Reviews</span>';
            }
            if (navProfile) {
                navProfile.classList.remove("d-none");
                navProfile.innerHTML = '<i class="bi bi-gear-fill"></i><span>Settings</span>';
                navProfile.href = "user-profile.html";
            }
            
            if (navUsers) navUsers.classList.remove("d-none");
            if (navUserView) navUserView.classList.remove("d-none");

            if (dropDash) dropDash.href = "admin-dashboard.html";
            if (dropProfile) dropProfile.classList.remove("d-none");
        }
    }

    setupSidebarByRole();


    const lockInputs = () => {
        const hasText = snippetInput.value.trim().length > 0;
        const hasFile = fileInput.files && fileInput.files.length > 0;
        const fileStatusBadge = document.getElementById("fileUploadStatus");

        if (hasText) {
            fileInput.value = ""; 
            fileInput.disabled = true;
            if (fileStatusBadge) {
                fileStatusBadge.className = "badge bg-light text-muted border px-3 py-2 rounded-pill";
                fileStatusBadge.innerHTML = `<i class="bi bi-file-earmark me-1"></i> No file uploaded`;
            }
        } else if (hasFile) {
            snippetInput.value = ""; 
            snippetInput.disabled = true;
            if (fileStatusBadge) {
                fileStatusBadge.className = "badge bg-success-subtle text-success border border-success px-3 py-2 rounded-pill shadow-sm";
                fileStatusBadge.innerHTML = `<i class="bi bi-file-earmark-check-fill me-1"></i> ${fileInput.files[0].name}`;
            }
        } else {
            fileInput.disabled = false;
            snippetInput.disabled = false;
            if (fileStatusBadge) {
                fileStatusBadge.className = "badge bg-light text-muted border px-3 py-2 rounded-pill";
                fileStatusBadge.innerHTML = `<i class="bi bi-file-earmark me-1"></i> No file uploaded`;
            }
        }
    };

    snippetInput.addEventListener("input", lockInputs);
    fileInput.addEventListener("change", lockInputs);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const language = document.getElementById("languageSelect").value;
        const codeSnippet = snippetInput.value.trim();
        const file = fileInput.files[0];
        const formAlert = document.getElementById("formAlert");

        if (!codeSnippet && !file) {
            showError("Please provide either a code snippet or upload a file.");
            return;
        }

        formAlert.classList.add("d-none");

        const formData = new FormData();
        formData.append("email", userEmail || "test@test.com");
        formData.append("language", language);
        
        if (codeSnippet) {
            formData.append("codeSnippet", codeSnippet);
        } else if (file) {
            formData.append("file", file);
        }

        await submitReview(formData);
    });
    
    document.querySelectorAll(".custom-lang-item").forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelectorAll(".custom-lang-item").forEach(i => i.classList.remove("active-lang"));
            this.classList.add("active-lang");

            const lang = this.getAttribute("data-lang");
            document.getElementById("languageSelect").value = lang;
            
            const iconClass = lang === "Java" ? "bi-filetype-java" : (lang === "Python" ? "bi-filetype-py" : "bi-filetype-raw");
            document.getElementById("selectedEditorLang").innerHTML = `<i class="bi ${iconClass} me-2 text-primary"></i>${lang}`;
        });
    });
});


async function submitReview(formData) {
    const submitBtn = document.getElementById("submitBtn");
    const spinner = document.getElementById("submitSpinner");
    
    submitBtn.disabled = true;
    spinner.classList.remove("d-none");

    try {
        const response = await fetch(ANALYZE_API_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.code === 200 && result.dataObject) {
            renderResults(result.dataObject);
        } else {
            showError(result.message || "An error occurred during analysis.");
        }
    } catch (error) {
        console.error("API Error:", error);
        renderResults({
            qualityScore: 0,
            summary: "Analysis blocked. Ensure your code does not contain sensitive security prompts.",
            syntaxErrors: [],
            securityVulnerabilities: [],
            recommendations: [],
            updatedCode: null
        });
        showToast("Review blocked by safety filters.", "danger");
    } finally {
        submitBtn.disabled = false;
        spinner.classList.add("d-none");
    }
}

function renderResults(data) {
    document.getElementById("reviewFormCard").classList.add("d-none");
    document.getElementById("resultsContainer").classList.remove("d-none");

    const scoreElement = document.getElementById("resultScore");
    scoreElement.textContent = data.qualityScore;
    
    scoreElement.className = "score-circle d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold fs-3 rounded-circle shadow";
    if (data.qualityScore >= 90) scoreElement.classList.add("score-excellent");
    else if (data.qualityScore >= 75) scoreElement.classList.add("score-good");
    else if (data.qualityScore >= 60) scoreElement.classList.add("score-average");
    else scoreElement.classList.add("score-poor");

    const syntaxContainer = document.getElementById("syntaxErrorsList");
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

    const vulnContainer = document.getElementById("securityVulnList");
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
        vulnContainer.innerHTML += '<p class="text-success small fw-bold"><i class="bi bi-shield-check"></i> No secure vulnerabilities found.</p>';
    }

    const recContainer = document.getElementById("recommendationsList");
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
        recContainer.innerHTML += '<p class="text-muted">No specific recommendations at this time.</p>';
    }

    if (data.updatedCode) {
        document.getElementById("refactoredFileName").innerHTML = `<i class="bi bi-file-code"></i> ${data.updatedCode.fileName || "Refactored Code"}`;
        document.getElementById("refactoredCodeBlock").textContent = data.updatedCode.fixedCode || "// No code generated";
    }
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

function showError(msg) {
    const formAlert = document.getElementById("formAlert");
    formAlert.textContent = msg;
    formAlert.classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyCode() {
    const code = document.getElementById("refactoredCodeBlock").textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast("Refactored code copied to clipboard!", "success");
    }).catch(() => {
        showToast("Failed to copy code to clipboard.", "danger");
    });
}

function showToast(message, type = "success") {
    const toastEl = document.getElementById("systemToast");
    const toastBody = document.getElementById("systemToastBody");
    if (!toastEl || !toastBody) return;

    toastEl.className = "toast align-items-center text-white custom-saas-toast border-0 mb-3";
    
    if (type === "success") {
        toastEl.classList.add("bg-success");
        toastBody.innerHTML = `<i class="bi bi-check-circle-fill"></i> <span>${message}</span>`;
    } else {
        toastEl.classList.add("bg-danger");
        toastBody.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> <span>${message}</span>`;
    }

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 });
    toast.show();
}