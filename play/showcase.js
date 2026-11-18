"use strict";

const crossingTitle = "The First Crossing";
let showcase = null;
let crossingTitleScreen =
  new URLSearchParams(location.search).get("chapter") === "crossing";

function startShowcase() {
  showcase = { rung: false, seals: [false, false], ticks: 0 };
  S = blank();
  S.items = [0, 5];
  S.slots = [0, 5];
  S.max = S.hp = 12;
  S.journal = [
    "Ione’s bell carried a song across the veil. Ring Bellwick’s bell and follow its answer.",
  ];
  wake();
  mode = "play";
  newRoom(161, 135);
  checkpoint();
  document.body.classList.add("playing");
  say(
    "Merin, the bellwarden",
    "Ione rang that bell before she vanished. Listen across the veil, Rowan. If another bell answers, we’ll know she made it through.",
  );
}

function leaveShowcase(toCampaign = false) {
  showcase = null;
  crossingTitleScreen = toCampaign ? false : crossingTitleScreen;
  mode = "title";
  sel = 0;
  noticeTime = 0;
  realmTransition = null;
  document.body.classList.remove("playing");
  clearInput();
}

function showcaseSealsReady() {
  return showcase.seals.every(Boolean);
}

function buildShowcaseRoom() {
  if (S.d < 0) {
    surface();
    scene.exits = [];
    const unused = new Set([
      "npc",
      "guide",
      "shop",
      "secret",
      "cave",
      "token",
      "memorial",
    ]);
    scene.obj = scene.obj.filter((o) => !unused.has(o.type));
    if (S.world)
      obj("entrance", 302, 87, { id: 5, label: "Enter the Choir vault" });
    return;
  }
  if (S.r === 11) {
    dungeonRoom();
    scene.exits = [{ dir: "down", to: 7 }];
    const guardian = scene.mobs.find((m) => m.big === 2);
    guardian.hp = guardian.maxhp = 8;
    guardian.cycle = 56;
    return;
  }
  exit("up", 11);
  exit("down", -1);
  obj("pot", 83, 165);
  obj("pot", 303, 169);
  obj("well", 275, 162);
  obj("tablet", 109, 155, {
    msg: "The Echo Chime wakes stepping stones in the dark. Cross while the notes are ringing, then throw the Gale Disc at the two brass receivers.",
  });
  scene.traps.push(
    { x: 12, y: 94, w: 360, h: 34, type: "pit", style: "flooded" },
    { x: 174, y: 94, w: 36, h: 34, type: "echo", vertical: true },
  );
  for (const [i, x] of [127, 257].entries())
    obj("target", x, 69, {
      id: i,
      on: showcase.seals[i],
      label: "Inspect receiver",
    });
  if (!showcaseSealsReady()) spawn(247, 157, 11);
}

function enterChoirPassage() {
  S.world = 1;
  S.d = 5;
  S.r = 7;
  newRoom(192, 169);
  checkpoint();
  toast("The Drowned Choir · Bell passage");
}

function leaveShowcaseRoom(dir) {
  const next = scene.exits.find((e) => e.dir === dir);
  if (!next || S.r === 11) return;
  if (next.to < 0) {
    S.d = -1;
    S.r = 0;
    newRoom(302, 107);
    checkpoint();
  } else if (showcaseSealsReady()) {
    S.r = 11;
    newRoom(192, 177);
    checkpoint();
    say(
      "Ione’s lantern",
      "The Chorister hides beneath the floor. When it rises to sing, answer with the chime. Then strike while its lantern is open.",
    );
  } else toast("Ring both brass receivers with the Gale Disc");
}

function showcaseInteraction(o) {
  if (o.type === "bell") {
    if (!S.world && !showcase.rung) {
      showcase.rung = true;
      log("Bellwick’s bell sent an echo east toward the arch.");
      toast("A bell answers from beyond the arch");
    } else toast("The bell restores your strength");
    playVeilChord();
    S.hp = S.max;
    S.magic = S.mp;
    checkpoint();
  } else if (o.type === "rift") {
    if (!showcase.rung) toast("Ring Bellwick’s bell to wake the crossing");
    else crossRealm(p.x, p.y);
  } else if (o.type === "entrance") {
    enterChoirPassage();
  } else if (o.type === "target") {
    toast(
      o.on ? "Receiver ringing" : "Strike the brass face with the Gale Disc",
    );
  } else return false;
  return true;
}

function activateShowcaseSeal(o, instrument) {
  if (instrument !== 0 || o.on) return;
  showcase.seals[o.id] = true;
  o.on = true;
  chimeNote(o.id ? 587.33 : 440, 0.64, 0.12);
  burst(o.x, o.y - 9, "#f6d88e", 11);
  if (showcaseSealsReady()) {
    log("The two receivers rang in harmony. The heart chamber is open.");
    toast("Both receivers ring · the heart chamber opens");
    S.cp = [1, 5, 5, 7, "", 192, 73];
  } else toast("One of two receivers ringing");
}

function equippedHint(instrument) {
  const slot = S.slots.indexOf(instrument);
  return slot >= 0
    ? actionLabel(slot ? "slot2" : "slot1") + " · " + toolsList[instrument]
    : "Equip " + toolsList[instrument] + " in Equipment";
}

function showcaseObjective() {
  if (S.d < 0) {
    if (!showcase.rung) return objectiveAt("Ring Bellwick’s bell", "bell");
    if (!S.world)
      return objectiveAt(
        "Cross to Hushwick",
        "rift",
        "Raise the lantern at the small arch",
      );
    return objectiveAt(
      "Find the answering bell",
      "entrance",
      "Enter the Choir vault",
    );
  }
  if (S.r === 11) {
    const guardian = scene.mobs.find((m) => m.big === 2);
    if (guardian?.open)
      return {
        title: "Strike the exposed core",
        detail: actionLabel("attack") + " · Strike",
      };
    if (guardian?.phase !== "stalk")
      return { title: "Answer the Chorister’s call", detail: equippedHint(5) };
    return {
      title: "Watch for the Chorister to rise",
      detail: equippedHint(5),
    };
  }
  if (p.y >= 95)
    return {
      title: scene.light ? "Cross the lit stones" : "Reveal the stone bridge",
      detail: equippedHint(5),
      marker: { x: 192, y: 135, type: "bridge" },
    };
  if (showcaseSealsReady())
    return {
      title: "Enter the heart chamber",
      detail: "North passage",
      marker: exitTarget(11),
    };
  return {
    title: "Ring the brass receivers",
    detail:
      equippedHint(0) +
      " · " +
      Number(showcase.seals[0] || showcase.seals[1]) +
      "/2",
    marker: scene.obj.find((o) => o.type === "target" && !o.on),
  };
}

function finishShowcase() {
  scene.mobs = [];
  scene.shots = [];
  cue("win");
  const seconds = Math.round(showcase.ticks / 60);
  showcase.finishedTime =
    Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  mode = "showcaseComplete";
  sel = 0;
  clearInput();
}
