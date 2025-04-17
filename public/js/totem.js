function onInactive(seconds, cb) {
  let ms = seconds * 1000;
  let wait = setTimeout(cb, ms);

  const resetTimer = () => {
    clearTimeout(wait);
    wait = setTimeout(cb, ms);
  };

  const events = [
    "mousemove",
    "click",
    "mouseup",
    "mousedown",
    "keydown",
    "keypress",
    "keyup",
    "submit",
    "change",
    "mouseenter",
    "scroll",
    "resize",
    "dblclick",
    "touchstart",
    "touchend",
    "touchmove",
  ];

  events.forEach((event) => {
    window.addEventListener(event, resetTimer);
  });
}

function handleInactivity() {
  const currentUrl = window.location.href;
  
  // Controlla se l'URL contiene "menu"
  if (currentUrl.includes("menu")) {
    console.log("Inattività rilevata nella pagina del menu. Nessun reindirizzamento.");
    return;
  }

  // Estrai la parte base dell'URL (fino a "it/" o "en/")
  const baseUrl = currentUrl.match(/(.*?\/(?:it|en)\/)/);
  
  if (baseUrl) {
    // Costruisci il nuovo URL
    let newUrl = baseUrl[1] + "menu";

    // Aggiungi i parametri esistenti
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.toString()) {
      newUrl += "?" + searchParams.toString();
    }

    console.log("Inattività rilevata. Reindirizzamento a:", newUrl);
    window.location.href = newUrl;
  } else {
    console.log("Formato URL non riconosciuto. Nessun reindirizzamento.");
  }
}

// Uso della funzione
onInactive(180, handleInactivity);