"use strict";

const fieldSheets = {
  "foes-orchard": 4,
  "foes-gloam": 4,
  "foes-court": 4,
  "foes-border": 2,
  "warders-early": 3,
  "warders-late": 3,
  "entrances-early": 3,
  "entrances-late": 3,
  "room-props": 4,
  mechanisms: 4,
  "field-props": 4,
  "field-structures": 3,
  villagers: 3,
  "interaction-props": 4,
  "field-flora": 3,
  finds: 4,
  "masonry-fittings": 3,
};
const foeSheets = ["foes-orchard", "foes-gloam", "foes-court", "foes-border"];
const foeSizes = [
  25, 29, 25, 24, 29, 23, 29, 26, 29, 24, 26, 26, 27, 25, 27, 25, 27, 25, 27,
  25, 28, 24, 27, 25, 26, 27, 25, 29,
];
const warderSizes = [39, 41, 40, 43, 39, 41, 40, 42, 43, 42];
const footwork = {
  stalk: [0, 0, 1, 1],
  warn: [-1.35, -0.13, 1.06, 0.92],
  rush: [1.85, 0.17, 1.09, 0.98],
  recover: [-0.58, -0.055, 1.015, 0.93],
};

function fieldSprite(name, index, x, y, size, facing = 1, motion) {
  const sheet = paintedArt[name];
  if (!artReady(sheet)) return false;
  const columns = fieldSheets[name];
  const cell = sheet.naturalWidth / columns;
  spriteTransform(x, y, size / cell, facing);
  if (motion) {
    const [angle, width, height] = motion;
    g.rotate(angle);
    g.scale(width, height);
  }
  g.drawImage(
    sheet,
    (index % columns) * cell,
    Math.floor(index / columns) * cell,
    cell,
    cell,
    -cell / 2,
    8 - cell,
    cell,
    cell,
  );
  g.restore();
  return true;
}

function foeSprite(
  id,
  warder,
  x,
  y,
  face = 1,
  stage = "stalk",
  age = 0,
  hurt = 0,
) {
  const name = warder
    ? id < 5
      ? "warders-early"
      : "warders-late"
    : foeSheets[id >> 3];
  const size = warder ? warderSizes[id] : foeSizes[id];
  const frame = opts.reduced
    ? 0
    : Math.sin(age * (stage === "rush" ? 0.29 : 0.14));
  const [lunge, lean, width, height] = footwork[stage] || footwork.stalk;
  const airborne = warder
    ? id === 3 || id === 5
    : ["fly", "spirit"].includes(species[id][0]);
  const bounce = Math.abs(frame) * (airborne ? 1.25 : 0.62);
  const stagger = opts.reduced ? 0 : Math.min(1, hurt / 10);
  const pivot = [
    lean + frame * (airborne ? 0.06 : 0.042) - stagger * 0.11,
    width + frame * 0.016,
    height + bounce * 0.035,
  ];
  return fieldSprite(
    name,
    id % (warder ? 5 : 8),
    x + face * (lunge - stagger * 1.3),
    y - bounce,
    size,
    face,
    pivot,
  );
}

function entranceSprite(d, x, y, size = 49) {
  return fieldSprite(
    d < 5 ? "entrances-early" : "entrances-late",
    d % 5,
    x,
    y,
    size,
  );
}

const furnishings = {
  wagon: [0, 29],
  haycart: [1, 29],
  stall: [2, 35],
  boat: [3, 32],
  nets: [4, 24],
  kiln: [5, 27],
  beacon: [6, 22],
  obelisk: [7, 24],
  memorialStone: [8, 23],
  cairn: [9, 21],
  trellis: [10, 31],
  bench: [11, 25],
  stores: [3, 25],
  archive: [4, 27],
};

function furnishingSprite(kind, x, y, scale = 1, flip = 1) {
  const [index, size] = furnishings[kind];
  const atlas =
    kind === "archive" || kind === "stores"
      ? "field-structures"
      : "field-props";
  return fieldSprite(atlas, index, x, y, size * scale, flip);
}

const roomPropSprites = {
  pot: [0, 14],
  chest: [1, 18],
  well: [3, 17],
  anchor: [4, 15],
  lever: [5, 17],
  plate: [7, 17],
  weight: [8, 13],
  block: [9, 17],
  tablet: [10, 16],
  reset: [11, 15],
};

function puzzleProp(o, active) {
  let [index, size] = roomPropSprites[o.type];
  if (active) index++;
  if (artReady(paintedArt["room-props"])) {
    groundShadow(o.x, o.y, size * 0.46, 2.3);
    return fieldSprite(
      "room-props",
      index,
      o.x,
      o.y + (o.type === "plate" ? 4 : 1.5),
      size,
    );
  }
  return false;
}

