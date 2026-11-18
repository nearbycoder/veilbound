"use strict";

const menuDisplay = '"Veil Serif", Georgia, serif';
const uiPaper = "#fff2d4";
const uiGold = "#e8c48a";
const uiMuted = "#d0b997";
const uiInk = "#392619";
const inkFaint = "#63442d";
const uiRule = "#b38b527f";
const kitMaterials = {
  wood: 0,
  parchment: 1,
  leather: 2,
  velvet: 3,
  brass: 4,
  slate: 5,
};
const kitTints = {
  wood: "#26180f",
  parchment: "#e2c89c",
  leather: "#42261b",
  velvet: "#222d21",
  brass: "#a4793b",
  slate: "#262635",
};
const fittings = {
  heart: 0,
  lantern: 1,
  key: 2,
  socket: 3,
  redSeal: 4,
  violetSeal: 5,
};
const menuHeadings = {
  pause: "Journey paused",
  inventory: "Equipment",
  map: "Cartographer’s map",
  journal: "Quest journal",
  bindings: "Keyboard bindings",
  bells: "Bell towers",
  confirm: "New journey",
};
const bindingLabels = {
  up: "Move north",
  down: "Move south",
  left: "Move west",
  right: "Move east",
  attack: "Strike",
  shield: "Guard",
  dodge: "Dodge",
  slot1: "Instrument I",
  slot2: "Instrument II",
  act: "Interact",
  inventory: "Equipment",
  map: "Map",
  pause: "Pause",
};
let uiPointer = null;

function kitArt(name, x, y, w, h) {
  const image = paintedArt[name];
  if (!artReady(image)) return false;
  g.drawImage(image, x, y, w, h);
  return true;
}

function kitSurface(kind, x, y, w, h) {
  const sheet = paintedArt["kit-surfaces"];
  if (!artReady(sheet)) {
    rect(x, y, w, h, kitTints[kind]);
    return;
  }
  const n = kitMaterials[kind];
  g.drawImage(
    sheet,
    (n % 3) * 256,
    Math.floor(n / 3) * 256,
    256,
    256,
    x,
    y,
    w,
    h,
  );
}

function kitFitting(name, x, y, size, alpha = 1) {
  const sheet = paintedArt["kit-fittings"];
  if (!artReady(sheet)) return false;
  const n = fittings[name];
  g.save();
  g.globalAlpha *= alpha;
  g.drawImage(
    sheet,
    (n % 3) * 192,
    Math.floor(n / 3) * 192,
    192,
    192,
    x - size / 2,
    y - size / 2,
    size,
    size,
  );
  g.restore();
  return true;
}

function kitObject(index, x, y, size) {
  return paintedCutout("interface", index, 2, x, y + size * 0.47, size);
}

function uiText(
  value,
  x,
  y,
  color,
  size,
  align = "left",
  maxWidth = undefined,
) {
  g.font = size + "px " + menuDisplay;
  g.textAlign = align;
  g.fillStyle = color;
  g.fillText(String(value), x, y, maxWidth);
  g.textAlign = "left";
}

function uiLines(value, size, width) {
  g.font = size + "px " + menuDisplay;
  const lines = [];
  let line = "";
  for (const word of value.trim().split(/\s+/)) {
    const combined = line ? line + " " + word : word;
    if (line && g.measureText(combined).width > width) {
      lines.push(line);
      line = word;
    } else line = combined;
  }
  if (line) lines.push(line);
  return lines;
}

function uiParagraph(value, x, y, width, size, step, color) {
  uiLines(value, size, width).forEach((line, i) =>
    uiText(line, x, y + step * i, color, size),
  );
}

function leafRule(x, y, width, ink = uiRule) {
  line(x, y, x + width / 2 - 4, y, ink);
  line(x + width / 2 + 4, y, x + width, y, ink);
  petalGlyph(x + width / 2, y + 0.3, 2.4, ink);
}

function rivet(x, y, size = 1) {
  oval(x, y + 0.3, size + 0.4, size + 0.08, "#23160e");
  oval(x, y, size, size * 0.86, "#b58a46");
  oval(x - 0.29, y - 0.3, size * 0.48, size * 0.29, "#ffdb91");
}

function kitPlate(kind, x, y, w, h) {
  const c = Math.min(5, w * 0.1, h * 0.16);
  g.save();
  g.beginPath();
  g.moveTo(x + c, y);
  g.lineTo(x + w - c, y);
  g.lineTo(x + w, y + c);
  g.lineTo(x + w, y + h - c);
  g.lineTo(x + w - c, y + h);
  g.lineTo(x + c, y + h);
  g.lineTo(x, y + h - c);
  g.lineTo(x, y + c);
  g.closePath();
  g.clip();
  kitSurface(kind, x, y, w, h);
  const shade = g.createLinearGradient(x, y, x, y + h);
  shade.addColorStop(0, "#24150d12");
  shade.addColorStop(1, "#1b100f55");
  rect(x, y, w, h, shade);
  g.strokeStyle = "#be9755";
  g.lineWidth = 1;
  g.stroke();
  g.restore();
  line(x + c + 0.7, y + 2.2, x + w - c - 0.7, y + 2.2, "#d8af685d");
  line(x + c + 0.7, y + h - 2.2, x + w - c - 0.7, y + h - 2.2, "#100b0b72");
  if (h > 19 && w > 31) {
    rivet(x + 5, y + 5, 1.08);
    rivet(x + w - 5, y + 5, 1.08);
    rivet(x + 5, y + h - 5, 1.08);
    rivet(x + w - 5, y + h - 5, 1.08);
  }
}

