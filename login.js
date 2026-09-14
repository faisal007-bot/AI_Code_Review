const API_URL = "http://localhost:8080/user/login";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener("DOMContentLoaded", function () {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const form = document.getElementById("loginForm");
    const message = document.getElementById("message");
    const togglePassword = document.getElementById("togglePassword");

    if (togglePassword) {
        togglePassword.addEventListener("click", function () {
            const isPassword = password.type === "password";
            password.type = isPassword ? "text" : "password";

            const icon = this.querySelector("i");
            if (icon) {
                icon.classList.toggle("bi-eye");
                icon.classList.toggle("bi-eye-slash");
            }
        });
    }

    email.addEventListener("input", function () {
        validateEmail();
        message.innerHTML = "";
    });

    password.addEventListener("input", function () {
        validatePassword();
        message.innerHTML = "";
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        login();
    });
});

function validateEmail() {
    const email = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const val = email.value.trim();

    if (val === "") {
        email.classList.add("is-invalid");
        email.classList.remove("is-valid");
        if (emailError) emailError.textContent = "Please enter your email address.";
        return false;
    } else if (!EMAIL_REGEX.test(val)) {
        email.classList.add("is-invalid");
        email.classList.remove("is-valid");
        if (emailError) emailError.textContent = "Enter a valid email address.";
        return false;
    } else {
        email.classList.remove("is-invalid");
        email.classList.add("is-valid");
        if (emailError) emailError.textContent = "";
        return true;
    }
}

function validatePassword() {
    const password = document.getElementById("password");
    const passwordError = document.getElementById("passwordError");
    const val = password.value;

    if (val.trim() === "") {
        password.classList.add("is-invalid");
        password.classList.remove("is-valid");
        if (passwordError) passwordError.textContent = "Please enter your password.";
        return false;
    } else {
        password.classList.remove("is-invalid");
        password.classList.add("is-valid");
        if (passwordError) passwordError.textContent = "";
        return true;
    }
}

async function login() {
    const spinner = document.getElementById("spinner");
    const btn = document.getElementById("loginBtn");
    const message = document.getElementById("message");

    spinner.classList.remove("d-none");
    btn.disabled = true;
    message.innerHTML = "";

    const userEmail = document.getElementById("email").value.trim();

    const request = {
        email: userEmail,
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

        switch (result.code) {
            case 200:
                const userObj = result.dataObject || {};
                sessionStorage.setItem("userEmail", userObj.email || userEmail);
                sessionStorage.setItem("userName", userObj.name || "Developer");
                sessionStorage.setItem("userContact", userObj.contact || "");
                sessionStorage.setItem("userRole", userObj.role || "USER");
                if (userObj.createdTime) {
                    sessionStorage.setItem("userJoinedDate", userObj.createdTime);
                }
                message.innerHTML =
                    `<div class="alert alert-success">
                        <strong>Login successful!</strong> Redirecting...
                    </div>`;

                document.getElementById("loginForm").reset();

                setTimeout(() => {
                    if (result.dataObject.role === "ADMIN") {
                        window.location.href = "admin-dashboard.html";
                    } else {
                        window.location.href = "user-dashboard.html";
                    }
                }, 1200);
                break;

            case 401:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Invalid Email.
                    </div>`;
                break;
            case 31:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Invalid Password.
                    </div>`;
                break;

            default:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        ${result.message || "Unable to process your request. Please try again."}
                    </div>`;
        }
    } catch (error) {
        console.error("Login Error:", error);
        message.innerHTML =
            `<div class="alert alert-danger">
                Unable to connect to the server. Please try again later.
            </div>`;
    } finally {
        spinner.classList.add("d-none");
        btn.disabled = false;
    }
}