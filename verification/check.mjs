import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
const project = fileURLToPath(new URL("..", import.meta.url)),
  output = path.join(project, "verification"),
  profile = fs.mkdtempSync(path.join(os.tmpdir(), "veilbound-check-"));
const executable =
  process.env.CHROME_PATH ||
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : process.platform === "win32"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : "google-chrome");
const chrome = spawn(
  executable,
  [
    "--headless=new",
    "--disable-gpu",
    // Canvas captures read back the game's bundled images while testing file:// play.
    "--allow-file-access-from-files",
    "--mute-audio",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profile,
    "--no-first-run",
    "--disable-background-networking",
    "--disable-extensions",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let failure;
chrome.on("error", (e) => (failure = e));
try {
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) {
    if (failure) throw failure;
    await delay(50);
  }
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0],
    t = (
      await (await fetch("http://127.0.0.1:" + port + "/json/list")).json()
    ).find((t) => t.type === "page"),
    ws = new WebSocket(t.webSocketDebuggerUrl),
    requests = new Map(),
    errors = [];
  let seq = 0;
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    let m = JSON.parse(e.data);
    if (m.id && requests.has(m.id)) {
      requests.get(m.id)(m);
      requests.delete(m.id);
    }
    if (m.method === "Runtime.exceptionThrown")
      errors.push(
        m.params.exceptionDetails.exception?.description ||
          m.params.exceptionDetails.text,
      );
  };
  function call(method, params = {}) {
    return new Promise((r) => {
      requests.set(++seq, r);
      ws.send(JSON.stringify({ id: seq, method, params }));
    });
  }
  async function ev(expression) {
    let { result, error } = await call("Runtime.evaluate", {
      expression,
      userGesture: true,
      returnByValue: true,
      awaitPromise: true,
    });
    if (error || result.exceptionDetails)
      throw Error(JSON.stringify(error || result.exceptionDetails));
    return result.result.value;
  }
  await call("Runtime.enable");
  await call("Page.enable");
  const preload = await call("Page.addScriptToEvaluateOnNewDocument", {
    source: "window.requestAnimationFrame = ()=>1;",
  });
  await call("Page.navigate", {
    url: pathToFileURL(path.join(project, "play", "index.html")).href,
  });
  async function waitForGame() {
    for (let i = 0; i < 60; i++) {
      await delay(50);
      if (
        await ev(
          'document.readyState === "complete" && typeof paintedArt !== "undefined" && Object.values(paintedArt).every(artReady)',
        )
      )
        return;
    }
    throw Error("The game or a painted sprite sheet failed to load");
  }
  await waitForGame();
  async function checkPreferences() {
    const results = [];
    const assert = (pass, message) => {
      if (!pass) throw Error(message);
      results.push(message);
    };
    const metrics = (width, height, mobile = false) =>
      call("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile,
      });
    async function clickAt(x, y) {
      await call("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x,
        y,
        button: "left",
        clickCount: 1,
      });
      await call("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        clickCount: 1,
      });
    }
    async function click(selector, portion = 0.5) {
      const [x, y] = await ev(
        `(()=>{const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return [b.left+b.width*${portion},b.top+b.height/2]})()`,
      );
      await clickAt(x, y);
    }
    async function menuClick(x, y) {
      const [X, Y] = await ev(
        `(()=>{const b=cv.getBoundingClientRect();return [b.x+b.width*${x}/W,b.y+b.height*${y}/H]})()`,
      );
      await clickAt(X, Y);
    }
    async function reload() {
      await call("Page.reload");
      await waitForGame();
    }
    await metrics(1120, 700);
    assert(
      await ev('opts.quality==="high" && cv.width===1920 && cv.height===1080'),
      "New players start at 1920 × 1080",
    );
    await menuClick(70, 149);
    assert(
      await ev(
        'preferences.open && document.activeElement.id==="graphics-tab"',
      ),
      "Title settings open with keyboard focus on Graphics",
    );
    await ev("paint()");
    const capture = await call("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      path.join(output, "settings.png"),
      Buffer.from(capture.result.data, "base64"),
    );
    await click("[name=quality][value=classic]");
    const classic = await ev(
      'paint();({w:cv.width,h:cv.height,room:titleCache.width,tile:actorAtlas.get("preferences/gate").tile.width,preview:document.querySelector("#pref-art").width})',
    );
    await click("[name=quality][value=balanced]");
    const balanced = await ev("paint();[cv.width,cv.height]");
    await click("[name=quality][value=high]");
    const high = await ev(
      'paint();[titleCache.width,actorAtlas.get("preferences/gate").tile.width,document.querySelector("#pref-art").width]',
    );
    assert(
      classic.w === 384 &&
        classic.h === 216 &&
        classic.room === 384 &&
        balanced[0] === 1152 &&
        balanced[1] === 648 &&
        high[0] === 1920 &&
        high[1] > classic.tile * 1.9 &&
        high[2] === classic.preview * 5,
      "Quality presets rebuild the display, scenery, model atlas and preview at their own resolution",
    );
    await click("#pref-brightness", 0.67);
    assert(
      await ev(
        'opts.brightness>100 && cv.style.filter===document.querySelector("#pref-art").style.filter',
      ),
      "Brightness updates both the game and the scene preview",
    );
    await click("#audio-tab");
    await click("[data-command=sample]");
    await delay(80);
    assert(
      await ev('opts.sound && ac.state==="running"'),
      "Enable sound and preview unlocks the audio mixer",
    );
    await click("#pref-master", 0.42);
    const master = await ev("opts.master");
    await key("ArrowLeft", "ArrowLeft");
    assert(
      (await ev("opts.master")) === master - 1,
      "Master volume supports mouse positioning and native keyboard adjustment",
    );
    await click("[data-option=sound]");
    await click("#graphics-tab");
    await click("[name=quality][value=balanced]");
    await click("[data-option=atmosphere]");
    await click("[data-command=back]");
    assert(
      await ev('mode==="title" && !preferences.open'),
      "Done returns to the title screen",
    );
    const retained = await ev("[opts.master,opts.brightness]");
    await reload();
    assert(
      await ev(
        `opts.quality==="balanced" && !opts.atmosphere && opts.master===${retained[0]} && opts.brightness===${retained[1]} && cv.width===1152`,
      ),
      "Graphics and mixer preferences survive a reload",
    );
    await ev('start(false);finishTalk();openMenu("pause");paint()');
    const before = await ev("[S.world,S.area,p.x,p.y]");
    await menuClick(93, 157);
    await ev(
      'document.getElementById("graphics-tab").focus();pressed=new Set(["right"]);settingsGamepad();pressed.clear()',
    );
    assert(
      await ev('preferences.open && preferenceTab==="audio"'),
      "Pause settings and controller tab navigation work",
    );
    await metrics(390, 844, true);
    await call("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 2,
    });
    const [tx, ty] = await ev(
      '(()=>{let b=document.getElementById("pref-sfx").getBoundingClientRect();return [b.left+b.width*.22,b.y+b.height/2]})()',
    );
    await call("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: tx, y: ty }],
    });
    await call("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: tx + 45, y: ty }],
    });
    await call("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    assert(
      await ev(
        "opts.sfx>=27 && opts.sfx<=45 && preferences.scrollWidth<=preferences.clientWidth+1",
      ),
      "Phone layout fits and a touch drag adjusts effects volume",
    );
    await key("Escape", "Escape");
    assert(
      (await ev('!preferences.open && mode==="menu" && menu==="pause"')) &&
        JSON.stringify(before) ===
          JSON.stringify(await ev("[S.world,S.area,p.x,p.y]")),
      "Closing settings preserves the paused scene and player position",
    );
    await call("Emulation.setTouchEmulationEnabled", { enabled: false });
    await metrics(1120, 700);
    await ev("closeMenu();paint()");
    await click("#hud-settings");
    const direct = await ev('preferences.open && settingsReturn==="play"');
    await click(".pref-footer [data-command=back]");
    assert(
      direct && (await ev('mode==="play" && !preferences.open')),
      "The in-game settings shortcut returns directly to play",
    );
    // Reload an existing preference payload that predates graphics and the master fader.
    await ev(
      'localStorage.setItem(KEY+".settings",JSON.stringify({sound:false,sfx:19,music:64,fast:true,keys:{attack:["KeyB"]}}))',
    );
    await reload();
    assert(
      await ev(
        'opts.master===100 && cv.width===1920 && opts.music===64 && opts.sfx===19 && opts.fast && opts.keys.attack[0]==="KeyB"',
      ),
      "Legacy preferences retain volume, accessibility options and key bindings",
    );
    await ev("localStorage.clear()");
    await reload();
    return results;
  }
  const settingsChecks = await checkPreferences();
  await ev("var test=(" + campaignController.toString() + ")()");
  async function cap(n) {
    let data = await ev(`(() => {
      paint();
      const capture = document.createElement("canvas");
      capture.width = Math.min(cv.width, 960); capture.height = capture.width * H / W;
      const ctx = capture.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(cv,0,0,capture.width,capture.height);
      return capture.toDataURL("image/png").split(",")[1];
    })()`);
    fs.writeFileSync(
      path.join(output, n + ".png"),
      Buffer.from(data, "base64"),
    );
  }
  async function run(cmd) {
    try {
      return await ev(cmd);
    } catch (e) {
      await cap("debug");
      console.log(
        await ev(
          "JSON.stringify({mode,notice,d:S.d,r:S.r,a:S.area,h:S.hp,x:p.x,y:p.y,flags:S.d>=0?D().flags:{},m:scene.mobs.map(m=>[m.name,m.hp,m.phase]),objs:scene.obj.map(o=>[o.type,o.x,o.y,o.on])})",
        ),
      );
      throw e;
    }
  }
  await ev("localStorage.clear();saved=false;sel=0");
  await cap("title");
  await run("test.start()");
  await cap("aurelia");
  await run("openMenu('inventory')");
  await cap("burst-satchel");
  await run("closeMenu()");
  for (let d = 0; d < 10; d++) {
    if (d === 4) {
      await run("test.cross()");
      await cap("crossing");
      await run("test.frame(35)");
      await cap("gloam");
    }
    console.log("enter", d);
    await run("test.enter(" + d + ")");
    await run("test.first()");
    await run("test.treasury()");
    await cap("item-" + (d + 1));
    await run("test.second()");
    await run("test.arena()");
    await cap("dungeon-" + (d + 1));
    console.log("boss", d);
    await run("test.winBoss()");
    if (d < 9) await run("test.finish()");
    console.log("complete", d);
  }
  await cap("ending");
  await run("test.post()");
  console.log(
    await ev(
      "JSON.stringify({done:S.done,end:S.end,items:S.items,rooms:S.dg.map(d=>d.seen.length),keys:S.dg.map(d=>d.keys),frames:tick,checkpoint:S.cp})",
    ),
  );
  await ev(gallery.toString());
  fs.writeFileSync(
    path.join(output, "model-gallery.png"),
    Buffer.from(await ev("gallery()"), "base64"),
  );
  await ev(environmentGallery.toString());
  fs.writeFileSync(
    path.join(output, "environment-gallery.png"),
    Buffer.from(await ev("environmentGallery()"), "base64"),
  );
  await ev(screenGallery.toString());
  const audit = await ev("screenGallery()");
  for (const name of ["room-gallery", "menu-gallery"])
    fs.writeFileSync(
      path.join(output, name + ".webp"),
      Buffer.from(audit[name], "base64"),
    );
  await ev(verifyArtwork.toString());
  await ev(extraChecks.toString());
  const checks = [...settingsChecks, ...(await run("extraChecks()"))];
  checks.push(...(await run("verifyArtwork()")));
  checks.push(
    "Rendered 120 dungeon rooms, 24 side-cave variants and every canvas menu for visual review",
  );
  await call("Page.removeScriptToEvaluateOnNewDocument", {
    identifier: preload.result.identifier,
  });
  await call("Page.reload");
  await delay(450);
  async function key(code, key) {
    await call("Input.dispatchKeyEvent", { type: "keyDown", code, key });
    await delay(70);
    await call("Input.dispatchKeyEvent", { type: "keyUp", code, key });
    await delay(80);
  }
  await key("Enter", "Enter");
  if ((await ev("mode")) !== "play")
    throw Error("Continue with real keyboard input failed");
  await key("Tab", "Tab");
  if ((await ev("menu")) !== "inventory")
    throw Error("Inventory shortcut failed");
  await key("Escape", "Escape");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 900,
    height: 540,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await call("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 5,
  });
  let positions = await ev(
    "['right','shield'].map(a=>{let b=document.querySelector('button[aria-label='+a+']').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})",
  );
  await call("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: positions.map((p, i) => ({ ...p, id: i + 1 })),
  });
  await delay(90);
  if (!(await ev("held.has('right')&&held.has('shield')")))
    throw Error("Native multitouch did not hold both controls");
  await call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await delay(70);
  if (await ev("held.size")) throw Error("Native touch release failed");
  checks.push(
    "real-time animation loop and browser keyboard input",
    "native Chrome multitouch holds and releases movement and shield",
  );
  if (errors.length) throw Error(errors.join("\n"));
  const record = await ev(
    "({rooms:S.dg.map(d=>d.seen.length),completedDungeons:S.done.length,tools:S.items.length,ending:S.end})",
  );
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(
      {
        engine: "Headless Chrome",
        campaign:
          "Fresh save through the ending, with a midway exit, puzzle reset, death, checkpoint retry and reload in every dungeon.",
        ...record,
        checks,
        runtimeErrors: errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    checks.length + " supplemental checks passed. No runtime exceptions.",
  );
  ws.close();
} finally {
  chrome.kill("SIGTERM");
  for (
    let i = 0;
    i < 50 && chrome.exitCode === null && chrome.signalCode === null;
    i++
  )
    await delay(40);
  fs.rmSync(profile, {
    recursive: true,
    force: true,
    maxRetries: 4,
    retryDelay: 150,
  });
}

