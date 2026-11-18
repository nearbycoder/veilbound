"use strict";

const cardinalSteps = [
  [0, -1, "up", "north"],
  [-1, 0, "left", "west"],
  [1, 0, "right", "east"],
  [0, 1, "down", "south"],
];
const trailEnds = {
  up: [192, 46],
  left: [17, 119],
  right: [367, 119],
  down: [192, 194],
};

const openingSeals = [0, 1, 2, 3];
function stableVeil() {
  return openingSeals.every((d) => S.done.includes(d));
}

function routeBetween(start, end, neighbors) {
  const paths = [[start]];
  const visited = new Set([start]);
  for (const route of paths) {
    const current = route[route.length - 1];
    if (current === end) return route;
    for (const next of neighbors(current)) {
      if (visited.has(next)) continue;
      visited.add(next);
      paths.push([...route, next]);
    }
  }
  return [];
}

function worldNeighbors(area, realm) {
  const x = area % 4;
  const y = Math.floor(area / 4);
  return cardinalSteps
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([col, row]) => col >= 0 && col < 4 && row >= 0 && row < 3)
    .map(([col, row]) => row * 4 + col)
    .filter((next) => surfaceConnection(area, next, realm));
}

function dungeonDestination() {
  const flags = D().flags;
  if (!flags.map)
    return { room: 1, task: "Find the dungeon map", type: "chest" };
  if (!flags.key)
    return {
      room: 3,
      task: "Find the small key",
      type: flags.p3 ? "chest" : "tablet",
    };
  if (!flags.p2)
    return { room: 2, task: "Solve the first mechanism", type: "tablet" };
  if (!flags.mini) return { room: 5, task: "Defeat the warder" };
  if (!has(S.d))
    return { room: 6, task: "Claim the " + toolsList[S.d], type: "chest" };
  if (!flags.p7)
    return { room: 7, task: "Master the " + toolsList[S.d], type: "tablet" };
  if (!flags.great)
    return {
      room: 8,
      task: "Find the Crown Key",
      type: flags.p8 ? "chest" : "tablet",
    };
  return { room: 11, task: "Restore " + names[S.d] };
}

function dungeonRoute(destination) {
  const edges = dungeonEdges(S.d);
  return routeBetween(S.r, destination, (from) =>
    edges
      .filter((edge) => edge.includes(from))
      .map(([a, b]) => (a === from ? b : a))
      .filter((to) => {
        const lock = locked(to, from);
        return !lock || (lock === "key" && D().keys > 0 && D().flags.p2);
      }),
  );
}

function exitTarget(to) {
  const exit = scene.exits.find((entry) => entry.to === to);
  if (!exit) return null;
  const [, , , name] = cardinalSteps.find(([, , dir]) => dir === exit.dir);
  const [x, y] = trailEnds[exit.dir];
  return { x, y, direction: exit.dir, name };
}

function objectiveAt(title, type, detail = "") {
  return {
    title,
    detail,
    marker: scene.obj?.find((o) => o.type === type && !o.gone),
  };
}

