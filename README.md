# Veilbound · Echoes of the Hollow Crown

[Visit the official site](https://nearbycoder.github.io/veilbound/) or [play in your browser](https://nearbycoder.github.io/veilbound/play/).

For offline play, open [play/index.html](play/index.html) in a browser and choose **Begin journey**. The game runs from disk. Open **Settings** from the title screen, pause menu, or the sliders icon beside your equipped items. The scene preview shows graphics changes as you make them.

**Graphics** starts on High at 1920 × 1080, with detailed terrain, shaded models, and cast shadows. Balanced renders at 1152 × 648. Classic uses the original 384 × 216 pixel grid. Brightness and atmospheric effects can be adjusted independently.

**Audio** has a master fader and separate music and effects levels. Choose **Enable sound & preview** to hear the mix. Settings are saved in the browser separately from campaign progress.

| Action | Default controls |
| --- | --- |
| Move | WASD or arrows |
| Strike / guard | J or Z / hold K or X |
| Dodge / interact | Space / F or Enter |
| Use equipped instruments | Q and E |
| Equipment / map / pause | Tab / M / Escape |

Pause to open the quest journal, adjust controls, or export a save. Bell towers restore supplies and link discovered destinations.

The entire game draws its artwork in Canvas 2D. Winding roads follow the actual exits, water follows riverbeds and shorelines, and each dungeon has its own painted materials, lighting, and floor emblems. Rowan, the guardians, equipment, and scenery are built from code-drawn meshes and cached at the selected rendering quality. Aurelia and the Gloam share an original bell motif with different arrangements. The [model gallery](verification/model-gallery.png) shows the cast and equipment at a larger scale. The [environment gallery](verification/environment-gallery.png) pairs each region of Aurelia with its counterpart in the Gloam.

Run `node verification/check.mjs` with Node 22+ and Chrome installed to play through the campaign headlessly, run the interaction, artwork, and audio checks, and regenerate the captures and [verification results](verification/results.json). Set `CHROME_PATH` to select a different Chrome executable.

GitHub Pages publishes the repository root from `main`. The marketing site lives in [index.html](index.html), and its Play links open the standalone game in [play/](play/).

The homepage opens as a bell-tower title screen. Its Play command starts a new journey or resumes a valid local save. The journal pairs all twelve regions of Aurelia with their Gloam counterparts and shows every instrument from the game renderer.

<details>
<summary>Title-screen artwork</summary>

The [bell tower](assets/journal/bell-tower.webp) and its [mobile crop](assets/journal/bell-tower-mobile.webp) were made with built-in ImageGen. The journal’s portraits, landmarks, items, and location captures use the game renderer.

**Generation prompt**

Panoramic 2:1 PIXEL ART title screen environment for Veilbound, no text or UI. Masterful richly detailed hand-pixelled 32-bit gothic RPG art, clearly visible crisp clustered square pixels, selective dithering, ultramarine indigo night sky, pale luminous moonlight, turquoise magic against amber lanterns. Right half: huge ruined bell arch on forested rocky cliff with real antique bell hanging beneath ivy-covered pointed arch. A distinctive small traveller in an oxblood red hooded cloak seen from behind at lower right, holding their bright golden lantern before the arch. In deep valley: tiny golden rooftops and windows of village Bellwick, a long silvery waterfall, pines and distant jagged mountains. A large luminous crescent moon in upper right sky. Left half deliberately quieter dark blue night sky above distant mountains and pine silhouettes, natural negative space behind a menu to be overlaid later. Epic environmental pixel art, beautifully art directed and subtly textured, clearly legible silhouette. No lettering, logos, UI, border, writing or watermarks. Purpose: atmospheric interactive title-screen backdrop.

</details>
