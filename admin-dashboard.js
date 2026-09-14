const BASE_USER_URL = "http://localhost:8080/user";
const BASE_ADMIN_URL = "http://localhost:8080/admin";

let allUsers = [];
let allReviews = [];
let adminModalInstance = null;
let pendingAction = null;

document.addEventListener("DOMContentLoaded", () => {
    const userRole = sessionStorage.getItem("userRole") || "ADMIN";
    const userEmail = sessionStorage.getItem("userEmail") || "admin@platform.com";
    
    if (!sessionStorage.getItem("userEmail")) {
        sessionStorage.setItem("userEmail", "admin@platform.com");
    }
    
    if (!userEmail) {
        window.location.href = "login.html";
        return;
    }
    if (userRole !== "ADMIN") {
        showAdminToast("Access Denied: Administrator permissions required.", "danger");
        setTimeout(() => {
            window.location.href = "user-dashboard.html";
        }, 1500);
        return;
    }

    const emailEl = document.getElementById("adminNavEmail");
    if (emailEl) emailEl.textContent = userEmail;

    // 2. Sign Out
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

    const modalEl = document.getElementById("adminActionModal");
    if (modalEl) {
        adminModalInstance = new bootstrap.Modal(modalEl);
    }

    document.getElementById("confirmModalBtn").addEventListener("click", handleModalActionExecute);

    document.getElementById("userSearchInput").addEventListener("input", filterUsers);
    document.getElementById("reviewSearchInput").addEventListener("input", filterReviews);

    // 5. Refresh Button
    document.getElementById("refreshMetricsBtn").addEventListener("click", () => {
        loadDashboard();
        showAdminToast("Dashboard metrics refreshed.", "success");
    });
    loadDashboard();
});

async function loadDashboard() {
    await Promise.all([
        fetchPlatformMetrics(),
        fetchAllUsers(),
        fetchAllReviews()
    ]);
}

async function fetchPlatformMetrics() {
    try {
        const response = await fetch(`${BASE_ADMIN_URL}/review`);
        if (response.ok) {
            const result = await response.json();
            const data = result.dataObject;
            if (data) {
                document.getElementById("totalGlobalReviewsCount").textContent = data.totalReviews ?? 0;
                document.getElementById("platformAvgScore").textContent = data.avgQualityScore ? `${data.avgQualityScore}/100` : "-- / 100";
            }
        }
    } catch (e) {
        console.warn("Metrics endpoint unreachable:", e);
    }
}

async function fetchAllUsers() {
    try {
        const response = await fetch(`${BASE_USER_URL}/all`);
        if (response.ok) {
            const result = await response.json();
            allUsers = result.dataObject || [];
            document.getElementById("totalUsersCount").textContent = allUsers.length;
            renderUserTable(allUsers);
        } else {
            renderEmptyUsers("No registered accounts found.");
        }
    } catch (err) {
        allUsers = [
            {
                name: sessionStorage.getItem("userName") || "Admin User",
                email: sessionStorage.getItem("userEmail") || "admin@platform.com",
                role: "ADMIN",
                contact: "9876543210",
                primaryLanguage: "Java",
                createdTime: "12/09/2026"
            }
        ];
        document.getElementById("totalUsersCount").textContent = allUsers.length;
        renderUserTable(allUsers);
    }
}