function journeyObjective() {
  if (showcase) return showcaseObjective();
  if (S.end || !scene.obj) return null;
  if (S.cave) {
    if (S.flags["cave" + loc()]) {
      const marker = exitTarget(-1);
      return {
        title: "Return to the surface",
        detail: "South passage",
        marker,
      };
    }
    const step = [
      "Clear the cave trial",
      "Strike the three marks",
      "Slide the stone onto the plate",
    ][S.area % 3];
    return { title: step, detail: "Claim the cave’s chest after the trial" };
  }
  if (S.d >= 0) {
    if (S.done.includes(S.d))
      return objectiveAt("Return to the surface", "return");
    if (S.r === 11 && scene.mobs.some((m) => m.big === 2))
      return { title: "Expose the guardian", detail: bossHints[S.d] };
    const { room, task, type } = dungeonDestination();
    if (S.r === room) return objectiveAt(task, type);
    const [, next] = dungeonRoute(room);
    const marker = exitTarget(next);
    return {
      title: task,
      detail: marker ? rooms[next] + " · " + marker.name : rooms[room],
      marker,
    };
  }
  const d = names.findIndex((_, i) => !S.done.includes(i));
  if (d < 0) return null;
  const needsSatchel = !has(10) && !S.world;
  if (needsSatchel && S.area === 5)
    return objectiveAt("Take Ione’s satchel", "guide", "Speak to Merin");
  if (
    S.area === 5 &&
    !S.world &&
    has(10) &&
    !S.flags.sawGloam &&
    !S.done.length
  )
    return objectiveAt(
      "Raise Ione’s lantern",
      "rift",
      "Find the small stone arch",
    );
  if (S.world && S.area === 5 && !stableVeil() && !S.flags.heardEcho)
    return objectiveAt(
      "Listen for Ione’s trail",
      "guide",
      "Speak to Nelle on the square",
    );
  const realm = Number(d >= 4);
  if (!needsSatchel && S.world === realm && S.area === sites[d])
    return objectiveAt("Enter " + names[d], "entrance");
  const rift = scene.obj.find((o) => o.type === "rift");
  if (S.world !== realm && rift)
    return objectiveAt(
      "Cross to " + (realm ? "the Gloam" : "Aurelia"),
      "rift",
      "Raise the lantern at the arch",
    );
  const end = needsSatchel || S.world !== realm ? 5 : sites[d];
  const [, next] = routeBetween(S.area, end, (area) =>
    worldNeighbors(area, S.world),
  );
  const marker = exitTarget(next);
  const namesInRealm = S.world ? gloam : places;
  if (!marker)
    return { title: "Reach " + names[d], detail: "Check the world map" };
  return {
    title: needsSatchel
      ? "Get Ione’s satchel"
      : "Travel to " + namesInRealm[end],
    detail: namesInRealm[next] + " · " + marker.name,
    marker,
  };
}

function worldWaypoint(realm) {
  if (S.end || showcase) return null;
  if (!has(10) && realm === 0) return 5;
  const d = names.findIndex((_, i) => !S.done.includes(i));
  if (d < 0) return null;
  return realm === Number(d >= 4) ? sites[d] : 5;
}

function interactionLabel(o) {
  if (o.label) return o.label;
  if (o.type === "guide")
    return !has(10)
      ? "Take the satchel"
      : S.world
        ? "Speak to Nelle"
        : "Speak to Merin";
  if (o.type === "npc") return "Speak to " + residents[o.id];
  if (o.type === "entrance") return "Enter " + names[o.id];
  if (o.type === "chest" && o.opened) return "Empty chest";
  return labels[o.type];
}

let realmTransition = null;
function crossRealm(x, y) {
  const before = opts.reduced
    ? null
    : makeLayer(() => g.drawImage(cv, 0, 0, W, H));
  S.world = 1 - S.world;
  if (S.world) S.flags.sawGloam = true;
  newRoom(x, y);
  if (before) realmTransition = { before, x, y, tick };
  playVeilChord();
  checkpoint();
  toast(S.world ? "The Gloam" : "Aurelia");
}

function paintRealmTransition() {
  if (!realmTransition) return;
  const { before, x, y, tick: start } = realmTransition;
  const t = (tick - start) / 36;
  if (t >= 1 || opts.reduced) {
    realmTransition = null;
    return;
  }
  const radius = 3 + (1 - (1 - t) ** 1.75) * 487;
  const mask = new Path2D();
  mask.rect(0, 27, W, H - 27);
  mask.ellipse(x, y - 6, radius, radius * 0.74, 0, 0, TAU);
  g.save();
  g.beginPath();
  g.rect(0, 27, W, H - 27);
  g.clip();
  g.save();
  g.clip(mask, "evenodd");
  g.drawImage(before, 0, 0, W, H);
  g.restore();
  g.lineWidth = 1.1;
  g.strokeStyle = S.world ? "#a4e9ebaf" : "#f0c885a9";
  g.beginPath();
  g.ellipse(x, y - 6, radius, radius * 0.74, 0, 0, TAU);
  g.stroke();
  g.restore();
}

function playVeilChord() {
  const base = S.world ? 220 : 246.94;
  const notes = S.world ? [12, 7, 3, 0] : [0, 4, 7, 12];
  notes.forEach((note, i) =>
    chimeNote(
      base * 2 ** (note / 12),
      0.78 - i * 0.06,
      0.091,
      false,
      i * 0.087,
    ),
  );
}
