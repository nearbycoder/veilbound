"use strict";

const paintedTiles = new WeakMap();
const tileSize = 256;
const regionTextureSize = [
  92, 113, 106, 102, 130, 103, 98, 84, 151, 122, 117, 108,
];
const dungeonTextureSize = [112, 102, 120, 100, 85, 99, 126, 110, 120, 118];
const regionalLights = [
  "#f5ca80",
  "#b1c9a2",
  "#ffb283",
  "#e8dec3",
  "#f8d685",
  "#e9c293",
  "#e8d4b1",
  "#f8dba2",
  "#ffd296",
  "#a6cfd5",
  "#bddeb9",
  "#f5c792",
];
const veilLights = [
  "#d2a3d1",
  "#96e0d4",
  "#ed9d81",
  "#bbcaf4",
  "#80ccc0",
  "#d8a8df",
  "#b5d3eb",
  "#ddadc4",
  "#efa384",
  "#9cbedf",
  "#b2dfce",
  "#bdaedd",
];

function materialFill(
  sheet,
  columns,
  index,
  cell,
  width,
  height,
  x = 0,
  y = 0,
) {
  if (!artReady(sheet)) return false;
  let tiles = paintedTiles.get(sheet);
  if (!tiles) {
    tiles = [];
    paintedTiles.set(sheet, tiles);
  }
  if (!tiles[index]) {
    const tile = document.createElement("canvas");
    tile.width = tile.height = cell;
    tile
      .getContext("2d")
      .drawImage(
        sheet,
        (index % columns) * cell,
        Math.floor(index / columns) * cell,
        cell,
        cell,
        0,
        0,
        cell,
        cell,
      );
    tiles[index] = tile;
  }
  const fill = g.createPattern(tiles[index], "repeat");
  fill.setTransform(
    new DOMMatrix().translate(x, y).scale(width / cell, height / cell),
  );
  g.fillStyle = fill;
  g.fillRect(0, 0, W, H);
  return true;
}

function paintedCutout(name, index, columns, x, y, size, flip = 1, rise = 1) {
  const sheet = paintedArt[name];
  if (!artReady(sheet)) return false;
  spriteTransform(x, y, size / tileSize, flip);
  g.scale(1, rise);
  g.drawImage(
    sheet,
    (index % columns) * tileSize,
    Math.floor(index / columns) * tileSize,
    tileSize,
    tileSize,
    -tileSize / 2,
    -248,
    tileSize,
    tileSize,
  );
  g.restore();
  return true;
}

function paintRegionFloor(area, world, roadImage) {
  const size = regionTextureSize[area],
    sheet = paintedArt["world-surfaces"];
  if (
    !materialFill(
      sheet,
      6,
      world * 12 + area,
      tileSize,
      size,
      size * 0.77,
      area * 16,
      8,
    )
  )
    return false;

  const streets = makeLayer(() => {
    const tile = [3, 6, 7].includes(area) ? 1 : 2;
    if (
      !materialFill(
        paintedArt["village-ground"],
        3,
        world * 3 + tile,
        384,
        102,
        78,
      )
    )
      rect(0, 0, W, H, world ? "#65516a" : "#b89565");
    if (area === 2 || area === 8)
      rect(0, 0, W, H, area === 8 ? "#dca45755" : "#54334050");
    g.globalCompositeOperation = "destination-in";
    drawTexture(roadImage, 0, 0, W, H);
  });
  g.drawImage(streets, 0, 0, W, H);

  const light = (world ? veilLights : regionalLights)[area];
  floorLight(158, 106, 155, 103, light, world ? 0.14 : 0.18);
  floorLight(297, 172, 98, 66, light, 0.095);
  return true;
}

function regionLandmark(x, y, size = 38, flip = 1) {
  return paintedCutout(
    "region-props",
    S.world * 12 + S.area,
    4,
    x,
    y,
    size,
    flip,
  );
}