function campaignController() {
  let assert = (v, s) => {
      if (!v) throw Error(s);
    },
    act = (a) => {
      pressed.add(a);
      held.add(a);
      step();
      held.delete(a);
    },
    frame = (n) => {
      for (let i = 0; i < n; i++) step();
    },
    talk = () => {
      if (mode === "talk") act("act");
    },
    ob = (type, id) => scene.obj.filter((o) => o.type === type)[id || 0];
  function obstacle(x, y) {
    return (
      !safePoint(x, y) ||
      scene.walls.some(
        (o) =>
          !(
            (o.style === "icewall" && o.melted) ||
            (o.style === "vine" && o.cut)
          ) && inside(x, y, o, 5),
      ) ||
      scene.obj.some(
        (o) =>
          ["block", "weight"].includes(o.type) &&
          Math.hypot(o.x - x, o.y - y) < 15,
      )
    );
  }
  function route(tx, ty) {
    let sx = Math.round(p.x / 4),
      sy = Math.round(p.y / 4),
      ex = Math.round(tx / 4),
      ey = Math.round(ty / 4),
      idx = (x, y) => y * 97 + x,
      prev = new Int32Array(97 * 55).fill(-1),
      start = idx(sx, sy),
      q = [start];
    prev[start] = start;
    let best = start,
      score = 1e9;
    for (let i = 0; i < q.length; i++) {
      let k = q[i],
        x = k % 97,
        y = Math.floor(k / 97),
        val = Math.hypot(x - ex, y - ey);
      if (val < score) {
        best = k;
        score = val;
      }
      if (!val) break;
      for (let [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        let X = x + dx,
          Y = y + dy,
          n = idx(X, Y);
        if (
          X < 2 ||
          X > 94 ||
          Y < 8 ||
          Y > 52 ||
          prev[n] !== -1 ||
          obstacle(X * 4, Y * 4)
        )
          continue;
        prev[n] = k;
        q.push(n);
      }
    }
    let path = [];
    while (best !== start) {
      path.push([(best % 97) * 4, Math.floor(best / 97) * 4]);
      best = prev[best];
    }
    return path.reverse();
  }
  function move(x, y) {
    let dx = x - p.x,
      dy = y - p.y;
    held.clear();
    if (Math.abs(dx) > 0.7) held.add(dx < 0 ? "left" : "right");
    if (Math.abs(dy) > 0.7) held.add(dy < 0 ? "up" : "down");
    step();
    held.clear();
  }
  function walk(x, y, eps = 3) {
    let old = scene;
    for (let count = 0; count < 6000; ) {
      if (old !== scene || Math.hypot(x - p.x, y - p.y) <= eps) return;
      if (mode !== "play") {
        if (S.done.includes(S.d)) return;
        throw Error("walk mode " + mode);
      }
      let path = route(x, y);
      if (!path.length) path = [[x, y]];
      for (let [X, Y] of path.slice(0, 10)) {
        for (let i = 0; i < 12 && Math.hypot(X - p.x, Y - p.y) > 1.3; i++) {
          move(X, Y);
          count++;
          if (old !== scene || Math.hypot(x - p.x, y - p.y) <= eps) return;
        }
        count++;
      }
    }
    throw Error("walk stuck " + [x, y, p.x, p.y]);
  }
  function objact(type, id = 0) {
    let o = ob(type, id);
    assert(o, "missing " + type);
    walk(o.x, o.y + 5, 3);
    assert(near() === o, "wrong interact " + type + " " + near()?.type);
    act("act");
  }
  function gate(to) {
    let e = scene.exits.find((e) => e.to === to);
    assert(e, "no door to " + to);
    let old = scene,
      pt = {
        up: [192, 34],
        down: [192, 206],
        left: [9, 119],
        right: [375, 119],
      }[e.dir];
    walk(...pt, 5);
    for (let j = 0; j < 15 && scene === old; j++) {
      held = new Set([e.dir]);
      step();
    }
    held.clear();
    assert(scene !== old, "door " + to + " " + notice);
  }
  function travel(a) {
    for (let n = 0; S.area !== a && n < 20; n++) {
      let q = [[S.area]],
        seen = new Set([S.area]);
      let path;
      while (q.length) {
        let v = q.shift(),
          x = v.at(-1);
        if (x === a) {
          path = v;
          break;
        }
        for (let t of [
          x - 4,
          x + 4,
          ...(x % 4 ? [x - 1] : []),
          ...(x % 4 < 3 ? [x + 1] : []),
        ]) {
          if (t < 0 || t > 11 || seen.has(t)) continue;
          let pair = [x, t].sort((a, b) => a - b).join("-");
          if (
            S.world
              ? pair === "5-9" ||
                (pair === "9-10" && !S.flags.bridge) ||
                (pair === "3-7" && !S.done.includes(7)) ||
                (pair === "4-8" && !has(8))
              : pair === "6-10" ||
                (pair === "0-1" && !S.done.includes(0)) ||
                (pair === "2-6" && !has(2)) ||
                (pair === "9-10" && !has(1)) ||
                (pair === "7-11" && !has(3))
          )
            continue;
          seen.add(t);
          q.push([...v, t]);
        }
      }
      assert(path, "overworld route");
      gate(path[1]);
      talk();
    }
  }
  function face(dx, dy) {
    let a = dx ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
    held.add(a);
    pressed.add(a);
    step();
    held.clear();
  }
  function equip(i, slot = 0) {
    assert(has(i), "missing instrument " + i);
    openMenu("inventory");
    sel = S.items.indexOf(i);
    act(slot ? "slot2" : "slot1");
    act("inventory");
    assert(S.slots[slot] === i, "equip");
  }
  function cast(i) {
    if (S.slots[0] !== i) equip(i);
    frame(p.itemCD + 1);
    act("slot1");
  }
  function align() {
    if (S.d === 3) {
      for (let j = 0; j < 2; j++) {
        let o = ob("mirror", j);
        for (let n = 0; n < 4 && !o.on; n++) objact("mirror", j);
        assert(o.on, "mirror");
      }
    }
    if (S.d === 4) objact("portrait");
  }
  function strikeTarget(o, i) {
    if (mode !== "play") return;
    if ([0, 3, 7, 10].includes(i)) {
      walk(
        o.x - ((i === 7 || (i === 0 && S.d === 0)) && S.r !== 11 ? 56 : 22),
        o.y,
      );
      face(1, 0);
      cast(i);
      frame(32);
    } else if (i === 9) {
      walk(o.x - 12, o.y);
      face(1, 0);
      cast(i);
      frame(24);
    } else {
      walk(o.x - 12, o.y);
      face(1, 0);
      cast(i);
      frame(18);
    }
  }
  function puzzle() {
    let d = S.d,
      r = S.r;
    if (r < 7) {
      if (d === 5) {
        for (let i of scene.seq) objact("song", i);
      } else if (d === 7 || d === 2) {
        if (d === 2) objact("machine");
        let o = ob(d === 7 ? "block" : "weight"),
          t = ob("plate"),
          dir = Math.sign(t.x - o.x);
        walk(o.x - dir * 17, o.y - 20);
        walk(o.x - dir * 17, o.y);
        for (let i = 0; i < 180 && !scene.solved; i++) move(p.x + dir * 4, o.y);
      } else {
        align();
        if (d === 6) {
          let o = ob("machine");
          walk(o.x, o.y + 5);
          while (Math.sin(scene.age / 20) < 0) frame(1);
          act("act");
        } else objact("machine");
        if (d === 1) objact("float");
        else if (r === 3 && d !== 6) objact("machine");
        frame(44);
      }
    } else {
      align();
      objact("machine");
      for (let o of scene.obj.filter((o) => o.type === "relay"))
        strikeTarget(o, o.tool);
      for (let o of scene.obj.filter((o) => o.type === "target"))
        strikeTarget(o, d);
    }
    assert(scene.solved, "puzzle " + d + " " + r + " " + scene.state);
  }
  function duel() {
    for (let k = 0; k < 6000 && scene.mobs.length && mode === "play"; k++) {
      let m = scene.mobs[0],
        dx = m.x - p.x,
        dy = m.y - p.y;
      if (k % 3 === 0) pressed.add("attack");
      held.clear();
      if (Math.abs(dx) > Math.abs(dy)) held.add(dx < 0 ? "left" : "right");
      else held.add(dy < 0 ? "up" : "down");
      if (dist(p, m) < 23) held.add("shield");
      step();
    }
    held.clear();
    assert(mode !== "defeat", "fell in duel");
    assert(!scene.mobs.length || mode !== "play", "duel timeout");
  }
  function boss() {
    let d = S.d;
    for (let k = 0; k < 14 && mode === "play" && !S.done.includes(d); k++) {
      let m = scene.mobs[0];
      if (!m.open) {
        if ([0, 3, 7].includes(d)) {
          align();
          for (let o of scene.obj.filter((o) => o.type === "ward"))
            strikeTarget(o, d);
        } else if (d === 1) objact("machine");
        else if (d === 2) {
          objact("machine");
          let o = ob("machine");
          walk(o.x, o.y, 3);
          frame(220);
        } else if (d === 9) {
          if (m.form) {
            objact("machine");
          } else {
            let t = 0;
            while (!m.open && mode === "play" && t++ < 1500) {
              let q = scene.shots.find((q) => q.hostile && dist(p, q) < 26),
                dx = m.x - p.x,
                dy = m.y - p.y;
              held = new Set([
                Math.abs(dx) > Math.abs(dy)
                  ? dx < 0
                    ? "left"
                    : "right"
                  : dy < 0
                    ? "up"
                    : "down",
                "shield",
              ]);
              if (q) pressed.add("attack");
              step();
            }
            held.clear();
          }
        } else {
          if (d === 4 || d === 8) {
            let o = ob(d === 4 ? "portrait" : "node");
            walk(o.x, o.y + 6);
          } else {
            walk(m.x, m.y + 14, 14);
          }
          if (d === 6)
            while (!["warn", "rush"].includes(m.phase) && mode === "play")
              frame(1);
          cast(d);
        }
      }
      for (
        let t = 0;
        t < 150 &&
        (m.open || (d === 9 && m.form && scene.light)) &&
        mode === "play";
        t++
      ) {
        let dx = m.x - p.x,
          dy = m.y - p.y;
        held = new Set([
          Math.abs(dx) > Math.abs(dy)
            ? dx < 0
              ? "left"
              : "right"
            : dy < 0
              ? "up"
              : "down",
          "shield",
        ]);
        if (t % 3 === 0) pressed.add("attack");
        step();
      }
      held.clear();
      if (mode === "talk" && !S.done.includes(d)) talk();
    }
    assert(S.done.includes(d), "boss failure " + mode + " " + S.hp);
  }
  return {
    frame,
    travel,
    gate,
    objact,
    walk,
    talk,
    cast,
    equip,
    assert,
    face,
    strikeTarget,
    duel,
    start() {
      localStorage.clear();
      start(false);
      talk();
      objact("guide");
      talk();
      assert(has(10), "satchel");
      objact("bell");
      closeMenu();
      let hidden = ob("rift");
      walk(hidden.x, hidden.y + 4);
      act("act");
      assert(mode === "talk" && S.world === 0, "early glimpse");
      talk();
      for (let j = 0; j < 6; j++) {
        cast(10);
        frame(30);
      }
      assert(S.ammo === 0, "empty charges");
    },
    cross() {
      travel(5);
      objact("rift");
      assert(S.world === 1, "cross");
    },
    enter(d) {
      travel(sites[d]);
      objact("entrance");
      assert(S.d === d, "entrance");
    },
    first() {
      gate(1);
      objact("chest");
      talk();
      gate(3);
      objact("reset");
      assert(!scene.solved, "reset");
      puzzle();
      objact("chest");
      talk();
      gate(1);
      gate(0);
      gate(-1);
      assert(S.d === -1, "midway overworld");
      objact("entrance");
      gate(2);
      puzzle();
      gate(4);
      assert(D().keys === 0 && D().flags.unlock, "key spent");
      gate(5);
      duel();
    },
    treasury() {
      gate(6);
      objact("chest");
      assert(has(S.d), "treasury");
    },
    second() {
      talk();
      gate(7);
      puzzle();
      gate(8);
      puzzle();
      objact("chest");
      talk();
      gate(9);
      objact("lever");
      objact("chest");
      talk();
      gate(8);
      gate(10);
      talk();
      objact("bell");
      talk();
    },
    arena() {
      let cp = JSON.stringify(S.cp),
        d = S.d;
      assert(D().flags.great && S.cp[3] === 10, "vigil");
      gate(11);
      for (let j = 0; j < 10000 && mode === "play"; j++) step();
      assert(mode === "defeat", "boss must defeat idle Rowan");
      act("act");
      assert(
        S.d === d && S.r === 10 && JSON.stringify(S.cp) === cp && has(d),
        "retry",
      );
      start(true);
      assert(S.r === 10 && D().flags.great, "checkpoint persisted");
      gate(11);
      if (d === 5) {
        const singer = scene.mobs[0];
        walk(singer.x, singer.y + 14, 14);
        cast(d);
        assert(singer.open, "the echo chime surfaces the chorister");
      }
    },
    winBoss: boss,
    finish() {
      talk();
      assert(S.d === -1, "exit");
    },
    post() {
      assert(mode === "ending", "ending");
      act("act");
      assert(S.end && S.r === 10, "postgame");
      start(true);
      assert(S.end, "reload");
    },
  };
}
async function extraChecks() {
  let checks = [];
  function check(v, m) {
    test.assert(v, m);
    checks.push(m);
  }
  // Check the real save from the campaign before running isolated equipment cases.
  let record = JSON.stringify(S),
    park = (area, w = 0, d = -1, r = 0, x = 193, y = 152) => {
      S.area = area;
      S.world = w;
      S.d = d;
      S.r = r;
      S.cave = "";
      mode = "play";
      clearInput();
      newRoom(x, y);
    },
    fixture = (area, w, d, r, x, y) => {
      S = JSON.parse(record);
      park(area, w, d, r, x, y);
    },
    restore = () => {
      S = JSON.parse(record);
      newRoom(S.x, S.y);
      mode = "play";
      save();
    };
  for (let w = 0; w < 2; w++)
    for (let a = 0; a < 12; a++) {
      park(a, w);
      let all = scene.exits.slice();
      for (let e of all) {
        park(a, w);
        go(e.dir);
        test.talk();
        let back = scene.exits.find((f) => f.to === a);
        test.assert(back, "reciprocal area " + a);
        go(back.dir);
        test.talk();
        test.assert(S.area === a, "surface return");
      }
    }
  check(true, "reciprocal routes across 24 overworld areas");
  for (let d = 0; d < 10; d++) {
    for (let r = 0; r < 12; r++) {
      park(sites[d], Number(d >= 4), d, r);
      let all = scene.exits.slice();
      for (let e of all) {
        if (e.to < 0) continue;
        park(sites[d], Number(d >= 4), d, r);
        go(e.dir);
        test.assert(S.r === e.to, "unlocked graph edge");
        let back = scene.exits.find((f) => f.to === r);
        test.assert(back, "reciprocal room");
        go(back.dir);
        test.assert(S.r === r, "room return");
      }
    }
  }
  check(true, "every completed dungeon door works in both directions");
  fixture(5, 0, -1, 0, 236, 169);
  S.cash = 2;
  test.objact("shop");
  check(S.cash === 0 && S.ammo === S.cap, "currency purchase");
  fixture(5, 0, -1, 0, 174, 134);
  test.objact("npc");
  test.talk();
  check(S.quests[5] === 1, "side quest starts");
  park(7, 1, -1, 0, 157, 163);
  test.objact("token");
  park(5, 0, -1, 0, 174, 134);
  test.objact("npc");
  test.talk();
  check(S.quests[5] === 3, "paired-world quest reward");
  park(5, 1);
  check(
    !!scene.obj.find((o) => o.type === "memorial"),
    "paired settlement restored",
  );
  for (let kind = 0; kind < 4; kind++) {
    let a = kind;
    fixture(a, 0, -1, 0, 62, 175);
    let o = scene.obj.find((o) => o.type === "secret");
    if (kind < 3) test.strikeTarget(o, [10, 0, 3][kind]);
    else test.objact("secret");
    check(flag(o.id), "secret clue " + kind);
    let max = S.max,
      mp = S.mp,
      cap = S.cap;
    findSecret(o);
    check(
      max === S.max && mp === S.mp && cap === S.cap,
      "unique reward " + kind,
    );
  }
  fixture(2, 0, -1, 0, 218, 147);
  test.face(1, 0);
  test.cast(2);
  check(p.x > 275 && safePoint(p.x, p.y), "iron anchor traversal");
  fixture(4, 1, -1, 0, 266, 149);
  test.cast(8);
  check(bridged(250, 145), "living root bridge");
  fixture(9, 0, -1, 0, 253, 108);
  check(waterAt(p.x, p.y) && !solid(p.x, p.y), "swim in open water");
  test.cast(1);
  check(p.swim > 0, "river burst");
  fixture(0, 1, 4, 7, 189, 108);
  test.face(1, 0);
  let wallo = scene.walls.find((o) => o.style === "ghost");
  test.cast(4);
  check(p.x > wallo.x + wallo.w, "marked spectral crossing");
  fixture(0, 0, 3, 7, 182, 108);
  test.cast(3);
  check(bridged(200, 108), "light path revealed");
  fixture(1, 1, 5, 7, 180, 108);
  test.cast(5);
  check(bridged(200, 108), "echo path revealed");
  fixture(2, 1, 6, 7, 178, 108);
  test.cast(6);
  check(scene.frozen > 220, "marked gears halted");
  fixture(6, 1, 7, 7, 172, 108);
  test.face(1, 0);
  test.cast(7);
  test.frame(16);
  check(
    scene.walls.find((o) => o.style === "icewall").melted,
    "melted ice wall",
  );
  fixture(7, 1, 9, 7, 199, 108);
  test.face(1, 0);
  test.cast(9);
  test.frame(2);
  check(scene.light > 0, "cut Crown barrier");
  fixture(5, 0, -1, 0, 215, 178);
  test.objact("pot");
  check(!!p.carry, "lifted pot");
  interact();
  check(!p.carry && scene.drops.length > 0, "thrown pot creates supply");
  fixture(2, 0, -1, 0, 232, 147);
  p.safe = [230, 147];
  let hp = S.hp;
  for (let i = 0; i < 7; i++) {
    held.add("right");
    step();
  }
  held.clear();
  check(S.hp < hp && p.x < 237, "pit returns to safe ground");
  fixture(1, 0, -1, 0, 302, 92);
  test.objact("cave");
  for (let o of scene.obj.filter((o) => o.type === "target"))
    test.strikeTarget(o, 0);
  test.objact("chest");
  check(flag("cave" + loc()), "precision disc cave");
  fixture(0, 0, -1, 0, 302, 92);
  test.objact("cave");
  test.duel();
  test.objact("chest");
  check(flag("cave" + loc()), "combat trial");
  fixture(2, 0, -1, 0, 302, 92);
  test.objact("cave");
  let b = scene.obj.find((o) => o.type === "block");
  test.walk(b.x - 18, b.y);
  for (let j = 0; j < 90 && !scene.solved; j++) {
    held.add("right");
    step();
  }
  held.clear();
  test.objact("chest");
  check(flag("cave" + loc()), "weighted challenge cave");
  fixture(5, 0, -1, 0, 125, 115);
  test.objact("bell");
  closeMenu();
  park(3, 0, -1, 0, 125, 115);
  test.objact("bell");
  menuChoose(S.bells.indexOf(5) + 1);
  check(S.area === 5, "activated bell fast travel");
  for (let j = 0; j < 80; j++) {
    openMenu(j % 2 ? "map" : "inventory");
    paint();
    closeMenu();
    save();
    start(true);
  }
  check(S.area === 5, "80 repeated saves and reloads");
  let fire = (type, code) =>
    window.dispatchEvent(
      new KeyboardEvent(type, { code, bubbles: true, cancelable: true }),
    );
  fire("keydown", "KeyD");
  let x = p.x;
  test.frame(4);
  fire("keyup", "KeyD");
  check(p.x > x, "DOM keyboard movement");
  openMenu("bindings");
  menuChoose(Object.keys(baseKeys).indexOf("attack"));
  fire("keydown", "KeyB");
  closeMenu();
  closeMenu();
  fire("keydown", "KeyB");
  step();
  fire("keyup", "KeyB");
  check(p.atk > 0, "rebound attack key");
  opts.keys = structuredClone(baseKeys);
  soundSave();
  let padBtn = document.querySelector("#pad button[aria-label=right]"),
    atkBtn = document.querySelector("#buttons button[aria-label=attack]");
  function pressPointer(el, type, id) {
    el.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: "touch",
        bubbles: true,
        cancelable: true,
      }),
    );
  }
  let oldCap = HTMLElement.prototype.setPointerCapture;
  HTMLElement.prototype.setPointerCapture = () => {};
  pressPointer(padBtn, "pointerdown", 11);
  pressPointer(atkBtn, "pointerdown", 12);
  check(held.has("right") && held.has("attack"), "simultaneous touch actions");
  pressPointer(atkBtn, "pointerup", 12);
  pressPointer(padBtn, "pointerup", 11);
  HTMLElement.prototype.setPointerCapture = oldCap;
  check(!held.has("right"), "touch release");
  let oldGp = navigator.getGamepads.bind(navigator),
    axes = [1, 0];
  Object.defineProperty(navigator, "getGamepads", {
    configurable: true,
    value: () => [{ axes, buttons: [{ pressed: true }] }],
  });
  gamepad();
  check(
    held.has("right") && held.has("attack"),
    "simultaneous gamepad actions",
  );
  delete navigator.getGamepads;
  gamepad();
  check(!held.has("right"), "disconnected gamepad release");
  fire("keydown", "KeyW");
  window.dispatchEvent(new Event("blur"));
  check(mode === "menu" && !held.size, "focus loss pause");
  closeMenu();
  let bad = JSON.parse(record);
  bad.dg = [];
  check(!valid(bad), "invalid save rejected");
  let oldSet = Storage.prototype.setItem;
  Storage.prototype.setItem = () => {
    throw Error("denied");
  };
  check(save() === false, "unavailable storage handled");
  Storage.prototype.setItem = oldSet;
  let blob = null;
  let oldURL = URL.createObjectURL,
    click = HTMLAnchorElement.prototype.click;
  URL.createObjectURL = (v) => ((blob = v), "blob:fixture");
  HTMLAnchorElement.prototype.click = () => {};
  exportSave();
  URL.createObjectURL = oldURL;
  HTMLAnchorElement.prototype.click = click;
  let payload = await blob.text();
  check(valid(JSON.parse(payload)), "exported JSON validated");
  let input = document.querySelector("#loadfile"),
    dt = new DataTransfer();
  dt.items.add(
    new File([payload], "veilbound-save.json", { type: "application/json" }),
  );
  input.files = dt.files;
  await input.onchange({ target: input });
  check(mode === "play" && notice === "Journey imported", "save file import");
  restore();
  return checks;
}

