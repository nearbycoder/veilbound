# Veilbound · Echoes of the Hollow Crown

[Play The First Crossing](https://nearbycoder.github.io/veilbound/play/index.html?chapter=crossing) · [Play the full game](https://nearbycoder.github.io/veilbound/play/index.html?launch=1) · [Official site](https://nearbycoder.github.io/veilbound/)

*The First Crossing* follows the bell from Bellwick to Hushwick and into the Drowned Choir. Chapter checkpoints stay in the current session. Choose **Full journey** to reach the ten-dungeon campaign and its browser saves.

For offline play, extract the [game archive](https://nearbycoder.github.io/veilbound/downloads/veilbound.zip) and open [play/index.html](play/index.html) in a browser. Open **Settings** from the title screen, pause menu, or the sliders icon beside your equipped items. The scene preview shows graphics changes as you make them.

Open **Settings → Graphics** and select **Ultra 4K** for a 3840 × 2160 canvas. The game starts on High at 1920 × 1080. Balanced renders at 1152 × 648, and Classic renders at 384 × 216. Use the fullscreen button on the title screen or in play, or choose **Enter fullscreen** in Graphics. Brightness and atmospheric effects can be adjusted independently.

**Audio** starts on your first input. Settings include a master fader and separate music and effects levels. Choose **Preview mix** to hear the current levels. Your preferences save separately from campaign progress.

| Action | Default controls |
| --- | --- |
| Move | WASD or arrows |
| Strike / guard | J or Z / hold K or X |
| Dodge / interact | Space / F or Enter |
| Use equipped instruments | Q and E |
| Equipment / map / pause | Tab / M / Escape |

Pause to open the quest journal, adjust controls, or export a save. The campaign map marks the destination and the next road. You can turn **Follow the trail** off in Gameplay settings. Bell towers restore supplies and link discovered destinations. On a portrait phone, full-size menu actions sit beneath the game view.

The game renders in Canvas 2D. Painted textures follow the roads and dungeon layouts. Each of the 24 overworld areas has its own palette and landmark art. The ten dungeons have individual entrances, materials, warders, and guardians. All 28 regular enemies use painted sprites, with their windups, attacks, and recovery poses animated in the renderer. Dungeon passages have directional stonework and gates that follow each room’s lock state. The [art pack](play/art/README.md) documents the atlases and generation prompts.

The [overworld gallery](verification/environment-gallery.png) pairs each region of Aurelia with its Gloam counterpart. The [room gallery](verification/room-gallery.webp) shows all 120 dungeon rooms and 24 cave variants. The [menu gallery](verification/menu-gallery.webp), [settings capture](verification/settings.png), and [portrait menu capture](verification/mobile-menu.png) show the interface in play.

View the [Orchard Weald fight](verification/orchard-4k.webp) and [Frostbound Reliquary’s Great Lock](verification/dungeon-4k.webp) at 3840 × 2160.

Run `node verification/check.mjs` with Node 22+ and Chrome installed to play through the campaign and The First Crossing, check input, artwork, settings and audio, and regenerate the captures and [verification results](verification/results.json). Set `CHROME_PATH` to select a different Chrome executable. Run `sh scripts/package-game.sh` to rebuild the offline ZIP.

GitHub Pages publishes the repository root from `main`. The marketing site lives in [index.html](index.html), and its Play links open the standalone game in [play/](play/).

The homepage opens on the game’s moonlit bell scene. **Play The First Crossing** opens the chapter, and **Full game** begins or resumes the campaign. The realm slider pairs Bellwick and Hushwick. The field journal shows all 24 regions and the instruments from the game renderer. The [BIG Festival entry packet](SUBMISSION.md) collects the build links, trailer, and AI disclosure.

<details>
<summary>Earlier promotional artwork</summary>

The original promotional [bell tower](assets/journal/bell-tower.webp) and its [mobile crop](assets/journal/bell-tower-mobile.webp) were made with built-in ImageGen. The current homepage artwork, gameplay screenshots, and journal illustrations use the game renderer.

**Generation prompt**

Panoramic 2:1 PIXEL ART title screen environment for Veilbound, no text or UI. Masterful richly detailed hand-pixelled 32-bit gothic RPG art, clearly visible crisp clustered square pixels, selective dithering, ultramarine indigo night sky, pale luminous moonlight, turquoise magic against amber lanterns. Right half: huge ruined bell arch on forested rocky cliff with real antique bell hanging beneath ivy-covered pointed arch. A distinctive small traveller in an oxblood red hooded cloak seen from behind at lower right, holding their bright golden lantern before the arch. In deep valley: tiny golden rooftops and windows of village Bellwick, a long silvery waterfall, pines and distant jagged mountains. A large luminous crescent moon in upper right sky. Left half deliberately quieter dark blue night sky above distant mountains and pine silhouettes, natural negative space behind a menu to be overlaid later. Epic environmental pixel art, beautifully art directed and subtly textured, clearly legible silhouette. No lettering, logos, UI, border, writing or watermarks. Purpose: atmospheric interactive title-screen backdrop.

</details>