function renderUserTable(users) {
    const tbody = document.getElementById("userTableBody");
    if (!users || users.length === 0) {
        renderEmptyUsers("No users match the search criteria.");
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td class="ps-4">
                <div class="fw-bold text-dark">${escapeHtml(u.name || "User")}</div>
                <div class="text-muted small">${escapeHtml(u.email || "")}</div>
            </td>
            <td>${escapeHtml(u.contact || "--")}</td>
            <td>
                <span class="badge ${u.role === 'ADMIN' ? 'bg-danger-subtle text-danger border border-danger' : 'bg-primary-subtle text-primary border border-primary'}">
                    ${u.role || 'USER'}
                </span>
            </td>
            <td>
                <span class="badge bg-secondary-subtle text-secondary border px-2 py-1 font-monospace">
                    ${u.primaryLanguage || 'Java'}
                </span>
            </td>
            <td class="small text-muted">${u.createdTime || '--'}</td>
            <td class="text-end pe-4">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="toggleUserRole('${u.email}', '${u.role}')" title="Toggle User/Admin">
                        <i class="bi bi-arrow-repeat"></i> Role
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="triggerDeleteUser('${u.email}')" title="Delete User">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderEmptyUsers(msg) {
    document.getElementById("userTableBody").innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-5 text-muted">
                <i class="bi bi-person-x fs-2 d-block mb-1"></i>
                ${msg}
            </td>
        </tr>
    `;
}

async function fetchAllReviews() {
    try {
        const response = await fetch(`${BASE_ADMIN_URL}/history?limit=100`);
        if (response.ok) {
            const result = await response.json();
            allReviews = result.dataObject || [];
            renderGlobalReviews(allReviews);
        } else {
            renderEmptyReviews("No reviews recorded on the platform yet.");
        }
    } catch (e) {
        renderEmptyReviews("Unable to connect to review service.");
    }
}

function renderGlobalReviews(reviews) {
    const tbody = document.getElementById("globalReviewsBody");
    if (!reviews || reviews.length === 0) {
        renderEmptyReviews("No reviews match your query.");
        return;
    }

    tbody.innerHTML = reviews.map(r => `
        <tr>
            <td class="ps-4">
                <span class="badge bg-secondary-subtle text-secondary border px-2 py-1 font-monospace">
                    ${r.language || "Code"}
                </span>
            </td>
            <td>
                <span class="badge ${r.qualityScore >= 80 ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning'}">
                    ${r.qualityScore}/100
                </span>
            </td>
            <td>
                <div class="text-truncate" style="max-width: 380px;" title="${escapeHtml(r.summary || '')}">
                    ${escapeHtml(r.summary || 'No summary available')}
                </div>
            </td>
            <td class="small text-muted"><i class="bi bi-clock me-1"></i>${r.createdAt || 'Just now'}</td>
            <td class="text-end pe-4">
                <div class="btn-group">
                    <a href="review-report.html?id=${r.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i> Report
                    </a>
                    <button class="btn btn-sm btn-outline-danger" onclick="triggerDeleteReview('${r.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderEmptyReviews(msg) {
    document.getElementById("globalReviewsBody").innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-2 d-block mb-1"></i>
                ${msg}
            </td>
        </tr>
    `;
}

function filterUsers() {
    const q = document.getElementById("userSearchInput").value.toLowerCase().trim();
    const filtered = allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
    );
    renderUserTable(filtered);
}

function filterReviews() {
    const q = document.getElementById("reviewSearchInput").value.toLowerCase().trim();
    const filtered = allReviews.filter(r => 
        (r.summary && r.summary.toLowerCase().includes(q)) || 
        (r.language && r.language.toLowerCase().includes(q))
    );
    renderGlobalReviews(filtered);
}

function triggerDeleteUser(email) {
    pendingAction = async () => {
        const res = await fetch(`${BASE_USER_URL}?email=${encodeURIComponent(email)}`, { method: "DELETE" });
        if (res.ok) {
            allUsers = allUsers.filter(u => u.email !== email);
            renderUserTable(allUsers);
            showAdminToast(`Account for ${email} deleted successfully.`, "success");
        } else {
            showAdminToast("Failed to delete user account.", "danger");
        }
    };

    document.getElementById("modalTitle").textContent = "Delete User Account";
    document.getElementById("modalPrompt").textContent = `Are you sure you want to permanently delete ${email}?`;
    document.getElementById("modalSubtext").textContent = "This will remove all account access and profile settings.";
    adminModalInstance.show();
}

function triggerDeleteReview(reviewId) {
    pendingAction = async () => {
        const res = await fetch(`${BASE_ADMIN_URL}/${encodeURIComponent(reviewId)}`, { method: "DELETE" });
        if (res.ok) {
            allReviews = allReviews.filter(r => r.id !== reviewId);
            renderGlobalReviews(allReviews);
            showAdminToast(`Review entry ${reviewId} removed.`, "success");
        } else {
            showAdminToast("Failed to delete review record.", "danger");
        }
    };

    document.getElementById("modalTitle").textContent = "Delete Review Record";
    document.getElementById("modalPrompt").textContent = `Delete review entry ${reviewId}?`;
    document.getElementById("modalSubtext").textContent = "This cannot be undone and will purge the report from the system.";
    adminModalInstance.show();
}

function toggleUserRole(email, currentRole) {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    pendingAction = async () => {
        const url = `${BASE_USER_URL}/role?email=${encodeURIComponent(email)}&role=${encodeURIComponent(newRole)}`;
        const res = await fetch(url, {
            method: "PATCH"
        });

        if (res.ok) {
            const user = allUsers.find(u => u.email === email);
            if (user) user.role = newRole;
            renderUserTable(allUsers);
            showAdminToast(`Updated ${email} role to ${newRole}.`, "success");
        } else {
            showAdminToast("Failed to update user role.", "danger");
        }
    };

    document.getElementById("modalTitle").textContent = "Modify User Role";
    document.getElementById("modalPrompt").textContent = `Switch ${email} to ${newRole}?`;
    document.getElementById("modalSubtext").textContent = "Changing user permissions takes effect immediately on their next request.";
    adminModalInstance.show();
}

async function handleModalActionExecute() {
    if (!pendingAction) return;

    const btn = document.getElementById("confirmModalBtn");
    const spinner = document.getElementById("modalSpinner");

    btn.disabled = true;
    spinner.classList.remove("d-none");

    try {
        await pendingAction();
        adminModalInstance.hide();
    } catch (e) {
        showAdminToast("An error occurred executing this operation.", "danger");
    } finally {
        btn.disabled = false;
        spinner.classList.add("d-none");
        pendingAction = null;
    }
}

function showAdminToast(message, type = "success") {
    const toastEl = document.getElementById("adminToast");
    const toastBody = document.getElementById("adminToastBody");
    if (!toastEl || !toastBody) return;

    toastEl.className = "toast align-items-center text-white custom-saas-toast border-0 mb-3";

    if (type === "success") {
        toastEl.classList.add("bg-success");
        toastBody.innerHTML = `<i class="bi bi-check-circle-fill"></i> <span>${message}</span>`;
    } else {
        toastEl.classList.add("bg-danger");
        toastBody.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> <span>${message}</span>`;
    }

    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    toast.show();
}

function escapeHtml(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}