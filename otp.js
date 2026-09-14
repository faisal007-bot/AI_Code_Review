const API_URL = "http://localhost:8080/user/validateotp";

const email = sessionStorage.getItem("signupEmail");

if (!email) {
    window.location.href = "signup.html";
}

const hiddenEmailInput = document.getElementById("email") || document.getElementById("userId");
if (hiddenEmailInput) {
    hiddenEmailInput.value = email;
}

const inputs = document.querySelectorAll(".otp-input");
const form = document.getElementById("otpForm");
const message = document.getElementById("message");

inputs.forEach((input, index) => {
    input.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
        message.innerHTML = "";

        if (this.value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", function (e) {
        if (e.key === "Backspace" && this.value === "" && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

inputs[0].addEventListener("paste", function (e) {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "");

    if (paste.length === 6) {
        inputs.forEach((box, i) => {
            box.value = paste[i];
        });
    }
});

form.addEventListener("submit", function (e) {
    e.preventDefault();
    verifyOTP();
});

async function verifyOTP() {
    const spinner = document.getElementById("spinner");
    const btn = document.getElementById("verifyBtn");
    const otp = [...inputs].map(i => i.value).join("");

    if (otp.length !== 6) {
        message.innerHTML =
            `<div class="alert alert-danger">
                Please enter the complete 6-digit OTP.
            </div>`;
        return;
    }

    spinner.classList.remove("d-none");
    btn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                OTP: otp
            })
        });

        const result = await response.json();

        switch (result.code) {
            case 200:
                message.innerHTML =
                    `<div class="alert alert-success">
                        OTP verified successfully. Redirecting...
                    </div>`;

                setTimeout(() => {
                    window.location.href = "createpassword.html";
                }, 1500);
                break;

            case 502:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Invalid OTP.
                    </div>`;
                inputs.forEach(i => i.value = "");
                inputs[0].focus();
                break;

            case 1999:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        OTP not found. Redirecting to SignUp...
                    </div>`;
                sessionStorage.removeItem("signupEmail");

                setTimeout(() => {
                    window.location.href = "signup.html";
                }, 2000);
                break;

            case 301:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Maximum retry limit reached. Redirecting to signup...
                    </div>`;

                sessionStorage.removeItem("signupEmail");

                setTimeout(() => {
                    window.location.href = "signup.html";
                }, 2000);
                break;

            default:
                message.innerHTML =
                    `<div class="alert alert-danger">
                        Something went wrong.
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
        btn.disabled = false;
    }
}