function parchmentSlip(x, y, w, h, seed = 1) {
  g.save();
  g.beginPath();
  const n = (i) => (grain(i, seed, 19) - 0.5) * 2.1;
  g.moveTo(x + 2, y + 2);
  for (let i = 1; i <= 12; i++) g.lineTo(x + (w * i) / 12, y + n(i));
  for (let i = 1; i <= 10; i++) g.lineTo(x + w + n(i + 12), y + (h * i) / 10);
  for (let i = 11; i >= 0; i--) g.lineTo(x + (w * i) / 12, y + h + n(i + 22));
  for (let i = 9; i > 0; i--) g.lineTo(x + n(i + 35), y + (h * i) / 10);
  g.closePath();
  g.fillStyle = kitTints.parchment;
  g.shadowColor = "#1b0e0dde";
  g.shadowOffsetY = 1.7 * graphics.scale;
  g.shadowBlur = 3 * graphics.scale;
  g.fill();
  g.shadowBlur = g.shadowOffsetY = 0;
  g.clip();
  kitSurface("parchment", x - 2, y - 2, w + 4, h + 4);
  const tone = g.createLinearGradient(x, y, x + w, y + h);
  tone.addColorStop(0, "#5f35193a");
  tone.addColorStop(0.22, "#fff1c954");
  tone.addColorStop(0.76, "#f4d69c2a");
  tone.addColorStop(1, "#6943224d");
  rect(x - 2, y - 2, w + 4, h + 4, tone);
  g.restore();
}

function keyCap(label, x, y, w = 13, h = 10) {
  if (
    w > h * 1.35 ||
    !kitFitting("key", x + w / 2, y + h / 2, Math.max(w, h) * 1.08)
  )
    kitPlate("brass", x, y, w, h);
  rect(x + 1.1, y + 1.3, w - 2.2, h - 2.7, "#f3d59974");
  uiText(
    label,
    x + w / 2,
    y + h * 0.73,
    "#2b190e",
    h * 0.75,
    "center",
    w - 1.7,
  );
}

function menuButton(
  label,
  x,
  y,
  w,
  fn,
  active = false,
  height = 14,
  options = {},
) {
  const hover =
    uiPointer &&
    uiPointer.x >= x &&
    uiPointer.x < x + w &&
    uiPointer.y >= y &&
    uiPointer.y < y + height;
  if (active || hover) {
    kitPlate("brass", x, y, w, height);
    rect(x + 2, y + 2, w - 4, height - 4, "#ffdd8962");
  } else if (!kitArt("kit-sign", x, y, w, height))
    kitPlate("wood", x, y, w, height);
  const centered = options.center || w < 29;
  const left = centered ? x + w / 2 : x + 11;
  uiText(
    label,
    left,
    y + height * 0.68,
    active || hover ? "#321f13" : uiPaper,
    options.size || Math.min(10.0, height * 0.73),
    centered ? "center" : "left",
    w - (centered ? 3 : 18),
  );
  hitBox(x, y, w, height, fn, options.touchLabel || label, active);
}

function closeClasp(x = 344, y = 20) {
  menuButton("×", x, y, 18, closeMenu, false, 17, {
    center: true,
    touchLabel: "Close menu",
    size: 14,
  });
}

function menuBackdrop() {
  const backdrop =
    menuFrom === "title"
      ? (titleCache ??= makeLayer(landscape))
      : (roomCache ??= makeLayer(S.d >= 0 || S.cave ? indoorArt : surfaceArt));
  g.drawImage(backdrop, 0, 0, W, H);
  const shade = g.createRadialGradient(192, 101, 52, 192, 108, 232);
  shade.addColorStop(0, "#140d0f65");
  shade.addColorStop(1, "#0d090df2");
  rect(0, 0, W, H, shade);
}

function bookSpread() {
  if (kitArt("kit-book", 11, 6, 362, 204)) return;
  kitPlate("leather", 11, 6, 362, 204);
  parchmentSlip(24, 15, 166, 181, 4);
  parchmentSlip(194, 15, 166, 181, 8);
}

function inkHeading(label, x, y, width, size = 19) {
  uiText(label, x, y, uiInk, size, "left", width);
  leafRule(x, y + 4.2, width, "#6d471e7a");
}

function titleLockup() {
  kitObject(3, 36, 31, 27);
  line(57, 32, 131, 32, "#bd935e84");
  petalGlyph(136, 32, 2.7, uiGold);
  const fill = g.createLinearGradient(0, 45, 0, 85);
  fill.addColorStop(0, "#fff2c5");
  fill.addColorStop(0.61, "#efd093");
  fill.addColorStop(1, "#bd8146");
  uiText("Veilbound", 22.5, 85.7, "#140c16", 46.5);
  uiText("Veilbound", 21, 84, fill, 46.5);
  spaced("ECHOES OF THE HOLLOW CROWN", 25, 98, 0.68, "#f3d3a6", 6.3);
  leafRule(24, 107, 131);
  const choices = saved
    ? ["Continue journey", "New journey", "Settings"]
    : ["Begin journey", "Settings"];
  choices.forEach((label, i) =>
    menuButton(
      label,
      24,
      121 + i * 20,
      131,
      () => titleChoose(i),
      i === sel,
      16,
      { center: true, size: 11 },
    ),
  );
  const legend = opts.sound ? "Sound on" : "Sound off";
  const shade = g.createLinearGradient(0, 186, 0, H);
  shade.addColorStop(0, "#100c1200");
  shade.addColorStop(1, "#100b10e8");
  rect(0, 186, W, H - 186, shade);
  keyCap("↑ ↓", 24, 198, 18, 10);
  uiText("Select", 46, 205.5, uiMuted, 8);
  keyCap(keyName("act"), 75, 198);
  uiText("Confirm", 92, 205.5, uiMuted, 8);
  menuButton(legend, 307, 195, 62, toggleSound, false, 16, { center: true });
}

