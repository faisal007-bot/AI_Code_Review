const PROFILE_API_URL = "http://localhost:8080/user/profile";
let base64ProfilePhoto = null;

document.addEventListener("DOMContentLoaded", function () {
    const userEmail = sessionStorage.getItem("userEmail");
    
    const navEmail = document.getElementById("navUserEmail");
    if (navEmail) navEmail.textContent = userEmail || "user@platform.com";

    setupDobAutoFormat();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.clear();
            window.location.href = "login.html";
        });
    }

    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
        profileForm.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!validateForm()) return;
            saveUserProfileToDatabase();
        });
    }

    document.querySelectorAll("#primaryLangWrapper .custom-profile-item").forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const val = this.getAttribute("data-value");
            setPrimaryLanguageUI(val);
        });
    });

    document.querySelectorAll("#experienceWrapper .custom-profile-item").forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const val = this.getAttribute("data-value");
            setExperienceLevelUI(val);
        });
    });

    const avatarContainer = document.getElementById("avatarContainer");
    const photoInput = document.getElementById("profilePhotoInput");

    if (avatarContainer && photoInput) {
        avatarContainer.addEventListener("click", () => photoInput.click());
        photoInput.addEventListener("change", handlePhotoUpload);
    }

    fetchSavedProfile(userEmail || "test@test.com");
});

function setPrimaryLanguageUI(val) {
    if (!val) val = "Java";
    const hiddenInput = document.getElementById("primaryLanguage");
    if (hiddenInput) hiddenInput.value = val;

    document.querySelectorAll("#primaryLangWrapper .custom-profile-item").forEach(i => {
        i.classList.toggle("active-item", i.getAttribute("data-value") === val);
    });

    const iconMap = {
        "Java": '<i class="bi bi-filetype-java me-2 text-primary"></i>',
        "Python": '<i class="bi bi-filetype-py me-2 text-warning"></i>',
        "C++": '<i class="bi bi-filetype-raw me-2 text-secondary"></i>'
    };
    
    const displayEl = document.getElementById("selectedPrimaryLang");
    if (displayEl) {
        displayEl.innerHTML = `${iconMap[val] || '<i class="bi bi-code-slash me-2"></i>'}${val}`;
    }
}

function setExperienceLevelUI(val) {
    if (!val) val = "Student";
    const hiddenInput = document.getElementById("experienceLevel");
    if (hiddenInput) hiddenInput.value = val;

    document.querySelectorAll("#experienceWrapper .custom-profile-item").forEach(i => {
        i.classList.toggle("active-item", i.getAttribute("data-value") === val);
    });

    const iconMap = {
        "Student": '<i class="bi bi-mortarboard me-2 text-teal"></i>',
        "Intermediate": '<i class="bi bi-code-slash me-2 text-primary"></i>',
        "Professional": '<i class="bi bi-award me-2 text-warning"></i>'
    };
    const labelMap = {
        "Student": "Student",
        "Intermediate": "Intermediate Developer",
        "Professional": "Professional Engineer"
    };
    
    const displayEl = document.getElementById("selectedExperience");
    if (displayEl) {
        displayEl.innerHTML = `${iconMap[val] || '<i class="bi bi-person-badge me-2"></i>'}${labelMap[val] || val}`;
    }
}

