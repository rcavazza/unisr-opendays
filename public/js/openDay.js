document.addEventListener("DOMContentLoaded", (event) => {
  const registrationForm = document.getElementById("emailForm");
  const emailInput = document.getElementById("email");
  if (registrationForm) {
    registrationForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const userEmail = emailInput.value.replace(/\s/g, "");
      const validEmail = isValidEmail(userEmail);
      const validUnisrEmail = userEmail.endsWith("@studenti.unisr.it");
      const error1 = document.getElementById("error1");
      const error2 = document.getElementById("error2");
      error1.classList.remove("visible");
      error2.classList.remove("visible");
      if (validEmail && validUnisrEmail) {
        localStorage.setItem("email", emailInput.value);
        registrationForm.submit();
      } else {
        if (!validEmail) {
          error1.classList.add("visible");
        } else if (!validUnisrEmail) {
          error2.classList.add("visible");
        }
      }
    });
  }

  if (emailInput) {
    emailInput.value = localStorage.getItem("email");
  }

  // Function to validate email address
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});