function decorateRegion(r) {
  if (!artReady(paintedArt["region-props"])) return;
  const a = S.area;
  const silhouettes = [
    [12, 55, 63],
    [94, 52, 49],
    [288, 54, 51],
    [369, 60, 57],
    [0, 172, 51],
    [367, 199, 62],
  ];
  for (const [i, [x, y, size]] of silhouettes.entries()) {
    if (trailAt(x, y) || waterAt(x, y)) continue;
    groundShadow(x, y, size * 0.25, size * 0.07);
    regionLandmark(x, y, size * (0.8 + r() * 0.2), i % 2 ? -1 : 1);
  }
  if (S.world) {
    for (const [x, y, size] of [
      [44, 82, 0.48],
      [151, 93, 0.55],
      [235, 72, 0.77],
      [54, 154, 0.61],
      [305, 169, 0.53],
      [135, 190, 0.78],
    ]) {
      if (trailAt(x, y) || waterAt(x, y)) continue;
      villageSprite("flowers", x, y, 1, size, x % 2 ? -1 : 1);
      floorLight(x, y - 2, 12 * size, 7 * size, veilLights[a], 0.12);
    }
  }
}

function paintChamberFloor(d, cave) {
  const cell = cave ? 10 + S.world : d;
  const span = cave ? 118 : dungeonTextureSize[d];
  if (
    !materialFill(
      paintedArt["chamber-surfaces"],
      4,
      cell,
      tileSize,
      span,
      span * 0.73,
      scene.seed % 61,
      scene.seed % 47,
    )
  )
    return false;
  if (d === 5 && !cave) rect(0, 28, W, H - 28, "#181b3858");
  else if (d === 7 && !cave) rect(0, 28, W, H - 28, "#16273b37");
  return true;
}

const chamberLayouts = [
  {
    beams: [[192, 61, 88, 42]],
    zones: [[192, 101, 63, 32]],
    relics: [
      [56, 82, 45],
      [328, 82, 45],
    ],
  },
  {
    beams: [[93, 87, 52, 39]],
    zones: [
      [115, 127, 61, 40],
      [264, 112, 56, 39],
    ],
    relics: [
      [78, 71, 49],
      [323, 163, 40],
    ],
  },
  {
    beams: [
      [109, 68, 64, 44],
      [285, 68, 64, 44],
    ],
    zones: [
      [110, 110, 53, 31],
      [284, 110, 53, 31],
    ],
    relics: [
      [35, 105, 42],
      [350, 129, 42],
    ],
  },
  {
    beams: [[265, 84, 73, 42]],
    zones: [[256, 92, 68, 31]],
    relics: [
      [80, 71, 42],
      [328, 70, 35],
      [312, 180, 35],
    ],
  },
  {
    beams: [[192, 74, 39, 77]],
    zones: [[192, 125, 29, 65]],
    relics: [
      [43, 157, 44],
      [347, 84, 44],
    ],
  },
  {
    beams: [[192, 98, 97, 53]],
    zones: [[192, 128, 72, 47]],
    relics: [
      [48, 89, 49],
      [338, 89, 49],
    ],
  },
  {
    beams: [[192, 83, 61, 43]],
    zones: [[192, 101, 52, 30]],
    relics: [
      [111, 67, 46],
      [274, 67, 46],
    ],
  },
  {
    beams: [
      [137, 95, 63, 40],
      [246, 144, 58, 38],
    ],
    zones: [
      [108, 103, 41, 28],
      [270, 153, 44, 31],
    ],
    relics: [
      [43, 85, 45],
      [343, 167, 48],
    ],
  },
  {
    beams: [[192, 87, 43, 74]],
    zones: [
      [192, 120, 33, 62],
      [192, 120, 56, 30],
    ],
    relics: [
      [83, 77, 44],
      [302, 77, 44],
    ],
  },
  {
    beams: [[65, 160, 77, 47]],
    zones: [[74, 148, 65, 37]],
    relics: [
      [58, 64, 37],
      [324, 97, 42],
    ],
  },
  {
    beams: [
      [130, 87, 59, 40],
      [253, 87, 59, 40],
    ],
    zones: [[192, 128, 48, 51]],
    relics: [
      [47, 83, 49],
      [337, 83, 49],
      [331, 182, 40],
    ],
  },
  {
    beams: [
      [192, 103, 127, 63],
      [192, 156, 100, 45],
    ],
    zones: [[192, 124, 95, 57]],
    relics: [
      [55, 77, 64],
      [329, 77, 64],
      [27, 174, 44],
      [354, 174, 44],
    ],
  },
];