function drawPause() {
  kitPlate("wood", 14, 10, 356, 195);
  leafRule(28, 39, 317);
  uiText(menuHeadings.pause, 29, 32, uiPaper, 20.3);
  closeClasp();
  entries().forEach((label, i) =>
    menuButton(
      label,
      26,
      46 + i * 15.25,
      128,
      () => {
        sel = i;
        menuChoose(i);
      },
      sel === i,
    ),
  );
  parchmentSlip(165, 48, 190, 143, 7);
  rivet(173, 53, 1.2);
  rivet(346, 53, 1.2);
  const w = 165;
  uiText(place(), 175, 69, uiInk, 16.1, "left", w);
  leafRule(175, 74, w, "#84572f8b");
  uiText("Current objective", 175, 86, inkFaint, 8.9);
  uiParagraph(goal(), 175, 97, w, 10, 10.4, uiInk);
  const seals = S.done.filter((i) => i < 4).length;
  const fragments = S.done.length - seals;
  const progress = [
    ["Aurelia seals", seals, 4, "redSeal", 136],
    ["Crown fragments", fragments, 6, "violetSeal", 162],
  ];
  for (const [label, count, max, mark, y] of progress) {
    uiText(label, 175, y, uiInk, 10.8);
    uiText(count + " / " + max, 341, y, inkFaint, 8, "right");
    line(175, y + 3.2, 341, y + 3.2, "#69421b35");
    for (let i = 0; i < max; i++) {
      const x = 181 + i * 15.5;
      oval(x, y + 11.3, 5.5, 4.7, "#61402f43");
      if (i < count) kitFitting(mark, x, y + 10.5, 13.2);
      else petalGlyph(x, y + 10.4, 1.75, "#80593e76");
    }
  }
  kitFitting(S.world ? "violetSeal" : "redSeal", 331, 177, 25, 0.8);
}

function journalNotes() {
  return S.journal
    .slice()
    .reverse()
    .flatMap((entry) => uiLines(entry, 8.8, 135));
}

function journalPageCount() {
  return Math.max(1, Math.ceil(journalNotes().length / 10));
}

function drawJournal() {
  bookSpread();
  inkHeading(menuHeadings.journal, 32, 38, 145);
  inkHeading("Field notes", 213, 38, 132);
  closeClasp(343, 18);
  uiText("Current objective", 32, 56, inkFaint, 8.9);
  uiParagraph(goal(), 32, 68, 142, 9.5, 10.5, uiInk);
  leafRule(32, 91, 141, "#7b4a2572");
  names.forEach((name, i) => {
    const y = 101 + i * 7.9 + (i >= 4 ? 3 : 0);
    const done = S.done.includes(i);
    if (i === 4) line(32, y - 8.4, 173, y - 8.4, "#85572f58");
    if (done) kitFitting(i < 4 ? "redSeal" : "violetSeal", 35, y - 2.1, 7.8);
    else petalGlyph(35, y - 2.5, 1.7, "#75533795");
    uiText(name, 42, y, done ? "#385037" : uiInk, 8.5, "left", 130);
  });
  const notes = journalNotes();
  const pages = Math.max(1, Math.ceil(notes.length / 10));
  const shownPage = Math.min(page, pages - 1);
  if (!notes.length) uiText("No field notes yet.", 214, 59, inkFaint, 9.5);
  for (let i = 0; i < 10; i++) {
    const y = 58 + i * 10.9;
    const entry = notes[shownPage * 10 + i];
    line(214, y + 2.4, 344, y + 2.4, "#7d54382a");
    if (entry) uiText(entry, 214, y, uiInk, 8.8, "left", 135);
  }
  if (pages > 1) {
    menuButton(
      "‹ Previous",
      212,
      174,
      57,
      () => (page = Math.max(0, shownPage - 1)),
      false,
      15,
      { center: true },
    );
    menuButton(
      "Next ›",
      275,
      174,
      47,
      () => (page = Math.min(pages - 1, shownPage + 1)),
      false,
      15,
      { center: true },
    );
    uiText(shownPage + 1 + "/" + pages, 341, 184, inkFaint, 8.8, "right", 20);
  }
}

function stitchRule(x, y, w) {
  g.save();
  g.setLineDash([2.3, 1.7]);
  line(x, y, x + w, y, "#caa5718d");
  g.restore();
}

