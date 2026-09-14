const API_URL = "http://localhost:8080/user/changePassword";
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,16}$/;

document.addEventListener("DOMContentLoaded", function () {

    const email = sessionStorage.getItem("resetEmail");

    if (!email) {
        window.location.href = "forgotpassword.html";
        return;
    }

    const emailInput = document.getElementById("email");
    if (emailInput) {
        emailInput.value = email;
    }

    const confirmPassword = document.getElementById("confirmPassword");

    ["paste", "copy", "cut", "drop", "dragover"].forEach(eventType => {
        confirmPassword.addEventListener(eventType, function (e) {
            e.preventDefault();
            document.getElementById("confirmPasswordError").innerHTML =
                "Please type the confirmation password manually.";
        });
    });

    document.getElementById("password").addEventListener("input", validatePassword);
    document.getElementById("confirmPassword").addEventListener("input", validateConfirmPassword);

    document.getElementById("togglePassword").addEventListener("click", function () {
        togglePassword("password", this);
    });

    document.getElementById("toggleConfirmPassword").addEventListener("click", function () {
        togglePassword("confirmPassword", this);
    });

    document.getElementById("resetPasswordForm").addEventListener("submit", function (e) {
        e.preventDefault();
        if (validateForm()) {
            resetPassword();
        }
    });

});

function togglePassword(id, button) {
    const input = document.getElementById(id);
    const icon = button.querySelector("i");

    if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash";
    } else {
        input.type = "password";
        icon.className = "bi bi-eye";
    }
}

function validatePassword() {
    const password = document.getElementById("password").value;
    const input = document.getElementById("password");
    const error = document.getElementById("passwordError");

    updateRule("lengthRule", password.length >= 8 && password.length <= 16);
    updateRule("letterRule", /[A-Za-z]/.test(password));
    updateRule("numberRule", /\d/.test(password));
    updateRule("specialRule", /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password));
    updateStrength(password);

    if (password === "") {
        input.classList.remove("is-valid", "is-invalid");
        error.innerHTML = "";
        return false;
    }

    if (!PASSWORD_REGEX.test(password)) {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
        error.innerHTML = "Password does not meet the required criteria.";
        return false;
    }

    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    error.innerHTML = "";
    validateConfirmPassword();
    return true;
}

function validateConfirmPassword() {
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;
    const input = document.getElementById("confirmPassword");
    const error = document.getElementById("confirmPasswordError");

    if (confirm === "") {
        input.classList.remove("is-valid", "is-invalid");
        error.innerHTML = "";
        return false;
    }

    if (password !== confirm) {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
        error.innerHTML = "Passwords do not match.";
        return false;
    }

    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    error.innerHTML = "";
    return true;
}

function validateForm() {
    return validatePassword() && validateConfirmPassword();
}

function updateRule(id, valid) {
    const item = document.getElementById(id);
    if (valid) {
        item.style.color = "#198754";
        item.innerHTML = "✔ " + item.innerHTML.replace(/^✔ |^✖ /, "");
    } else {
        item.style.color = "#dc3545";
        item.innerHTML = "✖ " + item.innerHTML.replace(/^✔ |^✖ /, "");
    }
}

function updateStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Za-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score++;

    const bar = document.getElementById("strengthBar");
    const text = document.getElementById("strengthText");

    if (score <= 1) {
        bar.style.width = "25%";
        bar.className = "progress-bar bg-danger";
        text.innerHTML = "Weak";
    } else if (score === 2) {
        bar.style.width = "50%";
        bar.className = "progress-bar bg-warning";
        text.innerHTML = "Medium";
    } else if (score === 3) {
        bar.style.width = "75%";
        bar.className = "progress-bar bg-info";
        text.innerHTML = "Good";
    } else {
        bar.style.width = "100%";
        bar.className = "progress-bar bg-success";
        text.innerHTML = "Strong";
    }
}

async function resetPassword() {
    const spinner = document.getElementById("spinner");
    const button = document.getElementById("resetBtn");
    const message = document.getElementById("message");

    spinner.classList.remove("d-none");
    button.disabled = true;
    message.innerHTML = "";

    const request = {
        email: sessionStorage.getItem("resetEmail"),
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        const result = await response.json();

        if (result.code === 200) {
            message.innerHTML =
                `<div class="alert alert-success">
                    Password updated successfully.<br>
                    Redirecting to Login...
                </div>`;

            sessionStorage.removeItem("resetEmail");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            message.innerHTML =
                `<div class="alert alert-danger">
                    Failed to update password. Please try again.
                </div>`;
        }
    } catch (error) {
        console.error(error);
        message.innerHTML =
            `<div class="alert alert-danger">
                Unable to connect to the server. Please try again later.
            </div>`;
    } finally {
        spinner.classList.add("d-none");
        button.disabled = false;
    }
}