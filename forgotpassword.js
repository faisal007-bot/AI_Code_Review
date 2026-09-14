const API_URL = "http://localhost:8080/user/forgotPassword";

document.addEventListener("DOMContentLoaded", function () {

    const email = document.getElementById("email");
    const form = document.getElementById("forgotPasswordForm");

    email.addEventListener("input", validateEmail);

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        if (validateForm()) {

            forgotPassword();

        }

    });

});

function validateEmail() {

    const email = document.getElementById("email");

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const valid = regex.test(email.value.trim());

    toggleValidation(email, valid);

    return valid;

}

function toggleValidation(element, valid) {

    if (element.value.trim() === "") {

        element.classList.remove("is-valid");
        element.classList.remove("is-invalid");

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

function validateForm() {

    return validateEmail();

}

async function forgotPassword() {

    const spinner = document.getElementById("spinner");
    const button = document.getElementById("forgotPasswordBtn");
    const message = document.getElementById("message");

    spinner.classList.remove("d-none");
    button.disabled = true;
    message.innerHTML = "";

    const request = {

        email: document.getElementById("email").value.trim()

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

                sessionStorage.setItem("resetEmail", request.email);

                message.innerHTML =
                    `<div class="alert alert-success">
                        <strong>OTP Sent Successfully!</strong><br>
                        Please check your registered email.<br>
                        Redirecting...
                    </div>`;

                setTimeout(() => {

                    window.location.href = "forgotpassword-otp.html";

                }, 1500);

                break;

            case 199:

                message.innerHTML =
                    `<div class="alert alert-danger">
                        This email address is not registered.
                    </div>`;

                document.getElementById("email").focus();

                break;

            default:

                message.innerHTML =
                    `<div class="alert alert-danger">
                        Unable to process your request.
                    </div>`;

        }

    }
    catch (error) {

        console.error(error);

        message.innerHTML =
            `<div class="alert alert-danger">
                Unable to connect to the server. Please try again later.
            </div>`;

    }
    finally {

        spinner.classList.add("d-none");
        button.disabled = false;

    }

}