function drawEquipment() {
  if (!kitArt("kit-roll", 11, 9, 362, 198))
    kitPlate("leather", 14, 10, 356, 195);
  uiText(menuHeadings.inventory, 34, 48, uiPaper, 20.4);
  stitchRule(34, 53, 139);
  stitchRule(215, 53, 125);
  closeClasp(340, 20);
  for (const [i, item] of S.items.entries()) {
    const x = 44 + (i % 6) * 24.4,
      y = 76 + Math.floor(i / 6) * 32;
    if (i === sel) oval(x, y + 1, 13.4, 13.1, "#eab46c9b");
    kitSocket(x, y, 24.3);
    glyph(x, y, item, 1.34);
    const equipped = S.slots.indexOf(item);
    if (equipped >= 0)
      keyCap(keyName(equipped ? "slot2" : "slot1"), x - 11, y - 12, 8, 7.7);
    hitBox(x - 12, y - 13, 24, 26, () => (sel = i), toolsList[item], i === sel);
  }
  const active = S.items[sel];
  if (active === undefined) {
    kitObject(2, 276, 115, 75);
    uiParagraph(
      "Treasury instruments will appear here as you find them.",
      35,
      130,
      139,
      10,
      11,
      uiPaper,
    );
  } else {
    const glow = g.createRadialGradient(278, 97, 2, 278, 97, 55);
    glow.addColorStop(0, "#d1a46754");
    glow.addColorStop(1, "#c4835200");
    rect(215, 53, 125, 104, glow);
    if (!instrumentArt(active, 278, 95, 79)) glyph(278, 95, active, 4.5);
    uiText(toolsList[active], 278, 151, uiPaper, 14.5, "center", 132);
    uiParagraph(descriptions[active], 35, 137, 137, 9.5, 10.4, uiPaper);
    menuButton(
      "Equip " + keyName("slot1"),
      34,
      164,
      63,
      () => menuChoose(sel),
      false,
      17,
      { center: true },
    );
    menuButton(
      "Equip " + keyName("slot2"),
      110,
      164,
      63,
      () => menuChoose(sel, -1),
      false,
      17,
      { center: true },
    );
  }
  menuButton(
    "Quest journal",
    226,
    164,
    103,
    () => openMenu("journal"),
    false,
    17,
    { center: true },
  );
}

function drawBindings() {
  bookSpread();
  inkHeading(menuHeadings.bindings, 31, 39, 146, 18);
  closeClasp(343, 18);
  const keys = Object.keys(baseKeys);
  keys.forEach((action, i) => {
    const x = i < 7 ? 32 : 213,
      y = 52 + (i % 7) * 16;
    if (i === sel || bindAction === action)
      rect(x - 2, y - 1, 134, 14, "#a1764b4e");
    line(x, y + 14, x + 133, y + 14, "#84572f43");
    uiText(bindingLabels[action], x + 2, y + 9.7, uiInk, 10.2);
    keyCap(keyName(action), x + 96, y + 1.2, 36, 11.5);
    hitBox(
      x - 2,
      y - 1,
      134,
      15,
      () => {
        sel = i;
        menuChoose(i);
      },
      bindingLabels[action],
      i === sel,
    );
  });
  leafRule(32, 165, 134, "#905b2a8f");
  uiText(
    bindAction
      ? "Press a key for " + bindingLabels[bindAction]
      : "Choose a binding to change it.",
    33,
    178,
    uiInk,
    9.5,
    "left",
    144,
  );
}

function drawBells() {
  kitPlate("slate", 13, 11, 358, 194);
  parchmentSlip(25, 26, 165, 163, 13);
  inkHeading(menuHeadings.bells, 34, 43, 144, 18.5);
  closeClasp();
  const destinations = entries();
  const first = Math.floor(sel / 8) * 8;
  destinations.slice(first, first + 8).forEach((label, index) => {
    const i = first + index,
      y = 50 + index * 14.1;
    if (i === sel) rect(32, y, 147, 12.7, "#a3754655");
    line(34, y + 12.7, 178, y + 12.7, "#613a1a43");
    if (i > 0)
      kitFitting(
        S.bells[i - 1] >= 12 ? "violetSeal" : "redSeal",
        40,
        y + 6.7,
        9.3,
      );
    uiText(label, i ? 49 : 36, y + 9.4, uiInk, 9.5, "left", 125);
    hitBox(
      32,
      y,
      147,
      13.6,
      () => {
        sel = i;
        menuChoose(i);
      },
      label,
      i === sel,
    );
  });
  if (destinations.length > 8) {
    menuButton(
      "‹ Previous",
      33,
      166,
      63,
      () => (sel = Math.max(0, first - 8)),
      false,
      15,
      { center: true },
    );
    menuButton(
      "Next ›",
      102,
      166,
      55,
      () => (sel = Math.min(destinations.length - 1, first + 8)),
      false,
      15,
      { center: true },
    );
  }
  const glow = g.createRadialGradient(274, 98, 6, 274, 98, 81);
  glow.addColorStop(0, "#d5a05c56");
  glow.addColorStop(0.65, "#5f3f534b");
  glow.addColorStop(1, "#2b1b2700");
  rect(195, 31, 167, 151, glow);
  line(278, 27, 278, 60, "#b38a50c1");
  kitObject(0, 278, 100, 105);
  leafRule(216, 159, 124, "#c69a616b");
  uiText(
    sel > 0 ? destinations[sel] : "Discovered bells",
    278,
    175,
    uiPaper,
    13.6,
    "center",
    132,
  );
}

