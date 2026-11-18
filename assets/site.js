const regionNames = [
  [
    "Orchard Weald",
    "Glassmere Marsh",
    "Emberfall Ridge",
    "Starling Summit",
    "Westwind Fields",
    "Bellwick Village",
    "Harrow Cemetery",
    "Kingscourt",
    "Saffron Dunes",
    "Saltwind Coast",
    "Reedwater Bend",
    "Lantern Bluff",
  ],
  [
    "Thornwake Wood",
    "Choirfen",
    "The Ashworks",
    "Shardpeak",
    "Upside-Down Grove",
    "Hushwick",
    "The Pale Stacks",
    "Hollow Court",
    "Cinder Wastes",
    "The Drowned Strand",
    "Ghostwater Cut",
    "Lastlight Bluff",
  ],
];
const instruments = [
  {
    name: "Gale Disc",
    note: "A returning blade cuts vines, rings nodes and collects drops.",
  },
  {
    name: "River Boots",
    note: "Swim freely. Activate for a burst against currents.",
  },
  {
    name: "Lodestone Gauntlet",
    note: "Pull metal weights or draw yourself to iron anchors.",
  },
  {
    name: "Prism Lens",
    note: "Illuminate veiled paths and charge aligned receivers.",
  },
  {
    name: "Wraith Mantle",
    note: "Cross a marked spectral wall in a single stride.",
  },
  {
    name: "Echo Chime",
    note: "Echoes reveal stepping stones and silence singers.",
  },
  { name: "Stillglass", note: "Halt marked gears and foes for four seconds." },
  { name: "Cinder Rod", note: "Fire bolts melt blue ice and kindle braziers." },
  {
    name: "Rootbind Staff",
    note: "Grow a bridge from a living root for eight seconds.",
  },
  {
    name: "Dawnsteel",
    note: "Your restored sword reflects bright bolts and cuts Crown glass.",
  },
  {
    name: "Burst Satchel",
    note: "Burst charges open cracked masonry. Pots replenish charges.",
  },
];
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

const realmNames = ["Aurelia", "The Gloam"];
const notes = [
  [
    "Mossbell Sanctuary stands in the orchard. Its returning blade can ring a switch across a gap.",
    "Cross the marsh to reach the Sunken Aqueduct. The River Boots belong to its flooded passages.",
    "Look for the Emberglass Foundry among the kilns and broken rock.",
    "Climb to Skyglass Observatory. Its Prism Lens brings hidden paths into view.",
    "Wind turns the mill above the planted rows of Westwind Fields.",
    "Find Merin on the village green. Ring the bell to restore your supplies before setting out for Mossbell Sanctuary.",
    "Follow the lanes between the grave markers east of Bellwick Village.",
    "The road broadens into a paved court beneath the royal towers.",
    "Wind-shaped dunes mark the southwest corner of the kingdom.",
    "Bellwick’s southern road leads to the tidewater at Saltwind Coast.",
    "Follow the river past the reeds and the old crossing.",
    "The last bluff looks out from the southeastern edge of Aurelia.",
  ],
  [
    "The old orchard has grown thorns. Beyond its gates lies Thornwake Manor.",
    "The water carries voices here. The Echo Chime waits in the Drowned Choir.",
    "Explore the Ashen Hourworks. Stillglass can stop its marked gears for four seconds.",
    "Where the observatory stood, the road climbs into the shadow of Shardpeak.",
    "The fields give way to the Inverted Garden, home of the Rootbind Staff.",
    "Bellwick’s familiar lanes return in shadow. Seek Nelle, the echo guide, beside the rift.",
    "The cemetery’s twin hides the way into the Frostbound Reliquary.",
    "The road through Hollow Court leads to the Hollow Crown Citadel.",
    "Ash has taken the place of sand in the kingdom’s southwest.",
    "On the other side of Saltwind Coast, the sea meets the Drowned Strand.",
    "The river still bends east of the strand, through the Ghostwater Cut.",
    "Follow the southern road to the last headland in the Gloam.",
  ],
];
const journal = document.querySelector(".journal");
const folios = [...document.querySelectorAll("[data-folio]")];
const aliases = { worlds: "atlas", guide: "satchel" };
function pageFromHash() {
  const id = location.hash.slice(1);
  return folios.some((link) => link.dataset.folio === id)
    ? id
    : aliases[id] || "atlas";
}
function openFolio(scroll) {
  const id = pageFromHash();
  for (const link of folios) {
    const active = link.dataset.folio === id;
    document.getElementById(link.dataset.folio).hidden = !active;
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  if (scroll) journal.scrollIntoView({ block: "start" });
}
function journalHash(hash) {
  return ["#atlas", "#satchel", "#controls", "#worlds", "#guide"].includes(
    hash,
  );
}
for (const link of document.querySelectorAll('a[href^="#"]')) {
  if (!journalHash(link.hash)) continue;
  link.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, "", link.hash);
    openFolio(true);
    if (!folios.includes(link))
      folios
        .find((tab) => tab.dataset.folio === pageFromHash())
        .focus({ preventScroll: true });
  });
}
window.addEventListener("hashchange", () =>
  openFolio(journalHash(location.hash)),
);
openFolio(journalHash(location.hash));