function mechanismSprite(d, target, x, y, size = 18, live = false) {
  const index = target ? 10 : d < 0 ? 11 : d;
  if (!artReady(paintedArt.mechanisms)) return false;
  if (live) floorLight(x, y - 7, size * 0.64, size * 0.59, "#b9eac0", 0.54);
  fieldSprite("mechanisms", index, x, y, size);
  if (live) {
    oval(x, y - size * 0.31, 1.34, 1.04, "#91e7c4");
    oval(x - 0.21, y - size * 0.31 - 0.24, 0.65, 0.47, "#f3ffd0");
  }
  return true;
}

const masonryCell = 448;
function chamberStone(d, cave) {
  return paintedArt[
    cave
      ? S.world
        ? "wallstone-b"
        : "wallstone-a"
      : d < 5
        ? "wallstone-a"
        : "wallstone-b"
  ];
}

function stoneTexture(d, cave, x, y, width, height, span = 83, rise = 50) {
  const sheet = chamberStone(d, cave);
  if (!artReady(sheet)) return false;
  g.save();
  g.beginPath();
  g.rect(x, y, width, height);
  g.clip();
  materialFill(sheet, 3, cave ? 5 : d % 5, masonryCell, span, rise, 0, 24);
  g.restore();
  return true;
}

function chamberMasonry(d, cave) {
  if (!artReady(chamberStone(d, cave))) return false;
  const [shadow, , light] = dungeonColors[d];
  stoneTexture(d, cave, 0, 25, W, 27);
  const shade = g.createLinearGradient(0, 26, 0, 56);
  shade.addColorStop(0, "#17203200");
  shade.addColorStop(0.72, "#0c142a59");
  shade.addColorStop(1, "#11131ddd");
  rect(0, 26, W, 28, shade);
  stoneTexture(d, cave, 0, 48.6, W, 3.8, 112, 45);
  rect(0, 48.75, W, 0.55, light + "62");
  rect(0, 51.4, W, 0.8, "#171522c5");
  for (const x of [0, 369]) {
    stoneTexture(d, cave, x, 52, 15, 146, 53, 43);
    const edge = g.createLinearGradient(x, 0, x + 15, 0);
    edge.addColorStop(x ? 0 : 1, light + "58");
    edge.addColorStop(0.48, "#17203211");
    edge.addColorStop(x ? 1 : 0, "#11131dbf");
    rect(x, 52, 15, 146, edge);
  }
  stoneTexture(d, cave, 0, 198, W, 11);
  rect(0, 198, W, 0.7, light + "67");
  rect(0, 207.75, W, 8.25, "#101421");
  rect(0, 209.2, W, 1.35, shadow);
  return true;
}

function chamberWindow(x, d) {
  const index = d === 4 || d === 9 ? 8 : [0, 2, 6, 8].includes(d) ? 6 : 7;
  if (!fieldSprite("masonry-fittings", index, x, 51.5, 23)) return false;
  const color = chamberLight[d];
  floorLight(x, 60, 15, 11, color, 0.15);
  return true;
}

function chamberColumn(x, y, d) {
  const index = [0, 3, 1, 0, 4, 3, 1, 2, 5, 4][d];
  return fieldSprite("masonry-fittings", index, x, y + 2, 22, x > 192 ? -1 : 1);
}

function masonryBlock(o, d) {
  if (!artReady(chamberStone(d, !!S.cave))) return false;
  const { x, y, w, h } = o,
    top = y - 6;
  const [deep, , light] = dungeonColors[d];
  groundShadow(x + w / 2, y + h * 0.7, w * 0.55, h * 0.46 + 1);
  stoneTexture(d, !!S.cave, x, top, w, h + 6, 48, 31);
  const shade = g.createLinearGradient(0, top, 0, y + h);
  shade.addColorStop(0, light + "36");
  shade.addColorStop(0.56, "#24273636");
  shade.addColorStop(1, "#131828bc");
  rect(x, top, w, h + 6, shade);
  for (let a = 0; a < w; a += 10.6) {
    const X = x + a,
      span = Math.min(w - a, 10.6);
    poly(
      [
        [X, top + 2.8],
        [X + 0.85, top],
        [X + span - 0.6, top],
        [X + span, top + 2.8],
      ],
      light + "40",
    );
    rect(X + span - 0.55, top + 1.1, 0.55, 1.65, deep + "c1");
  }
  rect(x, y + h - 0.8, w, 0.8, deep + "d2");
  return true;
}