function drawConfirmation() {
  parchmentSlip(63, 38, 258, 140, 31);
  kitFitting("redSeal", 289, 143, 37);
  uiText("Begin a new journey?", 83, 68, uiInk, 20.6);
  leafRule(84, 76, 219, "#7d4d328f");
  uiParagraph(
    "Beginning again replaces your current save in this browser.",
    84,
    93,
    214,
    11,
    13,
    uiInk,
  );
  entries().forEach((label, i) =>
    menuButton(
      label,
      83,
      112 + i * 23,
      162,
      () => menuChoose(i),
      i === sel,
      19,
      { center: true, size: 11 },
    ),
  );
  closeClasp(292, 48);
}

function paintGameMenu() {
  menuBackdrop();
  if (menu === "pause") drawPause();
  else if (menu === "inventory") drawEquipment();
  else if (menu === "map") drawWorldMap();
  else if (menu === "journal") drawJournal();
  else if (menu === "bindings") drawBindings();
  else if (menu === "bells") drawBells();
  else if (menu === "confirm") drawConfirmation();
}

function paintDefeat() {
  const shadow = g.createRadialGradient(192, 100, 11, 192, 102, 190);
  shadow.addColorStop(0, "#3e24287e");
  shadow.addColorStop(1, "#110b12ec");
  rect(0, 0, W, H, shadow);
  kitPlate("slate", 72, 42, 240, 132);
  kitFitting("lantern", 192, 71, 42, 0.74);
  leafRule(102, 96, 180);
  uiText("The lantern gutters", 192, 119, uiPaper, 20.5, "center");
  uiText("Return to the last bell you rang.", 192, 134, uiMuted, 9.2, "center");
  menuButton("Return to checkpoint", 118, 143, 148, retry, true, 20, {
    center: true,
    size: 10.6,
  });
}

const atlasColumns = [64, 144, 240, 320];

function atlasLine(start, end, active) {
  g.save();
  g.setLineDash(active ? [2, 1] : [1, 3]);
  line(...start, ...end, active ? "#80592c9e" : "#7d62444d");
  g.restore();
}

function atlasCourse(name, x, y, w, h, icon) {
  rect(x, y, w, h, "#291a150b");
  uiText(name, x + 4, y + h - 3.8, inkFaint, 7.5);
  if (icon === "bell") kitObject(0, x + w - 5.9, y + h * 0.5, h);
  else kitFitting(icon, x + w - 5.9, y + h * 0.5, h - 1.6);
}

function mapLandTile(i, x, y, known, here) {
  const w = 68,
    h = 34,
    k = mapWorld * 12 + i;
  rect(
    x - w / 2 - 1,
    y - h / 2 - 1,
    w + 2,
    h + 2,
    here ? "#8d5028" : "#a27c5059",
  );
  const sheet = paintedArt["world-surfaces"];
  if (known && artReady(sheet)) {
    if (i === 5 && artReady(paintedArt["village-ground"]))
      g.drawImage(
        paintedArt["village-ground"],
        mapWorld ? 0 : 384,
        mapWorld * 384,
        384,
        384,
        x - w / 2,
        y - h / 2,
        w,
        h,
      );
    else
      g.drawImage(
        sheet,
        (k % 6) * tileSize,
        Math.floor(k / 6) * tileSize,
        tileSize,
        tileSize,
        x - w / 2,
        y - h / 2,
        w,
        h,
      );
    rect(x - w / 2, y - h / 2, w, h, "#3e2d244c");
  } else {
    kitSurface("parchment", x - w / 2, y - h / 2, w, h);
    const alpha = mapWorld ? "#6e4e6a58" : "#925f323e";
    rect(x - w / 2, y - h / 2, w, h, alpha);
  }
  if (known) {
    if (here) kitFitting(mapWorld ? "violetSeal" : "redSeal", x, y - 3, 17);
    else paintedCutout("region-props", k, 4, x, y + 3, 21);
    const name = (mapWorld ? gloam : places)[i];
    rect(x - w / 2, y + 5, w, 12, here ? "#683c25ed" : "#221a16e9");
    uiText(name, x, y + 13.2, uiPaper, 8.2, "center", w - 5);
    const d = sites.findIndex((area, j) => area === i && j >= 4 === !!mapWorld);
    if (d >= 0)
      uiText(
        S.done.includes(d) ? "✓" : "◆",
        x - 26,
        y - 5,
        "#ffe1a2",
        8.1,
        "center",
      );
    if (S.bells.includes(k)) kitObject(0, x + 26, y - 5, 13);
    if (S.notes[k]) petalGlyph(x + 18, y - 11, 2.3, "#ffe499");
    hitBox(
      x - w / 2,
      y - h / 2,
      w,
      h,
      () => {
        S.notes[k] = !S.notes[k];
        save();
      },
      (S.notes[k] ? "Unmark " : "Mark ") + name,
      here,
    );
  } else {
    petalGlyph(x, y, 3.5, "#936a437b");
    leafRule(x - 21, y, 42, "#9d6e4235");
  }
}

