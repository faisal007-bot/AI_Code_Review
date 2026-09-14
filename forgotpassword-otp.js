const API_URL = "http://localhost:8080/user/validateOTPForForgotPassword";

document.addEventListener("DOMContentLoaded", function () {

    const email = sessionStorage.getItem("resetEmail");

    if (!email) {

        window.location.href = "forgotpassword.html";
        return;

    }

    const inputs = document.querySelectorAll(".otp-input");

    inputs.forEach((input, index) => {

        input.addEventListener("input", function () {

            this.value = this.value.replace(/\D/g, "");

            if (this.value.length === 1 && index < inputs.length - 1) {

                inputs[index + 1].focus();

            }

            validateOTP();

        });

        input.addEventListener("keydown", function (e) {

            if (e.key === "Backspace" &&
                this.value === "" &&
                index > 0) {

                inputs[index - 1].focus();

            }

        });

        input.addEventListener("paste", function (e) {

            e.preventDefault();

            const pasted = e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .substring(0, 6);

            pasted.split("").forEach((digit, i) => {

                if (inputs[i]) {

                    inputs[i].value = digit;

                }

            });

            if (pasted.length > 0) {

                inputs[Math.min(pasted.length - 1, 5)].focus();

            }

            validateOTP();

        });

    });

    document.getElementById("otpForm")
        .addEventListener("submit", function (e) {

            e.preventDefault();

            if (validateOTP()) {

                validateOTPFromServer();

            }

        });

});

function validateOTP() {

    const inputs = document.querySelectorAll(".otp-input");

    const otp = Array.from(inputs)
        .map(input => input.value)
        .join("");

    const error = document.getElementById("otpError");

    if (otp.length !== 6) {

        error.innerHTML = "Please enter the 6-digit OTP.";

        return false;

    }

    error.innerHTML = "";

    return true;

}

async function validateOTPFromServer() {

    const spinner = document.getElementById("spinner");
    const button = document.getElementById("verifyBtn");
    const message = document.getElementById("message");

    spinner.classList.remove("d-none");

    button.disabled = true;

    message.innerHTML = "";

    const otp = Array.from(document.querySelectorAll(".otp-input"))
        .map(input => input.value)
        .join("");

    const request = {

        email: sessionStorage.getItem("resetEmail"),

        OTP: otp

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

                message.innerHTML =
                    `<div class="alert alert-success">
                        OTP verified successfully.<br>
                        Redirecting...
                    </div>`;

                setTimeout(() => {

                    window.location.href = "resetpassword.html";

                }, 1500);

                break;

            case 199:

                message.innerHTML =
                    `<div class="alert alert-danger">
                        Invalid OTP. Please try again.
                    </div>`;

                document.querySelectorAll(".otp-input")
                    .forEach(input => input.value = "");

                document.querySelector(".otp-input").focus();

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