async function fetchSavedProfile(email) {
    try {
        const response = await fetch(`${PROFILE_API_URL}?email=${encodeURIComponent(email)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.code === 200 && result.dataObject) {
                populateFormWithDatabaseData(result.dataObject);
                return;
            }
        }
        populateFallbackFromSession();
    } catch (err) {
        console.warn("Could not reach backend; loading initial session data:", err);
        populateFallbackFromSession();
    }
}

function populateFormWithDatabaseData(data) {
    document.getElementById("summaryName").textContent = data.name || "Developer";
    document.getElementById("summaryEmail").textContent = data.email || "";
    document.getElementById("summaryRole").textContent = data.role || sessionStorage.getItem("userRole") || "USER";
    document.getElementById("summaryPrimaryLang").textContent = data.primaryLanguage || "Java";
    base64ProfilePhoto = data.profilePhoto || null;
    setProfileImageUI(base64ProfilePhoto);

    const joinedElement = document.getElementById("summaryJoinedDate");
    const sessionJoined = sessionStorage.getItem("userJoinedDate") || "--";

    if (joinedElement) {
        if (sessionJoined !== "--") {
            joinedElement.textContent = sessionJoined.includes(" ")
                ? sessionJoined.split(" ")[0]
                : sessionJoined.substring(0, 10);
        } else {
            joinedElement.textContent = "--";
        }
    }

    document.getElementById("name").value = data.name || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("contact").value = data.contact || "";
    if (data.dob) {
        document.getElementById("dob").value = data.dob;
    }

    document.getElementById("institution").value = data.institution || "";
    document.getElementById("course").value = data.course || "";

    setPrimaryLanguageUI(data.primaryLanguage || "Java");
    setExperienceLevelUI(data.experienceLevel || "Student");

    document.getElementById("githubUrl").value = data.githubUrl || "";

    sessionStorage.setItem("userName", data.name);
    sessionStorage.setItem("userContact", data.contact);
}

function populateFallbackFromSession() {
    const name = sessionStorage.getItem("userName") || "";
    const email = sessionStorage.getItem("userEmail") || "";
    const contact = sessionStorage.getItem("userContact") || "";
    const role = sessionStorage.getItem("userRole") || "USER";
    const joined = sessionStorage.getItem("userJoinedDate") || "--";
    base64ProfilePhoto = null;
    setProfileImageUI(null);

    document.getElementById("summaryName").textContent = name || "Developer";
    document.getElementById("summaryEmail").textContent = email;
    document.getElementById("summaryRole").textContent = role;

    const joinedElement = document.getElementById("summaryJoinedDate");
    if (joinedElement) {
        joinedElement.textContent = joined !== "--" && joined.includes(" ") ? joined.split(" ")[0] : joined;
    }

    document.getElementById("name").value = name;
    document.getElementById("email").value = email;
    document.getElementById("contact").value = contact;

    setPrimaryLanguageUI("Java");
    setExperienceLevelUI("Student");
}

async function saveUserProfileToDatabase() {
    const spinner = document.getElementById("saveSpinner");
    const saveBtn = document.getElementById("saveProfileBtn");

    spinner.classList.remove("d-none");
    saveBtn.disabled = true;

    const dobValue = document.getElementById("dob").value.trim();

    const payload = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        dob: dobValue,
        role: sessionStorage.getItem("userRole") || "USER",
        institution: document.getElementById("institution").value.trim(),
        course: document.getElementById("course").value.trim(),
        primaryLanguage: document.getElementById("primaryLanguage").value,
        experienceLevel: document.getElementById("experienceLevel").value,
        githubUrl: document.getElementById("githubUrl").value.trim(),
        profilePhoto: base64ProfilePhoto
    };

    try {
        const response = await fetch(PROFILE_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.code === 200) {
            showAlert("Profile saved successfully!", "success");

            sessionStorage.setItem("userName", payload.name);
            sessionStorage.setItem("userContact", payload.contact);
            document.getElementById("summaryName").textContent = payload.name;
            document.getElementById("summaryPrimaryLang").textContent = payload.primaryLanguage;
        } else {
            showAlert(result.message || "Failed to save profile.", "danger");
        }
    } catch (err) {
        showAlert("Server connection failed. Could not save profile.", "danger");
    } finally {
        spinner.classList.add("d-none");
        saveBtn.disabled = false;
    }
}

function setupDobAutoFormat() {
    const dobInput = document.getElementById("dob");
    if (!dobInput) return;

    dobInput.addEventListener("input", function () {
        let val = this.value.replace(/\D/g, "");
        if (val.length > 2 && val.length <= 4) {
            this.value = val.slice(0, 2) + "/" + val.slice(2);
        } else if (val.length > 4) {
            this.value = val.slice(0, 2) + "/" + val.slice(2, 4) + "/" + val.slice(4, 8);
        } else {
            this.value = val;
        }
    });
}

function validateForm() {
    const nameInput = document.getElementById("name");
    const contactInput = document.getElementById("contact");
    const dobInput = document.getElementById("dob");

    const contactRegex = /^[0-9]{10}$/;
    const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    let isValid = true;

    if (!nameInput.value.trim()) {
        nameInput.classList.add("is-invalid");
        isValid = false;
    } else {
        nameInput.classList.remove("is-invalid");
    }

    if (!contactRegex.test(contactInput.value.trim())) {
        contactInput.classList.add("is-invalid");
        isValid = false;
    } else {
        contactInput.classList.remove("is-invalid");
    }

    const dobVal = dobInput.value.trim();
    if (dobVal && !dobRegex.test(dobVal)) {
        dobInput.classList.add("is-invalid");
        isValid = false;
    } else {
        dobInput.classList.remove("is-invalid");
    }

    return isValid;
}

function showAlert(message, type = "success") {
    const toastEl = document.getElementById("profileToast");
    const toastBody = document.getElementById("toastMessage");

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

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showAlert("Image size must be less than 2MB.", "danger");
        event.target.value = ""; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        base64ProfilePhoto = e.target.result;
        setProfileImageUI(base64ProfilePhoto);
        event.target.value = ""; 
    };
    reader.readAsDataURL(file);
}

function setProfileImageUI(base64Str) {
    const icon = document.getElementById("defaultAvatarIcon");
    const img = document.getElementById("profileImagePreview");

    if (base64Str) {
        icon.classList.add("d-none");
        img.src = base64Str;
        img.classList.remove("d-none");
    } else {
        icon.classList.remove("d-none");
        img.src = "";
        img.classList.add("d-none");
    }
}