function drawWorldMap() {
  bookSpread();
  inkHeading(menuHeadings.map, 31, 38, 147, 18.7);
  closeClasp(343, 18);
  if (S.d >= 0) {
    drawDungeonMap();
    return;
  }
  const realm = mapWorld ? "The Gloam" : "Aurelia";
  uiText(realm, 212, 38, uiInk, 17.8, "left", 123);
  leafRule(213, 42, 128, "#70462477");
  const coords = atlasColumns;
  const positions = places.map((_, i) => [
    coords[i % 4],
    64 + Math.floor(i / 4) * 42,
  ]);
  for (let i = 0; i < places.length; i++) {
    for (const next of [i % 4 < 3 ? i + 1 : -1, i < 8 ? i + 4 : -1]) {
      if (next < 0) continue;
      atlasLine(
        positions[i],
        positions[next],
        surfaceConnection(i, next, mapWorld),
      );
    }
  }
  positions.forEach(([x, y], i) =>
    mapLandTile(
      i,
      x,
      y,
      S.seen.includes(mapWorld * 12 + i),
      S.area === i && mapWorld === S.world,
    ),
  );
  menuButton(
    mapWorld ? "View Aurelia" : "View the Gloam",
    31,
    171,
    70,
    () => (mapWorld = 1 - mapWorld),
    false,
    18,
    { center: true, size: 10 },
  );
  menuButton(
    S.notes[loc()] ? "Unmark current area" : "Mark current area",
    105,
    171,
    71,
    () => {
      S.notes[loc()] = !S.notes[loc()];
      save();
    },
    false,
    18,
    { center: true, size: 9.8 },
  );
  atlasCourse("Rung bell", 214, 164, 65, 13.2, "bell");
  atlasCourse(
    "Current position",
    214,
    180,
    101,
    13.2,
    mapWorld ? "violetSeal" : "redSeal",
  );
  uiText("◆ Entrance", 281, 173.7, inkFaint, 8.3);
}

function drawDungeonMap() {
  uiText(names[S.d], 213, 38, uiInk, 16.5, "left", 124);
  leafRule(213, 42, 128, "#70462477");
  const state = D(),
    { seen, flags } = state;
  const positions = layouts.map((_, i) => {
    const [x, y] = planPoint(S.d, i);
    return [atlasColumns[x], 57 + y * 30];
  });
  for (const [a, b] of dungeonEdges(S.d))
    if (flags.map || (seen.includes(a) && seen.includes(b)))
      atlasLine(positions[a], positions[b], true);
  positions.forEach(([x, y], i) => {
    const here = S.r === i;
    const shown = flags.map || seen.includes(i);
    if (!shown) {
      petalGlyph(x, y, 2.6, "#ad86558b");
      return;
    }
    const W0 = 65;
    rect(x - W0 / 2 - 1, y - 9, W0 + 2, 16.9, here ? "#934725" : "#aa8452");
    kitSurface("parchment", x - W0 / 2, y - 8, W0, 14.9);
    if (here) {
      rect(x - W0 / 2, y - 8, W0, 14.9, "#c6904b98");
      kitFitting(S.world ? "violetSeal" : "redSeal", x, y - 11, 9.2);
    }
    uiText(
      i === 11 && S.done.includes(S.d) ? "✓ " + rooms[i] : rooms[i],
      x,
      y + 2.4,
      uiInk,
      9.3,
      "center",
      W0 - 4,
    );
    if (
      flags.compass &&
      { 3: !flag("key"), 6: !has(S.d), 8: !flag("great") }[i]
    )
      petalGlyph(x + 26, y - 9, 2.5, "#a25f1a");
  });
  kitObject(3, 328, 177, 25);
  uiText(
    state.keys + (state.keys === 1 ? " key" : " keys"),
    30,
    183,
    uiInk,
    11,
  );
  uiText(
    flags.compass
      ? "Gold marks show unclaimed treasure."
      : "Visited rooms are inked on the floor plan.",
    214,
    182,
    inkFaint,
    7.8,
    "left",
    112,
  );
}

function kitSocket(x, y, diameter) {
  if (kitFitting("socket", x, y, diameter * 1.09)) return;
  oval(x, y + 0.6, diameter / 2, diameter / 2, "#a08051");
  oval(x, y, diameter * 0.41, diameter * 0.42, "#223327");
}

function kitHeart(x, y, fraction) {
  const size = 8.65;
  if (!kitFitting("heart", x, y, size, fraction >= 1 ? 1 : 0.31)) {
    heart(x - 2.5, y - 2.8, fraction ? "#e68174" : "#675343", fraction === 0.5);
    return;
  }
  if (fraction === 0.5) {
    g.save();
    g.beginPath();
    g.rect(x - size / 2, y - size / 2, size / 2, size);
    g.clip();
    kitFitting("heart", x, y, size);
    g.restore();
  }
}

function lampMeter(x, y, width, fraction, from, to) {
  rect(x, y, width, 4.2, "#91683c");
  rect(x + 0.7, y + 0.75, width - 1.4, 2.7, "#171219");
  const amount = (width - 2.1) * clamp(fraction, 0, 1);
  rect(x + 1, y + 1.05, amount, 2.08, from);
  rect(x + 1, y + 1.12, amount, 0.6, to);
}

function statusRibbon(label, y, tint = "wood") {
  const size = 8.25;
  g.font = size + "px " + menuDisplay;
  const width = clamp(g.measureText(label).width + 24, 62, 356);
  const x = 192 - width / 2;
  kitPlate(tint, x, y, width, 12);
  petalGlyph(x + 6, y + 6, 1.55, "#d3a46b");
  petalGlyph(x + width - 6, y + 6, 1.55, "#d3a46b");
  uiText(label, 192, y + 8.7, uiPaper, size, "center", width - 16);
}

function interactionTag(label, center, baseline) {
  g.font = "8px " + menuDisplay;
  const caption = g.measureText(label).width;
  const width = Math.max(45, caption + 26);
  const x = clamp(center - width / 2, 8, W - width - 8);
  const y = baseline - 10;
  kitPlate(S.world ? "slate" : "wood", x, y, width, 13.4);
  keyCap(keyName("act"), x + 2, y + 1.5, 11, 10.1);
  uiText(label, x + 16, y + 9.2, uiPaper, 8);
}

