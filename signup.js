const API_URL = "http://localhost:8080/user/signup";
const NAME_REGEX = /^[A-Za-z ]{3,50}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_REGEX = /^\d{10}$/;

document.addEventListener("DOMContentLoaded", function () {

    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const contact = document.getElementById("contact");
    const form = document.getElementById("signupForm");
    const message = document.getElementById("message");

    name.addEventListener("input", function () {
        validateName();
        message.innerHTML = "";
    });

    email.addEventListener("input", function () {
        validateEmail();
        message.innerHTML = "";
    });

    contact.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
        validateContact();
        message.innerHTML = "";
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        signup();
    });

});

function toggleValidation(element, valid) {
    if (element.value.trim() === "") {
        element.classList.remove("is-valid", "is-invalid");
        return;
    }

    if (valid) {
        element.classList.add("is-valid");
        element.classList.remove("is-invalid");
    } else {
        element.classList.add("is-invalid");
        element.classList.remove("is-valid");
    }
}

function validateName() {
    const name = document.getElementById("name");
    const valid = NAME_REGEX.test(name.value.trim());
    toggleValidation(name, valid);
    return valid;
}

function validateEmail() {
    const email = document.getElementById("email");
    const valid = EMAIL_REGEX.test(email.value.trim());
    toggleValidation(email, valid);
    return valid;
}

function validateContact() {
    const contact = document.getElementById("contact");
    const valid = CONTACT_REGEX.test(contact.value.trim());
    toggleValidation(contact, valid);
    return valid;
}

function validateForm() {
    return validateName() && validateEmail() && validateContact();
}

function resetValidation() {
    document.querySelectorAll(".form-control").forEach(input => {
        input.classList.remove("is-valid", "is-invalid");
    });
}

async function signup() {
    const spinner = document.getElementById("spinner");
    const btn = document.getElementById("signupBtn");
    const message = document.getElementById("message");

    spinner.classList.remove("d-none");
    btn.disabled = true;
    message.innerHTML = "";

    const userEmail = document.getElementById("email").value.trim();

    const request = {
        name: document.getElementById("name").value.trim(),
        email: userEmail,
        contact: document.getElementById("contact").value.trim(),
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
                sessionStorage.setItem("signupEmail", userEmail);

                message.innerHTML =
                    `<div class="alert alert-success">
                        <strong>Account created successfully!</strong><br>
                        An OTP has been sent to your registered email.<br>
                        Redirecting to OTP Verification...
                    </div>`;

                document.getElementById("signupForm").reset();
                resetValidation();

                setTimeout(() => {
                    window.location.href = "validate-otp.html";
                }, 1500);

                break;

            case 30:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Email is already registered.
                    </div>`;

                const email = document.getElementById("email");
                email.focus();
                email.select();
                break;

            default:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Unable to process your request. Please try again.
                    </div>`;
        }
    }
    catch (error) {
        console.error("Signup Error :", error);
        message.innerHTML =
            `<div class="alert alert-danger">
                Unable to connect to the server. Please try again later.
            </div>`;
    }
    finally {
        spinner.classList.add("d-none");
        btn.disabled = false;
    }
}