function gallery() {
  let sheet = document.createElement("canvas"),
    scale = 2,
    old = g;
  sheet.width = 768 * scale;
  sheet.height = 1242 * scale;
  g = sheet.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.scale(scale, scale);
  rect(0, 0, 768, 1242, "#122227");
  function section(y, title) {
    txt(title, 22, y, "#f1dfb9", 17, "left", "Georgia");
    line(22, y + 8, 746, y + 8, "#736c52");
  }
  spaced("VEILBOUND", 22, 26, 2.1, "#e5c387", 9);
  section(56, "The people of the two kingdoms");
  for (let j = 0; j < 10; j++) {
    let x = 44 + j * 75;
    oval(x, 135, 21, 3, "#0d171c");
    if (!j)
      stamp("gallery-rowan", x, 134, 2.1, 1, () =>
        rowanModel("front", 0, "idle"),
      );
    else if (j === 9) stamp("gallery-mentor", x, 134, 2.1, 1, mentorModel);
    else
      stamp("gallery-resident" + j, x, 134, 2.1, 1, () =>
        resident(0, 0, j - 1),
      );
    txt(
      ["Rowan", ...residents, "Merin", "Nelle", "Ione"][j],
      x,
      149,
      "#e3d5b8",
      8,
      "center",
    );
  }
  section(181, "Guardians of the Crown");
  for (let j = 0; j < 11; j++) {
    let x = 82 + (j % 5) * 151,
      y = 280 + Math.floor(j / 5) * 99;
    oval(x, y, 27, 4, "#0c1a1e");
    stamp("gallery-sovereign" + j, x, y - 1, 1.45, 1, () =>
      sovereign(Math.min(j, 9), 1, "stalk", true, j === 10),
    );
    txt(
      j === 10 ? "The Hollow Crown" : bosses[j],
      x,
      y + 15,
      "#eddbba",
      8,
      "center",
    );
  }
  for (let j = 0; j < 4; j++) {
    let x = 235 + j * 151;
    stamp("gallery-rowan-action" + j, x, 477, 2, 1, () =>
      rowanModel(
        ["front", "side", "front", "side"][j],
        [0, 2, 0, 2][j],
        ["idle", "walk", "shield", "attack"][j],
        j === 3,
      ),
    );
    txt(
      ["At rest", "Travel", "Guard", "Strike"][j],
      x,
      493,
      "#adbea9",
      7,
      "center",
    );
  }
  section(519, "Keepers of the treasuries");
  for (let i = 0; i < 10; i++) {
    let x = 82 + (i % 5) * 151,
      y = 570 + Math.floor(i / 5) * 54;
    stamp("gallery-warden" + i, x, y, 1.2, 1, () => wardenModel(i, 0, "warn"));
    txt(minis[i], x, y + 12, "#d1c8b2", 7, "center");
  }
  section(674, "Creatures of Aurelia and the Gloam");
  for (let i = 0; i < 28; i++) {
    let x = 65 + (i % 7) * 106,
      y = 726 + Math.floor(i / 7) * 52;
    stamp("gallery-small" + i, x, y, 1.45, 1, () => smallModel(i, 0, "stalk"));
    txt(enemies[i], x, y + 12, "#d1c8b2", 7, "center");
  }
  section(931, "Lantern instruments and treasures");
  for (let i = 0; i < 11; i++) {
    let x = 45 + i * 68;
    glyph(x, 971, i, 1.8);
    let l = toolsList[i].split(" ");
    l.forEach((n, j) => txt(n, x, 995 + j * 9, "#d9c9a4", 7, "center"));
  }
  section(1040, "Dungeon entrances and mechanisms");
  for (let d = 0; d < 10; d++) {
    const x = 82 + (d % 5) * 151,
      y = 1102 + Math.floor(d / 5) * 86;
    stamp("gallery-entrance" + d, x - 16, y, 1.28, 1, () => entranceSculpt(d));
    stamp("gallery-control" + d, x + 26, y, 1.4, 1, () =>
      mechanismModel(d, false, true, 1),
    );
    txt(names[d], x, y + 15, "#eddbba", 8, "center");
    txt(mechanisms[d], x, y + 27, "#adbea9", 7, "center");
  }
  g = old;
  return sheet.toDataURL("image/png").split(",")[1];
}
function environmentGallery() {
  const previous = structuredClone(S),
    previousMode = mode,
    previousNotice = noticeTime,
    previousPlayer = [p.x, p.y],
    sheet = document.createElement("canvas");
  sheet.width = 1152;
  sheet.height = 306 + 6 * 212;
  let c = sheet.getContext("2d");
  c.fillStyle = "#14272a";
  c.fillRect(0, 0, sheet.width, sheet.height);
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#d8bc85";
  c.font = "13px monospace";
  c.fillText("VEILBOUND", 20, 23);
  c.fillStyle = "#f0e4c6";
  c.font = "27px Georgia";
  c.fillText("Aurelia and the Gloam", 20, 57);
  try {
    for (let a = 0; a < 12; a++)
      for (let w = 0; w < 2; w++) {
        S.area = a;
        S.world = w;
        S.d = -1;
        S.cave = "";
        S.r = 0;
        newRoom(192, 149);
        mode = "play";
        noticeTime = 0;
        p.inv = 0;
        paint();
        let col = a % 3,
          row = Math.floor(a / 3) * 2 + w,
          X = col * 383 + 12,
          Y = 76 + row * 184;
        c.drawImage(
          cv,
          0,
          27 * graphics.scale,
          cv.width,
          cv.height - 27 * graphics.scale,
          X,
          Y,
          363,
          178,
        );
        c.fillStyle = "#122327e8";
        c.fillRect(X, Y + 155, 363, 23);
        c.fillStyle = w ? "#c6b5d2" : "#d6c69a";
        c.font = "13px Georgia";
        c.fillText((w ? gloam : places)[a], X + 8, Y + 171);
      }
  } finally {
    S = previous;
    newRoom(...previousPlayer);
    mode = previousMode;
    noticeTime = previousNotice;
  }
  return sheet.toDataURL("image/png").split(",")[1];
}
function screenGallery() {
  const save = S;
  const state = {
    mode,
    menu,
    menuFrom,
    sel,
    page,
    mapWorld,
    dialog,
    noticeTime,
  };
  const position = [p.x, p.y];
  const create = (cols, rows) => {
    const sheet = document.createElement("canvas");
    sheet.width = cols * 240;
    sheet.height = rows * 153;
    return sheet;
  };
  const draw = (sheet, cols, index, label) => {
    paint();
    const ctx = sheet.getContext("2d");
    const x = (index % cols) * 240,
      y = Math.floor(index / cols) * 153;
    ctx.drawImage(cv, x, y, 240, 135);
    ctx.fillStyle = "#171b32";
    ctx.fillRect(x, y + 135, 240, 18);
    ctx.fillStyle = "#f8dfb7";
    ctx.font = "12px Georgia";
    ctx.fillText(label, x + 7, y + 148, 226);
  };
  const roomsSheet = create(12, 12);
  const menuSheet = create(4, 3);
  const encode = (sheet) => sheet.toDataURL("image/webp", 0.88).split(",")[1];
  try {
    S = blank();
    S.items = toolsList.map((_, i) => i);
    S.slots = [0, 5];
    noticeTime = 0;
    for (let d = 0; d < names.length; d++)
      for (let room = 0; room < rooms.length; room++) {
        S.d = d;
        S.r = room;
        S.world = d >= 4 ? 1 : 0;
        S.area = sites[d];
        newRoom(190, 158);
        mode = "play";
        p.inv = 0;
        draw(
          roomsSheet,
          12,
          d * 12 + room,
          room === 0 ? names[d] : rooms[room],
        );
      }
    S.d = -1;
    S.r = 0;
    S.cave = "trial";
    for (let world = 0; world < 2; world++)
      for (let area = 0; area < 12; area++) {
        S.world = world;
        S.area = area;
        newRoom(190, 158);
        p.inv = 0;
        draw(
          roomsSheet,
          12,
          120 + world * 12 + area,
          caveName() + " · " + (world ? gloam : places)[area],
        );
      }
    S.cave = "";
    S.world = 0;
    S.area = 5;
    S.bells = [5, 1, 3, 7, 9, 12, 15, 17, 19, 21, 23];
    newRoom(192, 153);
    p.inv = 0;
    mode = "title";
    sel = 0;
    draw(menuSheet, 4, 0, "Title screen");
    const menus = [
      "pause",
      "inventory",
      "map",
      "journal",
      "bindings",
      "bells",
      "confirm",
    ];
    for (const [i, name] of menus.entries()) {
      mode = name === "confirm" ? "title" : "play";
      openMenu(name);
      if (name === "inventory") sel = 6;
      if (name === "bells") sel = 8;
      draw(menuSheet, 4, i + 1, menuHeadings[name]);
    }
    mode = "defeat";
    draw(menuSheet, 4, 8, "Defeat");
    mode = "ending";
    draw(menuSheet, 4, 9, "Ending");
    say(
      "Merin, the bellwarden",
      "Rowan, Ione rang the west bell three nights ago. Her lantern came back alone.",
    );
    dialog.age = 99;
    draw(menuSheet, 4, 10, "Dialogue");
    mode = "play";
    S.done = [0, 1, 2, 3];
    S.seen = [...Array(24).keys()];
    openMenu("map");
    mapWorld = 1;
    draw(menuSheet, 4, 11, "Gloam map");
    return {
      "room-gallery": encode(roomsSheet),
      "menu-gallery": encode(menuSheet),
    };
  } finally {
    S = save;
    newRoom(...position);
    ({ mode, menu, menuFrom, sel, page, mapWorld, dialog, noticeTime } = state);
  }
}
async function verifyArtwork() {
  let previous = structuredClone(S),
    oldMode = mode,
    oldSound = opts.sound,
    oldAc = ac,
    oldMaster = opts.master,
    oldMusic = opts.music,
    oldSfx = opts.sfx,
    oldBeat = beat,
    oldNext = nextBeat;
  let messages = [];
  function ok(b, text) {
    if (!b) throw Error(text);
    messages.push(text);
  }
  function sprite(id, draw) {
    stamp("validation/" + id, 180, 100, 1, 1, draw);
    let e = actorAtlas.get("validation/" + id);
    if (
      !e ||
      e.w < 3 ||
      e.h < 3 ||
      e.x <= -56 ||
      e.y <= -74 ||
      e.x + e.w >= 56 ||
      e.y + e.h >= 14
    )
      throw Error("Empty or clipped artwork " + id);
    return e.tile.toDataURL();
  }
  try {
    let ids = new Set();
    for (let j = 0; j < 28; j++)
      ids.add(sprite("mob" + j, () => smallModel(j, 1, "warn")));
    ok(
      ids.size === 28,
      "28 distinct enemy silhouettes render inside atlas bounds",
    );
    for (let d = 0; d < 10; d++) {
      sprite("warder" + d, () => wardenModel(d, 1, "warn"));
      sprite("boss" + d, () => sovereign(d, 1, "warn", false, false));
      sprite("gate" + d, () => entranceSculpt(d));
      sprite("mechanism" + d, () => mechanismModel(d, true, true, 1));
      sprite("tool" + d, () => itemModel(d));
    }
    ok(
      true,
      "All ten dungeon entrances, warders, bosses, receivers and treasury instruments render without clipping",
    );
    let actions = new Set();
    for (let a of ["idle", "walk", "shield", "attack", "dodge"])
      actions.add(sprite(a, () => rowanModel("side", 2, a)));
    ok(
      actions.size === 5,
      "Distinct idle, walk, shield, strike and dodge poses",
    );
    ok(
      sprite("left", () => rowanModel("side", 2, "attack", true, -1)) !==
        sprite("right", () => rowanModel("side", 2, "attack", true, 1)),
      "Left and right sword poses render independently",
    );
    function paintedPose(view, stance, phase, facing = 1, restored = false) {
      return makeLayer(
        () => {
          if (!paintedRowan(32, 30, 1, facing, view, stance, phase, restored))
            throw Error("Painted Rowan fell back to the miniature");
        },
        64,
        40,
      ).toDataURL();
    }
    for (const view of ["front", "side", "back"]) {
      const poses = [
        paintedPose(view, "idle", 0),
        paintedPose(view, "walk", 2),
        paintedPose(view, "walk", 6),
        paintedPose(view, "dodge", 0),
        paintedPose(view, "shield", 0),
        ...[0, 2, 4].map((phase) => paintedPose(view, "attack", phase)),
      ];
      if (new Set(poses).size !== poses.length)
        throw Error("Missing painted pose for " + view);
    }
    ok(
      paintedPose("side", "walk", 2, -1) !== paintedPose("side", "walk", 2) &&
        paintedPose("side", "attack", 2, 1, true) !==
          paintedPose("side", "attack", 2),
      "Painted Rowan walks, dodges, guards and strikes in every direction with a distinct Dawnsteel blade",
    );
    ok(
      sprite("closed", () => propModel("chest", false)) !==
        sprite("opened", () => propModel("chest", true)),
      "Opened treasure chest has a separate silhouette",
    );
    const boundaries = {
      left: [0, 119],
      right: [383, 119],
      up: [192, 27],
      down: [192, 215],
    };
    for (let w = 0; w < 2; w++)
      for (let a = 0; a < 12; a++) {
        S.area = a;
        S.world = w;
        S.d = -1;
        S.r = 0;
        S.cave = "";
        newRoom(192, 149);
        paint();
        for (const [direction, position] of Object.entries(boundaries))
          if (
            trailAt(...position) !==
            scene.exits.some((exit) => exit.dir === direction)
          )
            throw Error(
              `Trail differs from room exits at ${w}/${a}/${direction}`,
            );
        if (scene.water.length) {
          const layer = scene.riverArt.map
            .getContext("2d")
            .getImageData(0, 0, W, H).data;
          const wet = (x, y) => scene.water.some((box) => inside(x, y, box));
          // The river texture must follow all water and dry-riverbed footprints.
          for (let y = 29; y < H; y += 3)
            for (let x = 0; x < W; x += 3)
              if ((layer[(y * W + x) * 4 + 3] !== 0) !== wet(x, y))
                throw Error(
                  `Water texture differs from geography at ${w}/${a}/${x},${y}`,
                );
        }
      }
    ok(
      actorAtlas.size <= 384,
      "All 24 overworlds render with a bounded pose cache",
    );
    ok(
      true,
      "Painted roads follow actual exits and water textures follow the water and riverbed geometry",
    );
    S.area = 5;
    S.world = 0;
    S.items = S.items.filter((item) => item !== 1);
    newRoom(192, 149);
    const bridge = scene.obj.find((o) => o.type === "bridge");
    const bank = scene.water.find((water) => water.y === 208);
    ok(
      bridge && !solid(bridge.x, bridge.y) && solid(bank.x + 3, 208),
      "The southwest brook can be crossed on its footbridge without River Boots",
    );
    // Sample the real mixer through an analyser. Chrome's speaker output is muted.
    async function sample(volume) {
      let ctx = new AudioContext();
      ac = ctx;
      opts.sound = true;
      opts.music = volume;
      opts.sfx = volume;
      try {
        await ctx.resume();
        let analyser = ctx.createAnalyser();
        mixer().master.connect(analyser);
        let values = new Float32Array(analyser.fftSize);
        let energy = 0;
        for (let j = 0; j < 11; j++) instrumentSound(j);
        cue("find");
        beat = 0;
        nextBeat = 0;
        music();
        for (let j = 0; j < 5; j++) {
          await new Promise((r) => setTimeout(r, 45));
          analyser.getFloatTimeDomainData(values);
          for (let v of values) energy += Math.abs(v);
        }
        return energy;
      } finally {
        await ctx.close();
      }
    }
    ok(
      (await sample(50)) > 1,
      "Layered music and tool effects produce a non-silent Web Audio render",
    );
    ok(
      (await sample(0)) === 0,
      "Muted music and effects produce digital silence",
    );
    // Keep the same voice running as each fader moves to test already-playing sounds.
    const live = new AudioContext();
    ac = live;
    opts.master = 100;
    opts.music = 100;
    opts.sfx = 100;
    opts.sound = true;
    try {
      await live.resume();
      const analyzer = live.createAnalyser(),
        wave = new Float32Array(analyzer.fftSize);
      mixer().master.connect(analyzer);
      async function peak() {
        await new Promise((r) => setTimeout(r, 125));
        analyzer.getFloatTimeDomainData(wave);
        return wave.reduce((n, v) => Math.max(n, Math.abs(v)), 0);
      }
      tone(392, 4, "sine", 0.24, true);
      const musicOn = await peak();
      opts.sfx = 0;
      syncMixer();
      const justMusic = await peak();
      opts.music = 0;
      syncMixer();
      const musicOff = await peak();
      ok(
        musicOn > 0.005 && justMusic > 0.005 && musicOff < 0.00001,
        "Music and effects faders isolate their channels and mute a sustained note",
      );
      opts.sfx = 100;
      syncMixer();
      tone(523, 4, "triangle", 0.24);
      const fx = await peak();
      opts.master = 18;
      syncMixer();
      const quiet = await peak();
      opts.master = 0;
      syncMixer();
      const silent = await peak();
      opts.master = 100;
      syncMixer();
      const restored = await peak();
      opts.sound = false;
      syncMixer();
      const muted = await peak();
      ok(
        fx > 0.005 &&
          quiet > 0 &&
          quiet < fx * 0.4 &&
          silent < 0.00001 &&
          restored > quiet &&
          muted < 0.00001,
        "Master gain, zero volume and mute change the signal while an effect is playing",
      );
    } finally {
      await live.close();
    }
  } finally {
    S = previous;
    newRoom(S.x, S.y);
    mode = oldMode;
    ac = oldAc;
    opts.sound = oldSound;
    opts.music = oldMusic;
    opts.sfx = oldSfx;
    opts.master = oldMaster;
    beat = oldBeat;
    nextBeat = oldNext;
  }
  return messages;
}
