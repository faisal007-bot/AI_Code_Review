let deleteModalInstance = null;
let targetReviewIdToDelete = null;
const userEmail = sessionStorage.getItem("userEmail") || "test@test.com";

document.addEventListener("DOMContentLoaded", function () {
    const navEmail = document.getElementById("navUserEmail");
    if (navEmail) {
        navEmail.textContent = userEmail;
    }

    const storedName = sessionStorage.getItem("userName");
    const welcomeNameSpan = document.getElementById("welcomeUserName");
    if (storedName && welcomeNameSpan) {
        welcomeNameSpan.textContent = storedName.split(" ")[0];
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

    const modalEl = document.getElementById("deleteConfirmModal");
    if (modalEl) {
        deleteModalInstance = new bootstrap.Modal(modalEl);
    }

    const confirmBtn = document.getElementById("confirmDeleteBtn");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", executeDeleteReview);
    }

    loadDashboardMetrics(userEmail);
    loadDashboardData(userEmail);
});

async function loadDashboardMetrics(email) {
    try {
        const response = await fetch(`http://localhost:8080/review/metrics?email=${encodeURIComponent(email)}`);
        if (response.ok) {
            const result = await response.json();
            const data = result.dataObject;
            
            if (data) {
                document.getElementById("totalReviewsCount").textContent = data.totalReviews ?? 0;
                document.getElementById("avgQualityScore").textContent = data.avgQualityScore ? `${data.avgQualityScore} / 100` : "-- / 100";
                document.getElementById("issuesResolvedCount").textContent = data.issuesResolved ?? 0;
            }
        }
    } catch (err) {
        console.error("Failed to load metrics:", err);
    }
}

async function loadDashboardData(email) {
    try {
        const response = await fetch(`http://localhost:8080/review/history?email=${encodeURIComponent(email)}&limit=5`);

        if (response.ok) {
            const result = await response.json();
            renderRecentTable(result.dataObject || []);
        } else {
            renderEmptyTable();
        }
    } catch (err) {
        renderEmptyTable();
    }
}

function renderRecentTable(reviews) {
    const tbody = document.getElementById("recentReviewsTbody");
    if (!reviews || reviews.length === 0) {
        renderEmptyTable();
        return;
    }

    tbody.innerHTML = reviews.map(item => `
        <tr>
            <td class="ps-4">
                <span class="badge bg-secondary-subtle text-secondary border px-2 py-1 font-monospace shadow-sm">
                    ${item.language || "Code"}
                </span>
            </td>
            <td class="text-muted small fw-medium">
                <i class="bi bi-clock me-1"></i>${item.createdAt || 'Just now'}
            </td>
            <td>
                <span class="badge ${getScoreBadgeClass(item.qualityScore)} badge-score shadow-sm">
                    ${item.qualityScore}/100
                </span>
            </td>
            <td class="text-end pe-4">
                <div class="btn-group shadow-sm rounded-3">
                    <a href="review-report.html?id=${item.id}" class="btn btn-sm btn-outline-primary fw-bold">
                        <i class="bi bi-eye"></i> Report
                    </a>
                    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="openDeleteModal('${item.id}', event)">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderEmptyTable() {
    const tbody = document.getElementById("recentReviewsTbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5 text-muted bg-white rounded-4 shadow-sm">
                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    No code reviews submitted yet. Click <strong>"New Code Review"</strong> to get started!
                </td>
            </tr>
        `;
    }
}

function openDeleteModal(id, event) {
    if (event) {
        event.stopPropagation();
    }
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
        const response = await fetch(`http://localhost:8080/review/${encodeURIComponent(targetReviewIdToDelete)}`, {
            method: "DELETE"
        });

        if (response.ok) {
            deleteModalInstance.hide();
            showToast("Review deleted successfully.", "success");
            
            loadDashboardData(userEmail);
            loadDashboardMetrics(userEmail);
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