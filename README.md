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

Pause to open the quest journal, adjust controls, or export a save. The map and journal open in Rowan’s vellum field book, and equipped tools sit in a stitched leather roll. Bell towers restore supplies and link discovered destinations. On a portrait phone, full-size menu actions sit beneath the game view.

The game renders in Canvas 2D. Painted textures follow the actual roads and dungeon layouts. Each of the 24 overworld areas has its own palette and landmark art, and each dungeon combines its materials and guardian with lighting and decoration keyed to the room’s purpose. Rowan, the village cast, guardians, and instruments use painted sprites. The [art pack](play/art/README.md) documents the atlases and generation prompts.

The [overworld gallery](verification/environment-gallery.png) pairs each region of Aurelia with its Gloam counterpart. The [room gallery](verification/room-gallery.webp) shows all 120 dungeon rooms and 24 cave variants. The [menu gallery](verification/menu-gallery.webp), [settings capture](verification/settings.png), and [portrait menu capture](verification/mobile-menu.png) show the interface in play.

Run `node verification/check.mjs` with Node 22+ and Chrome installed to play through the campaign headlessly, run the interaction, artwork, and audio checks, and regenerate the captures and [verification results](verification/results.json). Set `CHROME_PATH` to select a different Chrome executable.

GitHub Pages publishes the repository root from `main`. The marketing site lives in [index.html](index.html), and its Play links open the standalone game in [play/](play/).

The homepage opens on the game’s moonlit bell scene. Its Play command starts a new journey or resumes a valid local save. The realm slider compares the same view of Bellwick and Hushwick, and the gameplay reel tours two overworld areas and two heart chambers. The journal pairs all twelve regions of Aurelia with their Gloam counterparts and shows the instruments from the game renderer.

<details>
<summary>Earlier promotional artwork</summary>

The original promotional [bell tower](assets/journal/bell-tower.webp) and its [mobile crop](assets/journal/bell-tower-mobile.webp) were made with built-in ImageGen. The current homepage artwork, gameplay screenshots, and journal illustrations use the game renderer.

**Generation prompt**

Panoramic 2:1 PIXEL ART title screen environment for Veilbound, no text or UI. Masterful richly detailed hand-pixelled 32-bit gothic RPG art, clearly visible crisp clustered square pixels, selective dithering, ultramarine indigo night sky, pale luminous moonlight, turquoise magic against amber lanterns. Right half: huge ruined bell arch on forested rocky cliff with real antique bell hanging beneath ivy-covered pointed arch. A distinctive small traveller in an oxblood red hooded cloak seen from behind at lower right, holding their bright golden lantern before the arch. In deep valley: tiny golden rooftops and windows of village Bellwick, a long silvery waterfall, pines and distant jagged mountains. A large luminous crescent moon in upper right sky. Left half deliberately quieter dark blue night sky above distant mountains and pine silhouettes, natural negative space behind a menu to be overlaid later. Epic environmental pixel art, beautifully art directed and subtly textured, clearly legible silhouette. No lettering, logos, UI, border, writing or watermarks. Purpose: atmospheric interactive title-screen backdrop.

</details>