function drawGameHud() {
  const wood = S.world ? "slate" : "wood";
  kitSurface(wood, 0, 0, W, 27);
  const shade = g.createLinearGradient(0, 0, 0, 27);
  shade.addColorStop(0, "#d4a05e23");
  shade.addColorStop(0.24, "#2d1d1924");
  shade.addColorStop(1, "#120a10b4");
  rect(0, 0, W, 27, shade);
  rect(0, 25.8, W, 1.1, "#bf965baf");
  rect(0, 0, W, 0.65, "#dab37292");
  for (const x of [3.3, 107, 275, 380.7]) rivet(x, 23.2, 1);
  const count = Math.min(14, Math.ceil(S.max / 2));
  for (let i = 0; i < count; i++)
    kitHeart(8.7 + i * 7.14, 8.6, clamp((S.hp - 2 * i) / 2, 0, 1));
  kitFitting("lantern", 10.3, 19.45, 13);
  lampMeter(16, 17.55, 46, S.magic / S.mp, "#438981", "#a6e0cd");
  if (S.max > 28) uiText(S.hp + "/" + S.max, 66, 21.3, uiPaper, 7.5);
  if (!kitArt("kit-sign", 113, 0.5, 158, 24.5))
    kitPlate(wood, 113, 1.3, 158, 23.5);
  uiText(place(), 192, 11.8, uiPaper, 12.4, "center", 147);
  const sub =
    S.d >= 0
      ? rooms[S.r] + "  ·  " + D().keys + (D().keys === 1 ? " key" : " keys")
      : S.world
        ? "The Gloam"
        : "Aurelia";
  uiText(sub, 192, 20.2, uiGold, 7.8, "center", 142);
  if (mode === "play") {
    kitSocket(285.5, 12.6, 17.6);
    for (const [x, y] of [
      [283.2, 8.6],
      [288.1, 12.2],
      [284.2, 15.8],
    ]) {
      line(280.9, y, 290.3, y, "#dfb67e");
      rivet(x, y, 0.88);
    }
  }
  for (let i = 0; i < 2; i++) {
    const x = 310 + i * 24.4;
    kitSocket(x, 11.7, 18.9);
    if (S.slots[i] >= 0) glyph(x, 11.4, S.slots[i], 0.95);
    keyCap(keyName(i ? "slot2" : "slot1"), x - 4.1, 19, 8.1, 6.5);
  }
  petalGlyph(354, 8.6, 2.6, "#c18b46");
  petalGlyph(353.65, 8, 1.36, "#ffda93");
  uiText(S.cash, 361, 11.2, uiPaper, 8.8, "left", 17.5);
  instrumentArt(10, 354, 18.2, 8);
  uiText("×" + S.ammo, 361, 21.3, "#e8caa2", 8.3, "left", 17.5);
  const timed = scene.frozen
    ? ["Stillglass", scene.frozen]
    : scene.roots
      ? ["Root bridge", scene.roots]
      : null;
  if (timed) {
    kitPlate(wood, 7, 30, 78, 12);
    uiText(
      timed[0] + " · " + (timed[1] / 60).toFixed(1) + "s",
      46,
      38.65,
      uiPaper,
      8.1,
      "center",
      70,
    );
  }
  const boss = scene.mobs.find((m) => m.big);
  if (!boss) return;
  kitPlate(wood, 103, 28, 178, 23);
  kitFitting(S.world ? "violetSeal" : "redSeal", 110, 36.5, 10);
  kitFitting(S.world ? "violetSeal" : "redSeal", 274, 36.5, 10);
  const state = boss.open
    ? "Core exposed"
    : boss.phase === "warn"
      ? "Windup"
      : boss.big === 1 && boss.phase === "recover"
        ? "Recovering"
        : "";
  uiText(
    state ? boss.name + " · " + state : boss.name,
    192,
    38.6,
    boss.open ? "#dcf0b5" : uiPaper,
    9,
    "center",
    155,
  );
  lampMeter(
    118,
    42.55,
    148,
    boss.hp / boss.maxhp,
    boss.open ? "#68945d" : "#a24c40",
    boss.open ? "#bde8a5" : "#eca57c",
  );
}

function paintDialogue() {
  if (scene.obj) drawScene();
  else title();
  hot = [];
  if (dialog.w.startsWith("Treasury · ")) {
    const y = 88 + (opts.reduced ? 0 : Math.sin(dialog.age / 14) * 2);
    const glow = g.createRadialGradient(192, y, 5, 192, y, 29);
    glow.addColorStop(0, "#efbc78a0");
    glow.addColorStop(1, "#d7a25900");
    rect(158, y - 32, 68, 64, glow);
    kitSocket(192, y, 37);
    if (!instrumentArt(S.d, 192, y, 27)) glyph(192, y, S.d, 1.8);
  }
  const portrait = portraitId(dialog.w);
  const left = portrait < 0 ? 29 : 71;
  const width = 350 - left;
  const height = Math.max(63, 34 + uiLines(dialog.s, 9.25, width).length * 9.6);
  const y = 207 - height;
  const shade = g.createLinearGradient(0, y - 23, 0, 216);
  shade.addColorStop(0, "#15101500");
  shade.addColorStop(1, "#110d15bb");
  rect(0, y - 23, W, 239 - y, shade);
  kitPlate("wood", 15, y - 2, 354, height + 4);
  parchmentSlip(
    portrait < 0 ? 21 : 65,
    y + 3,
    portrait < 0 ? 342 : 296,
    height - 7,
    22,
  );
  if (portrait >= 0) speakerPortrait(portrait, 26, y + 10);
  uiText(dialog.w, left, y + 16, uiInk, 13.2, "left", width);
  leafRule(left, y + 20.5, width, "#754c2b68");
  const visible = dialog.s.slice(
    0,
    opts.fast ? dialog.s.length : Math.floor(dialog.age * 3) + 5,
  );
  uiParagraph(visible, left, y + 33, width, 9.25, 9.6, uiInk);
  keyCap(keyName("act"), 342, 193.3, 12.4, 9.5);
  hitBox(329, 184, 34, 23, finishTalk, "Continue dialogue", true);
}

