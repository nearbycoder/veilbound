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

The characters, creatures, equipment, and puzzle mechanisms are modeled in the HTML file. The game lights these meshes and caches their poses at the selected rendering quality. The [model gallery](verification/model-gallery.png) shows the cast and equipment at a larger scale. The [environment gallery](verification/environment-gallery.png) pairs each region of Aurelia with its counterpart in the Gloam.

Run `node verification/check.mjs` with Node 22+ and Chrome installed to play through the campaign headlessly, run the interaction, artwork, and audio checks, and regenerate the captures and [verification results](verification/results.json). Set `CHROME_PATH` to select a different Chrome executable.

GitHub Pages publishes the repository root from `main`. The marketing site lives in [index.html](index.html), and its Play links open the standalone game in [play/](play/).

<details>
<summary>Cover artwork</summary>

The [desktop cover](assets/media/cover.webp) and [mobile crop](assets/media/cover-mobile.webp) were produced from built-in ImageGen key art. The realm captures, instrument portraits, and gameplay footage come from the game renderer.

**Generation prompt**

Create wide landscape key art for an original dark fantasy indie videogame, Veilbound. A luminous late-autumn sun descends behind a distant tall many-spired stone bell citadel, across a deep mountain valley and a winding golden river. Foreground at RIGHT THIRD (x=74%): solitary young adult adventurer seen from behind in windswept dark oxblood hooded cloak, a small brass lantern with a warm flame at hip, boots and broken sword, gazing out from a crag. Organic pine boughs frame upper right and bottom. Left third is evocative shadowed dark teal forest and negative space for website typography, no text in image. Majestic picturesque golden-hour sky with pale bone and apricot clouds, layers of sage and petrol blue mountains, tactile sweeping brushwork, oil-painted hardcover fantasy novel / modern prestige adventure game poster, beautiful atmospheric perspective, sophisticated restrained color, hand-painted realism; dramatic asymmetric composition. Panoramic extra-wide website hero, fill edge-to-edge. No graphics, no borders, no writing, no UI.

</details>
