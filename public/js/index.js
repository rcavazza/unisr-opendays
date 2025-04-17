document.addEventListener("touchstart", function () {}, true);

document.addEventListener("DOMContentLoaded", (event) => {
  let currentUrl = window.location.href;

  let itPattern = /\/it\//;
  let enPattern = /\/en\//;

  let newUrl;

  if (itPattern.test(currentUrl)) {
    newUrl = currentUrl.replace(itPattern, "/en/");
    langFlag = "en";
  } else if (enPattern.test(currentUrl)) {
    newUrl = currentUrl.replace(enPattern, "/it/");
    langFlag = "it";
  } else {
    return;
  }

  const switchLang = document.createElement("a");
  switchLang.href = newUrl;
  switchLang.classList.add("switchLang");
  const langImg = document.createElement("img");
  langImg.src = "/images/" + langFlag + ".png";
  langImg.alt = "Language";
  switchLang.appendChild(langImg);
  document.body.appendChild(switchLang);

  function initOverlayMenu() {
    let icon = document.getElementById("icon");
    let icon1 = document.getElementById("a");
    let icon2 = document.getElementById("b");
    let icon3 = document.getElementById("c");
    let overlayMenuBackground = document.querySelector(
      ".overlayMenuBackground"
    );
    let overlayMenu = document.querySelector(".overlayMenu");
    const opendayButton = document.getElementById("openday");
    const mapButton = document.getElementById("map");
    const timetableButton = document.getElementById("timetable");
    // add active class if in the url there is the page name
    if (currentUrl.includes("openday")) {
      opendayButton.classList.add("active");
    } else if (currentUrl.includes("map")) {
      mapButton.classList.add("active");
    } else if (currentUrl.includes("timetable")) {
      timetableButton.classList.add("active");
    }

    function toggleMenu() {
      icon1.classList.toggle("a");
      icon2.classList.toggle("c");
      icon3.classList.toggle("b");
      console.log(document);
      overlayMenu.classList.toggle("open");
      overlayMenuBackground.classList.toggle("show");
    }

    if (overlayMenu) {
      overlayMenuBackground.addEventListener("click", function () {
        toggleMenu();
      });
      icon.addEventListener("click", function () {
        toggleMenu();
      });
    }
  }

  initOverlayMenu();
});