function paintEnding() {
  const dawn = paintedArt["last-bell"];
  if (artReady(dawn)) g.drawImage(dawn, 0, 0, W, H);
  else {
    if (!titleCache) titleCache = makeLayer(landscape);
    g.drawImage(titleCache, 0, 0, W, H);
    stamp("ending-ione", 310, 161, 1.7, 1, mentorModel);
  }
  const cover = g.createLinearGradient(0, 0, 257, 0);
  cover.addColorStop(0, "#160e16e8");
  cover.addColorStop(0.7, "#2417189e");
  cover.addColorStop(1, "#30202400");
  rect(0, 0, W, H, cover);
  kitObject(0, 45, 37, 28);
  spaced("THE LAST BELL", 67, 40, 1.12, uiGold, 7);
  uiText("Two dawns, one song", 30, 74, uiPaper, 25.5);
  leafRule(32, 85, 178);
  const neighbours = S.quests.filter((q) => q === 3).length;
  const text =
    "Ione lowers the lantern. Across the divide, the bells answer one another. " +
    (neighbours
      ? "The " + neighbours + " neighbours you helped carry the melody home."
      : "In Bellwick, a single lamp waits in the window.") +
    " Rowan takes the morning watch.";
  uiParagraph(text, 32, 102, 179, 9.8, 11.4, uiPaper);
  menuButton("Explore before the finale", 32, 159, 152, retry, true, 19, {
    center: true,
    size: 11,
  });
}

function mountTouchShell() {
  const root = document.querySelector("#touch");
  const strip = document.querySelector("#touch-actions");
  const buttons = strip.querySelector(".touch-menu-buttons");
  const heading = strip.querySelector(".touch-menu-title");
  const excerpt = strip.querySelector(".touch-menu-excerpt");
  const portrait = matchMedia("(pointer: coarse) and (orientation: portrait)");
  const quickSlots = [...root.querySelectorAll("[data-action^=slot]")];
  let list = [],
    signature = "",
    loadout = "";

  function render() {
    root.hidden = mode !== "play";
    const currentLoadout = S.slots.join("/");
    if (!root.hidden && loadout !== currentLoadout) {
      loadout = currentLoadout;
      quickSlots.forEach((button, slot) => {
        const item = S.slots[slot];
        const icon = button.querySelector(".touch-icon");
        icon.classList.toggle("equipped-tool", item >= 0);
        icon.style.backgroundPosition =
          item >= 0
            ? (item % 4) * (100 / 3) + "% " + Math.floor(item / 4) * 50 + "%"
            : "";
        button.title = item >= 0 ? toolsList[item] : "Instrument " + (slot + 1);
      });
    }
    if (
      !portrait.matches ||
      mode === "play" ||
      (mode === "menu" && menu === "settings")
    ) {
      strip.hidden = true;
      signature = "";
      return;
    }
    const title =
      mode === "menu"
        ? menuHeadings[menu]
        : mode === "talk"
          ? dialog.w
          : mode === "ending"
            ? "Two dawns, one song"
            : mode === "defeat"
              ? "The lantern gutters"
              : "Veilbound";
    const text =
      mode === "talk"
        ? dialog.s
        : mode === "menu" && bindAction
          ? "Press a key for " + bindingLabels[bindAction]
          : "";
    const panel = mode === "menu" ? menu : mode;
    list = hot.filter(
      (entry) =>
        entry.label &&
        !(mode === "menu" && menu === "pause" && entry.label === "Close menu"),
    );
    if (panel === "inventory") {
      const tools = new Set(S.items.map((item) => toolsList[item]));
      list = [
        ...list.filter((entry) => !tools.has(entry.label)),
        ...list.filter((entry) => tools.has(entry.label)),
      ];
    }
    const encoded = JSON.stringify([
      panel,
      title,
      text,
      list.map(({ label, active }) => [label, active]),
    ]);
    strip.hidden = !list.length;
    if (signature === encoded) return;
    signature = encoded;
    strip.dataset.panel = panel;
    heading.textContent = title;
    excerpt.textContent = text;
    excerpt.hidden = !text;
    buttons.replaceChildren();
    list.forEach(({ label, active }, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.highlight = String(Boolean(active));
      if (label === "Close menu" || label === "Quest journal")
        button.classList.add("touch-menu-wide");
      button.onclick = () => {
        if (!list[index]) return;
        list[index].fn();
        if (!preferences.open) cv.focus({ preventScroll: true });
        paint();
      };
      buttons.append(button);
    });
  }
  return render;
}