// Motifs follow each chamber's purpose and keep puzzles on their existing footprints.
const chamberInlays = [
  [[192, 82, 72, 56, 0]],
  [
    [100, 101, 61, 67, 1],
    [259, 122, 93, 52, 0],
  ],
  [
    [109, 126, 65, 48, 1],
    [275, 126, 65, 48, 1],
  ],
  [[268, 113, 101, 66, 0]],
  [[192, 130, 67, 135, 0]],
  [[192, 120, 158, 93, 1]],
  [[192, 107, 114, 59, 0]],
  [
    [106, 128, 70, 84, 0],
    [277, 128, 70, 84, 0],
  ],
  [[192, 119, 120, 104, 1]],
  [[128, 153, 127, 57, 0]],
  [
    [112, 126, 41, 124, 0],
    [272, 126, 41, 124, 0],
  ],
  [[192, 121, 251, 123, 1]],
];

function chamberInlay(x, y, width, height, points, deep, color) {
  function border(w, h) {
    return points
      ? [
          [x, y - h],
          [x + w, y],
          [x, y + h],
          [x - w, y],
        ]
      : [
          [x - w, y - h + 12],
          [x - w + 16, y - h],
          [x + w - 16, y - h],
          [x + w, y - h + 12],
          [x + w, y + h - 12],
          [x + w - 16, y + h],
          [x - w + 16, y + h],
          [x - w, y + h - 12],
        ];
  }
  const w = width / 2,
    h = height / 2;
  poly(border(w + 2, h + 1.2), deep + "91");
  poly(border(w, h), color + "36");
  poly(border(w - 1.4, h - 1.3), deep + "4e");
  const inset = border(w - 3.8, h - 3.2);
  for (const [i, start] of inset.entries())
    line(...start, ...inset[(i + 1) % inset.length], color + "46");
  for (const [X, Y] of [
    [x, y - h],
    [x + w, y],
    [x, y + h],
    [x - w, y],
  ])
    petalGlyph(X, Y, 2, color + "76");
}

function paintChamberInlays(d, cave, room) {
  const [deep, , light] = dungeonColors[d];
  const role = cave ? [5, 2, 8][S.area % 3] : room;
  for (const inlay of chamberInlays[role])
    chamberInlay(
      ...inlay,
      deep,
      cave ? (S.world ? "#bbafd8" : "#c7986f") : light,
    );
}

function dressChamber(d, cave, room) {
  const [base, , highlight] = dungeonColors[d];
  const tint = cave ? (S.world ? "#adc1e7" : "#e8af77") : highlight;
  const layout = cave
    ? chamberLayouts[[4, 7, 9][S.area % 3]]
    : chamberLayouts[room];
  for (const [x, y, w, h] of layout.beams)
    floorLight(x, y, w, h, tint, room === 11 ? 0.33 : 0.24);
  for (const [x, y, w, h] of layout.zones) {
    oval(x + 1, y + 2, w + 2, h + 1, base + "28");
    ovalLine(x, y, w, h, tint + "41", 0.68);
    for (const sign of [-1, 1]) {
      petalGlyph(x + w * sign, y, 1.45, tint + "84");
      petalGlyph(x, y + h * sign, 1.45, tint + "84");
    }
  }
  if (cave) {
    for (const [x, y, size] of layout.relics) {
      floorLight(x, y, 21, 11, tint, 0.19);
      if (S.world)
        villageSprite("flowers", x, y, 1, size / 38, x > 192 ? -1 : 1);
      else rock(x, y, size / 27, false);
    }
    return;
  }
  for (const [x, y, size] of layout.relics) {
    groundShadow(x, y, size * 0.31, size * 0.071);
    floorLight(x, y + 1, size * 0.53, size * 0.26, tint, 0.24);
    paintedCutout("sanctum-props", d, 5, x, y, size, x > 192 ? -1 : 1);
  }
}