// The wall mask and passage floor share the same opening. The north passage
// has a visible arch face, while the other sides show the jamb caps from above.
const passageOpenings = {
  up: new Path2D("M177 53V44A15 12 0 0 1 207 44V53Z"),
  down: new Path2D("M176 197H208V216H176Z"),
  left: new Path2D("M0 104H15V134H0Z"),
  right: new Path2D("M369 104H384V134H369Z"),
};

function clipChamberWalls(exits) {
  const solidWall = new Path2D();
  solidWall.rect(0, 25, W, H - 25);
  for (const dir of new Set(exits.map((e) => e.dir)))
    solidWall.addPath(passageOpenings[dir]);
  g.clip(solidWall, "evenodd");
}

function passageRecess(dir, d, palette) {
  const [deep, stone, light] = palette;
  const axis = {
    up: [192, 28, 192, 53],
    down: [192, 216, 192, 197],
    left: [0, 119, 15, 119],
    right: [384, 119, 369, 119],
  }[dir];
  g.save();
  g.clip(passageOpenings[dir]);
  const shade = g.createLinearGradient(...axis);
  shade.addColorStop(0, "#111220");
  shade.addColorStop(0.45, deep);
  shade.addColorStop(0.85, stone);
  shade.addColorStop(1, light);
  rect(0, 25, W, H - 25, shade);
  const sheet = paintedArt["chamber-surfaces"];
  if (artReady(sheet)) {
    const [x, y] =
      dir === "left"
        ? [0, 103]
        : dir === "right"
          ? [351, 103]
          : [175, dir === "up" ? 26 : 191];
    g.globalAlpha *= 0.35;
    g.drawImage(
      sheet,
      (d % 4) * tileSize,
      Math.floor(d / 4) * tileSize,
      tileSize,
      tileSize,
      x,
      y,
      34,
      32,
    );
  }
  g.restore();
}

function passageStone(d, cave, points) {
  if (!artReady(chamberStone(d, cave))) return;
  const mask = new Path2D();
  mask.moveTo(...points[0]);
  for (const point of points.slice(1)) mask.lineTo(...point);
  mask.closePath();
  const xs = points.map(([x]) => x),
    ys = points.map(([, y]) => y);
  const x = Math.min(...xs),
    y = Math.min(...ys);
  g.save();
  g.clip(mask);
  g.globalAlpha *= 0.72;
  stoneTexture(d, cave, x, y, Math.max(...xs) - x, Math.max(...ys) - y, 62, 42);
  g.restore();
}

function passageTread(x, y, w, h, palette, seed, d, cave) {
  stoneCourse(x, y, w, h, palette, seed);
  passageStone(d, cave, [
    [x + 0.62, y + 0.55],
    [x + w - 0.58, y + 0.55],
    [x + w - 0.58, y + h - 0.45],
    [x + 0.62, y + h - 0.45],
  ]);
}

function northPassage(d, palette, cave) {
  const [deep, stone, light] = palette;
  const seed = 910 + d;
  for (let i = 0; i < 4; i++) {
    const y = 42.3 + i * 3.05,
      w = 20 + 3 * i;
    passageTread(192 - w / 2, y, w, 3.1, palette, seed + i * 79, d, cave);
  }
  for (const side of [-1, 1]) {
    const x = 192 + side * 19 - 4;
    rect(x, 42.5, 8, 11, deep);
    passageTread(x, 42.6, 8, 5.7, palette, seed + side, d, cave);
    passageTread(x - 1, 48.4, 10, 6.1, palette, seed + 17 + side, d, cave);
    rect(x + (side > 0 ? 0.25 : 7.1), 44, 0.63, 8, "#151724a3");
    petalGlyph(x + 4, 47.2, 1.47, light + "bc");
  }
  for (let i = 0; i < 11; i++) {
    const a = Math.PI + (i * Math.PI) / 11 + 0.013,
      b = Math.PI + ((i + 1) * Math.PI) / 11 - 0.013;
    const p = (t, r, h) => [192 + Math.cos(t) * r, 44 + Math.sin(t) * h];
    const outer = p(a, 23, 16),
      end = p(b, 23, 16);
    const inner = p(a, 15, 11.7),
      innerEnd = p(b, 15, 11.7);
    const voussoir = [outer, end, innerEnd, inner];
    poly(voussoir, i === 5 ? light : stone);
    passageStone(d, cave, voussoir);
    poly([outer, end, p(b, 21.6, 14.5), p(a, 21.6, 14.5)], light + "91");
    poly([p(a, 16.4, 12.65), p(b, 16.4, 12.65), innerEnd, inner], deep);
    if (i !== 5)
      line(
        ...p(a + 0.057, 19.7, 13.7),
        ...p(b - 0.059, 18.7, 13.1),
        deep + "80",
      );
  }
  petalGlyph(192, 30.4, 1.28, deep);
}

