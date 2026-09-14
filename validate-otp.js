const params = new URLSearchParams(window.location.search);
const email = params.get("email") || sessionStorage.getItem("signupEmail");

const hiddenInput = document.getElementById("email") || document.getElementById("userId");
if (hiddenInput && email) {
    hiddenInput.value = email;
}

const otpInput = document.querySelector(".otp-input");
if (otpInput && !/^\d{6}$/.test(otpInput.value)) {
    otpInput.classList.add("is-invalid");
}