function paintedGuardian(m, y, face, pose, phase) {
  if (m.big !== 2 || !artReady(paintedArt.guardians)) return false;
  const d = S.d;
  const sizes = [49, 52, 49, 50, 47, 51, 52, 50, 52, 53];
  const stride = opts.reduced ? 0 : [0, 1, 0, -1][phase];
  const stretch = { warn: 0.91, rush: 1.06, recover: 0.97 }[pose] ?? 1;
  if (m.open) floorLight(m.x, y - 10, 32, 23, colors[d], 0.225);
  paintedCutout(
    "guardians",
    m.form && d === 9 ? 10 : d,
    4,
    m.x,
    y + stride * 0.5,
    sizes[d],
    face,
    stretch + stride * 0.014,
  );
  return true;
}

function instrumentArt(index, x, y, size) {
  return paintedCutout("instruments", index, 4, x, y + size * 0.48, size);
}

function artPanel(index, x, y, w, h, size, alpha = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const light = g.createRadialGradient(
    x + w / 2,
    y + h * 0.49,
    2,
    x + w / 2,
    y + h * 0.49,
    w * 0.61,
  );
  light.addColorStop(0, "#a8836c77");
  light.addColorStop(0.72, "#25264578");
  light.addColorStop(1, "#15182a00");
  g.fillStyle = light;
  g.fillRect(x, y, w, h);
  g.globalAlpha *= alpha;
  paintedCutout(
    "interface",
    index,
    2,
    x + w / 2,
    y + h * 0.5 + size * 0.48,
    size,
  );
  g.restore();
}

const menuDisplay = '"Veil Serif", Georgia, serif';
const uiPaper = "#fff2d4";
const uiGold = "#e1ba83";
const uiMuted = "#c3c1cd";
const uiRule = "#bd9d6855";
const menuHeadings = {
  pause: "Journey paused",
  inventory: "Equipment",
  map: "Cartographer’s map",
  journal: "Quest journal",
  bindings: "Keyboard bindings",
  bells: "Bell towers",
  confirm: "New journey",
};

function menuRule(x, y, w) {
  const ink = g.createLinearGradient(x, y, x + w, y);
  ink.addColorStop(0, "#c5a67500");
  ink.addColorStop(0.2, "#c5a67581");
  ink.addColorStop(0.8, "#c5a67581");
  ink.addColorStop(1, "#c5a67500");
  rect(x, y, w, 0.45, ink);
  petalGlyph(x + w * 0.5, y, 1.4, "#d2b281");
}

function menuButton(text, x, y, w, fn, active = false, height = 13) {
  const fill = g.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, active ? "#f1d69f" : "#353650");
  fill.addColorStop(1, active ? "#b88955" : "#211f36");
  rect(x, y, w, height, active ? "#e0b884" : "#756785");
  rect(x + 0.6, y + 0.6, w - 1.2, height - 1.2, fill);
  rect(x + 2, y + 1.35, w - 4, 0.45, active ? "#fff0c467" : "#ccb3a43b");
  if (active) petalGlyph(x + 5.4, y + height * 0.53, 1.65, "#5d3940");
  txt(
    text,
    x + (active ? 11 : 6),
    y + height * 0.71,
    active ? "#311e2d" : uiPaper,
    8.55,
    "left",
    menuDisplay,
  );
  hitBox(x, y, w, height, fn);
}

function menuPill(text, x, y, w, active = false) {
  rect(x, y, w, 9, active ? "#daba87" : "#1a192b");
  rect(x + 0.6, y + 0.6, w - 1.2, 7.8, active ? "#bd9463" : "#44405a");
  txt(text, x + w / 2, y + 6.5, active ? "#241b2c" : uiPaper, 5.5, "center");
}