let realm = 0,
  region = 5;
const grid = document.getElementById("map-grid");
const cross = document.getElementById("cross");
const landArt = document.getElementById("land-art");
const places = regionNames[0].map((_, i) => {
  const button = document.createElement("button");
  const label = document.createElement("span");
  button.append(label);
  button.type = "button";
  button.addEventListener("click", () => {
    region = i;
    renderMap();
  });
  grid.append(button);
  return button;
});
function renderMap() {
  document.getElementById("atlas-heading").textContent = realmNames[realm];
  cross.textContent = "Cross to " + (realm ? "Aurelia" : "the Gloam") + " ⇄";
  grid.classList.toggle("dark", !!realm);
  for (const [i, button] of places.entries()) {
    button.firstChild.textContent = regionNames[realm][i];
    button.setAttribute("aria-pressed", String(region === i));
  }
  document.getElementById("land-title").textContent =
    regionNames[realm][region];
  document.getElementById("land-note").textContent = notes[realm][region];
  landArt.src = "./assets/journal/land-" + realm + "-" + region + ".webp";
  landArt.alt =
    regionNames[realm][region] +
    " as seen during play in " +
    realmNames[realm] +
    ".";
}
cross.hidden = false;
cross.addEventListener("click", () => {
  realm = 1 - realm;
  renderMap();
});
renderMap();

const slots = document.getElementById("item-grid");
const itemArt = document.getElementById("item-art");
function selectItem(index) {
  for (const [i, button] of [...slots.children].entries())
    button.setAttribute("aria-pressed", String(i === index));
  itemArt.src = "./assets/journal/item-" + index + ".png";
  document.getElementById("item-title").textContent = instruments[index].name;
  document.getElementById("item-note").textContent = instruments[index].note;
}
for (const [i, item] of instruments.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", item.name);
  button.title = item.name;
  const img = new Image(200, 160);
  img.loading = "lazy";
  img.alt = "";
  img.src = "./assets/journal/item-" + i + ".png";
  button.append(img);
  button.addEventListener("click", () => selectItem(i));
  slots.append(button);
}
selectItem(10);
const gameMenu = document.querySelector(".game-menu");
gameMenu.addEventListener("keydown", (e) => {
  const choices = [...gameMenu.querySelectorAll("a")];
  const n = choices.indexOf(document.activeElement);
  if (n < 0 || !["ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  choices[
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? choices.length - 1
        : (n + (e.key === "ArrowDown" ? 1 : -1) + choices.length) %
          choices.length
  ].focus();
});
document.addEventListener("keydown", (event) => {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    document.activeElement !== document.body ||
    dialog.open ||
    window.scrollY > 32
  )
    return;
  const choices = gameMenu.querySelectorAll("a");
  if (event.key === "Enter") {
    event.preventDefault();
    choices[0].click();
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    choices[event.key === "ArrowDown" ? 1 : choices.length - 1].focus();
  }
});
const speech = document.getElementById("speech");
const lines = [
  speech.textContent,
  "“Take her satchel by the village green, then head northwest to Mossbell.”",
];
const advance = document.getElementById("advance");
advance.hidden = false;
let lineIndex = 0;
advance.addEventListener("click", () => {
  lineIndex = (lineIndex + 1) % lines.length;
  speech.textContent = lines[lineIndex];
});
const bell = document.getElementById("ring");
bell.hidden = false;
let audio;
bell.addEventListener("click", async () => {
  if (bell.disabled) return;
  bell.disabled = true;
  const label = bell.querySelector(".bell-label");
  label.textContent = "Bell ringing…";
  document.body.classList.add("ringing");
  setTimeout(() => {
    bell.disabled = false;
    label.textContent = "Ring the west bell";
    document.body.classList.remove("ringing");
  }, 1800);
  try {
    audio ||= new AudioContext();
    await audio.resume();
    const t = audio.currentTime;
    for (const [f, v, d] of [
      [293.66, 0.13, 1.6],
      [590.26, 0.045, 0.95],
      [801.69, 0.028, 0.65],
    ]) {
      const oscillator = audio.createOscillator(),
        gain = audio.createGain();
      oscillator.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(v, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(t);
      oscillator.stop(t + d + 0.01);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  } catch {
    /* The visible bell response also works with audio unavailable. */
  }
});
