const BASE_REVIEW_URL = "http://localhost:8080/review";
let allReviews = [];
let targetReviewIdToDelete = null;
let deleteModalInstance = null;
let currentSelectedLanguage = "ALL";

document.addEventListener("DOMContentLoaded", function () {
    const userEmail = sessionStorage.getItem("userEmail");
    if (!userEmail) {
        window.location.href = "login.html";
        return;
    }
    const navEmail = document.getElementById("navUserEmail");
    if (navEmail) navEmail.textContent = userEmail || "user@platform.com";

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

    const modalEl = document.getElementById("deleteModal");
    if (modalEl) {
        deleteModalInstance = new bootstrap.Modal(modalEl);
    }

    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", executeDeleteReview);
    }

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    document.querySelectorAll(".custom-lang-item").forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            
            document.querySelectorAll(".custom-lang-item").forEach(i => i.classList.remove("active-lang"));
            this.classList.add("active-lang");

            currentSelectedLanguage = this.getAttribute("data-lang");
            const langName = this.textContent.trim();
            document.getElementById("selectedLangText").innerHTML = `<i class="bi bi-funnel me-2 text-primary"></i>${langName}`;

            applyFilters();
        });
    });

    loadReviewHistory(userEmail || "test@test.com");
});

async function loadReviewHistory(email) {
    try {
        const response = await fetch(`${BASE_REVIEW_URL}/history?email=${encodeURIComponent(email)}&limit=100`);
        if (response.ok) {
            const result = await response.json();
            allReviews = result.dataObject || [];
            renderHistoryTable(allReviews);
        } else {
            renderEmptyHistory("No past reviews found for this account.");
        }
    } catch (err) {
        console.error("Failed to fetch history:", err);
        renderEmptyHistory("Could not reach backend service to load history.");
    }
}

function renderHistoryTable(reviews) {
    const tbody = document.getElementById("historyTbody");
    if (!reviews || reviews.length === 0) {
        renderEmptyHistory("No code reviews match your search or filter criteria.");
        return;
    }

    tbody.innerHTML = reviews.map(item => `
        <tr>
            <td class="ps-4">
                <span class="badge bg-secondary-subtle text-secondary border px-2 py-1 font-monospace shadow-sm">
                    ${item.language || "Code"}
                </span>
            </td>
            <td>
                <span class="badge ${getScoreBadgeClass(item.qualityScore)} badge-score shadow-sm">
                    ${item.qualityScore}/100
                </span>
            </td>
            <td>
                <div class="summary-text text-dark fw-medium" title="${escapeHtml(item.summary || '')}">
                    ${item.summary || "No summary available"}
                </div>
            </td>
            <td class="text-muted small">
                <i class="bi bi-clock me-1"></i>${item.createdAt || "Just now"}
            </td>
            <td class="text-end pe-4">
                <div class="btn-group shadow-sm rounded-3">
                    <a href="review-report.html?id=${item.id}" class="btn btn-sm btn-outline-primary fw-semibold">
                        <i class="bi bi-eye"></i> Report
                    </a>
                    <button class="btn btn-sm btn-outline-danger fw-semibold" onclick="openDeleteModal('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderEmptyHistory(message) {
    const tbody = document.getElementById("historyTbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5 text-muted bg-white rounded-4 shadow-sm">
                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    ${message}
                </td>
            </tr>
        `;
    }
}

function applyFilters() {
    const query = document.getElementById("searchInput").value.toLowerCase().trim();

    const filtered = allReviews.filter(item => {
        const matchesLang = currentSelectedLanguage === "ALL" || 
            (item.language && item.language.toLowerCase() === currentSelectedLanguage.toLowerCase());
        
        const summaryMatch = (item.summary && item.summary.toLowerCase().includes(query)) ||
                             (item.language && item.language.toLowerCase().includes(query)) ||
                             (item.createdAt && item.createdAt.toLowerCase().includes(query));

        return matchesLang && (query === "" || summaryMatch);
    });

    renderHistoryTable(filtered);
}

function openDeleteModal(id) {
    targetReviewIdToDelete = id;
    if (deleteModalInstance) {
        deleteModalInstance.show();
    }
}

async function executeDeleteReview() {
    if (!targetReviewIdToDelete) return;

    const confirmBtn = document.getElementById("confirmDeleteBtn");
    const spinner = document.getElementById("deleteSpinner");

    confirmBtn.disabled = true;
    spinner.classList.remove("d-none");

    try {
        const response = await fetch(`${BASE_REVIEW_URL}/${encodeURIComponent(targetReviewIdToDelete)}`, {
            method: "DELETE"
        });

        if (response.ok) {
            allReviews = allReviews.filter(r => r.id !== targetReviewIdToDelete);
            applyFilters();
            deleteModalInstance.hide();
            showToast("Review record deleted successfully.", "success");
        } else {
            showToast("Failed to delete review record.", "danger");
        }
    } catch (e) {
        showToast("Error connecting to server to delete review.", "danger");
    } finally {
        confirmBtn.disabled = false;
        spinner.classList.add("d-none");
        targetReviewIdToDelete = null;
    }
}

function getScoreBadgeClass(score) {
    if (score >= 80) return "bg-success-subtle text-success border border-success";
    if (score >= 50) return "bg-warning-subtle text-warning border border-warning";
    return "bg-danger-subtle text-danger border border-danger";
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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