function drawMenuBacking() {
  const backdrop =
    menuFrom === "title"
      ? (titleCache ??= makeLayer(landscape))
      : (roomCache ??= makeLayer(S.d >= 0 || S.cave ? indoorArt : surfaceArt));
  g.drawImage(backdrop, 0, 0, W, H);
  rect(0, 0, W, H, "#0b0c1bb0");
  frame(15, 12, 354, 192);
  menuRule(24, 42, 336);
  txt(menuHeadings[menu], 30, 34, uiPaper, 17, "left", menuDisplay);
  menuButton("×", 341, 19, 17, closeMenu, false, 16);
}

function questEntries() {
  return [
    ...wrap(goal(), 49),
    ...names.map((name, i) => (S.done.includes(i) ? "✓ " : "◇ ") + name),
    ...S.journal
      .slice()
      .reverse()
      .flatMap((entry) => wrap(entry, 49)),
  ];
}

function journalPageCount() {
  return Math.max(1, Math.ceil(questEntries().length / 12));
}

function drawQuestJournal() {
  artPanel(1, 237, 51, 121, 125, 111, 0.92);
  rect(234, 48, 0.55, 124, uiRule);
  const lines = questEntries();
  for (const [index, entry] of lines
    .slice(page * 12, page * 12 + 12)
    .entries()) {
    const y = 55 + index * 10;
    if (index % 2 === 0) rect(29, y - 7, 199, 9.1, "#0d132233");
    txt(
      entry,
      34,
      y,
      entry.startsWith("✓")
        ? "#b8dbb9"
        : index === 0 && page === 0
          ? uiGold
          : uiPaper,
      7.4,
      "left",
      menuDisplay,
    );
  }
  menuButton("‹ Previous", 33, 180, 55, () => (page = Math.max(0, page - 1)));
  menuButton(
    "Next ›",
    94,
    180,
    55,
    () => (page = Math.min(journalPageCount() - 1, page + 1)),
  );
  txt(
    `Page ${page + 1} / ${journalPageCount()}`,
    225,
    190,
    uiMuted,
    6.1,
    "right",
  );
}

function drawEquipment() {
  const id = S.items[sel];
  if (!S.items.length)
    txt(
      "Instruments you discover will appear here.",
      33,
      61,
      uiMuted,
      8,
      "left",
      menuDisplay,
    );
  S.items.forEach((item, i) => {
    const x = 30 + (i % 6) * 32.5;
    const y = 54 + Math.floor(i / 6) * 36;
    const equipped = S.slots.indexOf(item);
    frame(x, y, 29.5, 31);
    if (i === sel) {
      rect(x + 1, y + 1.5, 27.5, 28, "#bda37e3a");
      rect(x + 3, y + 28, 23.5, 0.8, uiGold);
    }
    glyph(x + 15, y + 16, item, 1.24);
    if (equipped >= 0)
      menuPill(keyName(equipped ? "slot2" : "slot1"), x + 1, y + 1, 10, true);
    hitBox(x, y, 29.5, 31, () => (sel = i));
  });
  rect(232, 48, 0.55, 130, uiRule);
  if (id === undefined) artPanel(2, 235, 49, 123, 126, 103);
  else {
    artPanel(2, 238, 48, 118, 126, 110, 0.22);
    if (!instrumentArt(id, 296, 101, 75)) glyph(296, 102, id, 4.5);
    txt(toolsList[id], 296, 153, uiPaper, 13, "center", menuDisplay);
    menuRule(248, 162, 96);
    wrap(descriptions[id], 47).forEach((line, i) =>
      txt(line, 34, 142 + i * 10, uiPaper, 7.8, "left", menuDisplay),
    );
    menuButton("Equip " + keyName("slot1"), 33, 172, 62, () => menuChoose(sel));
    menuButton("Equip " + keyName("slot2"), 102, 172, 62, () =>
      menuChoose(sel, -1),
    );
  }
  menuButton("Quest journal", 258, 179, 86, () => openMenu("journal"));
}

