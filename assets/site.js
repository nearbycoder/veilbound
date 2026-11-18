const realms = {
  aurelia: {
    place: "Bellwick Village",
    alt: "Bellwick Village in Aurelia, with tiled cottages and a bell on the village green.",
  },
  gloam: {
    place: "Hushwick",
    alt: "The same crossroads in Hushwick, with purple roofs and shadowed stone in the Gloam.",
  },
};
const picker = document.querySelector(".world-switch");
picker.hidden = false;
for (const button of picker.querySelectorAll("button")) {
  button.addEventListener("click", () => {
    const key = button.dataset.world;
    const image = document.getElementById("world-shot");
    image.src = "./assets/media/" + key + ".jpg";
    image.alt = realms[key].alt;
    document.getElementById("world-label").textContent = realms[key].place;
    for (const option of picker.querySelectorAll("button"))
      option.setAttribute("aria-pressed", String(option === button));
  });
}
const dialog = document.getElementById("screening");
const video = dialog.querySelector("video");
const watch = document.getElementById("watch");
watch.addEventListener("click", (event) => {
  if (!dialog.showModal || event.metaKey || event.ctrlKey || event.shiftKey)
    return;
  event.preventDefault();
  dialog.showModal();
  video.play().catch(() => {});
});
dialog.querySelector("button").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => {
  video.pause();
  watch.focus({ preventScroll: true });
});