function sidePassage(dir, d, palette, cave) {
  const [deep, , light] = palette;
  g.save();
  if (dir === "right") g.transform(-1, 0, 0, 1, W, 0);
  for (let j = 0; j < 3; j++) {
    const x = 3.5 + j * 4.1;
    poly(
      [
        [x, 106],
        [x + 3.9, 107],
        [x + 3.9, 131],
        [x, 132],
      ],
      deep + "b6",
    );
    line(x + 3.9, 107, x + 3.9, 131, light + "96");
  }
  for (const y of [100.8, 134.3]) {
    rect(0, y, 16.7, 4.2, deep);
    passageTread(0, y - 2.6, 17, 4.6, palette, 812 * d + y, d, cave);
    rect(12.4, y + 1.7, 5.6, 3.2, deep);
    rect(12.4, y + 1.35, 5.6, 0.73, light + "91");
    petalGlyph(9.5, y - 0.2, 1.35, light + "c2");
  }
  g.restore();
}

function southPassage(d, palette, cave) {
  const [deep, , light] = palette;
  const sill = [
    [177, 196],
    [207, 196],
    [204, 211],
    [180, 211],
  ];
  poly(sill, deep + "8c");
  for (let j = 0; j < 4; j++) {
    const y = 196 + j * 3.9,
      w = 29 - j * 1.7;
    passageTread(192 - w / 2, y, w, 3.7, palette, 803 * d + j * 61, d, cave);
  }
  for (const x of [170, 207]) {
    rect(x, 197, 7, 11, deep);
    passageTread(x - 1, 194.8, 9, 5.1, palette, x * d + 83, d, cave);
    rect(x, 200.1, 7, 0.8, light + "9d");
  }
}

function paintPassages(d, cave) {
  const palette = cave ? ["#292539", "#554b57", "#a19489"] : dungeonColors[d];
  for (const dir of new Set(scene.exits.map((e) => e.dir))) {
    passageRecess(dir, cave ? 10 + S.world : d, palette);
    if (dir === "up") northPassage(d, palette, cave);
    else if (dir === "down") southPassage(d, palette, cave);
    else sidePassage(dir, d, palette, cave);
  }
}

function passageGate(exit, d) {
  const arena = S.r === 11 && scene.mobs.length > 0;
  const lock = locked(exit.to);
  if (!lock && !arena) return;
  const [deep, , light] = dungeonColors[d];
  g.save();
  const dir = exit.dir;
  if (dir === "up") {
    g.clip(passageOpenings.up);
    g.translate(192, 51);
  } else if (dir === "down") {
    g.translate(192, 208);
    g.scale(1, 0.68);
  } else {
    g.clip(passageOpenings[dir]);
    if (dir === "right") g.transform(-1, 0, 0, 1, W, 0);
    g.transform(0.18, 1, -0.27, 0.24, 8.4, 119);
  }
  const iron = g.createLinearGradient(-14, -15, 11, 4);
  iron.addColorStop(0, "#6e4a44");
  iron.addColorStop(0.4, "#b78d5f");
  iron.addColorStop(0.66, "#594049");
  iron.addColorStop(1, "#3b3040");
  for (let i = -3; i <= 3; i++) {
    const x = i * 4.06;
    poly(
      [
        [x - 1.12, 0],
        [x - 1.12, -16],
        [x, -20],
        [x + 1.12, -16],
        [x + 1.12, 0],
      ],
      deep,
    );
    poly(
      [
        [x - 0.7, -0.75],
        [x - 0.7, -15.9],
        [x, -18.8],
        [x + 0.73, -15.9],
        [x + 0.73, -0.75],
      ],
      iron,
    );
  }
  for (const y of [-12, -4]) {
    rect(-14.5, y, 29, 2.4, deep);
    rect(-14.4, y + 0.22, 28.8, 1.58, iron);
    rect(-14.26, y + 0.24, 28.52, 0.36, "#e1be8796");
    for (const x of [-12.2, -8.1, 8.1, 12.2])
      oval(x, y + 0.94, 0.56, 0.5, "#dec096");
  }
  const seal = arena || lock.includes("Crown Key");
  oval(0, -7.2, seal ? 4.4 : 3.6, seal ? 4.8 : 4.0, "#241e2a");
  oval(0, -7.5, seal ? 3.95 : 3.18, seal ? 4.1 : 3.5, iron);
  if (seal) petalGlyph(0, -7.6, 2.02, light);
  else {
    oval(0, -8.15, 0.82, 0.89, "#2b2130");
    poly(
      [
        [-0.38, -7.8],
        [0.38, -7.8],
        [0.8, -5.95],
        [-0.8, -5.95],
      ],
      "#2b2130",
    );
  }
  g.restore();
}