function drawPause() {
  artPanel(0, 216, 85, 132, 58, 60, 0.93);
  rect(178, 52, 0.55, 134, uiRule);
  entries().forEach((label, i) =>
    menuButton(
      label,
      31,
      46 + i * 15.2,
      136,
      () => {
        sel = i;
        menuChoose(i);
      },
      sel === i,
      13.5,
    ),
  );
  spaced("CURRENT OBJECTIVE", 188, 58, 0.64, uiGold, 5.6);
  wrap(goal(), 41).forEach((line, i) =>
    txt(line, 188, 71 + i * 9.5, uiPaper, 8, "left", menuDisplay),
  );
  const seals = S.done.filter((i) => i < 4).length;
  const fragments = S.done.length - seals;
  menuRule(185, 147, 167);
  for (const [y, label, count, max, hue] of [
    [161, "Aurelia seals", seals, 4, "#c8d7a7"],
    [180, "Crown fragments", fragments, 6, "#dbbcda"],
  ]) {
    txt(label, 189, y, uiPaper, 8.5, "left", menuDisplay);
    txt(`${count} / ${max}`, 349, y, hue, 6.6, "right");
    for (let i = 0; i < max; i++)
      petalGlyph(191 + i * 9.5, y + 6.5, 2.2, i < count ? hue : "#6d617c");
  }
}

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

function drawBindings() {
  Object.keys(baseKeys).forEach((action, i) => {
    const x = 32 + Math.floor(i / 7) * 165;
    const y = 49 + (i % 7) * 17;
    menuButton(
      bindingLabels[action],
      x,
      y,
      155,
      () => {
        sel = i;
        menuChoose(i);
      },
      sel === i,
      14,
    );
    menuPill(keyName(action), x + 111, y + 2.3, 40, bindAction === action);
  });
  txt(
    bindAction
      ? "Press a key for " + bindingLabels[bindAction]
      : "Choose an action to change its primary binding.",
    34,
    181,
    uiGold,
    8,
    "left",
    menuDisplay,
  );
}

function drawBells() {
  artPanel(0, 229, 49, 125, 136, 112);
  rect(223, 51, 0.55, 134, uiRule);
  const destinations = entries();
  const first = Math.floor(sel / 8) * 8;
  destinations.slice(first, first + 8).forEach((label, displayIndex) => {
    const i = first + displayIndex;
    menuButton(
      label,
      32,
      48 + displayIndex * 16.6,
      180,
      () => {
        sel = i;
        menuChoose(i);
      },
      sel === i,
    );
  });
  if (destinations.length > 8) {
    menuButton("‹ Previous", 34, 182, 65, () => (sel = Math.max(0, first - 8)));
    menuButton(
      "Next ›",
      107,
      182,
      60,
      () => (sel = Math.min(destinations.length - 1, first + 8)),
    );
  }
  txt(
    `${S.bells.length} bells discovered`,
    290,
    182,
    uiMuted,
    7,
    "center",
    menuDisplay,
  );
}

function drawConfirmation() {
  artPanel(3, 231, 49, 122, 129, 103);
  txt("Begin again?", 37, 67, uiPaper, 16, "left", menuDisplay);
  txt(
    "A new journey replaces the local save.",
    37,
    83,
    "#f1c3b8",
    8.5,
    "left",
    menuDisplay,
  );
  entries().forEach((label, i) =>
    menuButton(
      label,
      37,
      105 + i * 24,
      165,
      () => menuChoose(i),
      i === sel,
      19,
    ),
  );
}

function paintGameMenu() {
  drawMenuBacking();
  if (menu === "pause") drawPause();
  else if (menu === "map") mapArt();
  else if (menu === "inventory") drawEquipment();
  else if (menu === "journal") drawQuestJournal();
  else if (menu === "bindings") drawBindings();
  else if (menu === "bells") drawBells();
  else if (menu === "confirm") drawConfirmation();
}

function paintDefeat() {
  rect(0, 0, W, H, "#21132bc5");
  frame(72, 45, 240, 132);
  artPanel(0, 136, 48, 112, 49, 37);
  txt("The lantern gutters", 192, 112, uiPaper, 18, "center", menuDisplay);
  txt(
    "Return to the last bell you rang.",
    192,
    127,
    uiMuted,
    7.4,
    "center",
    menuDisplay,
  );
  menuButton("Return to checkpoint", 118, 140, 148, retry, true, 19);
}
