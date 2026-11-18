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
  const outline = new Path2D(),
    pointsOnEdge = border(w, h);
  outline.moveTo(...pointsOnEdge[0]);
  for (const start of pointsOnEdge.slice(1)) outline.lineTo(...start);
  outline.closePath();
  g.save();
  g.lineJoin = "round";
  g.lineWidth = 3.1;
  g.strokeStyle = deep + "a3";
  g.stroke(outline);
  g.lineWidth = 1.3;
  g.strokeStyle = color + "a5";
  g.stroke(outline);
  g.restore();
  const inset = border(w - 3.1, h - 2.7);
  for (const [i, start] of inset.entries())
    line(...start, ...inset[(i + 1) % inset.length], color + "60");
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
