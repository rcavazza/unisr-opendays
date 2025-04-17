document.addEventListener("DOMContentLoaded", (event) => {
  function onResize() {}

  const events = document.querySelectorAll(".event");

  function closeAll() {
    events.forEach((event) => {
      event.classList.remove("open");
    });
  }

  events.forEach((event) => {
    event.addEventListener("click", (e) => {
      const target = e.currentTarget;
      const needToOpen = target.classList.contains("open");
      closeAll();
      console.log(target);
      if (!needToOpen) {
        target.classList.toggle("open");
      }
    });
  });

  onResize();

  window.addEventListener("resize", onResize);
});
