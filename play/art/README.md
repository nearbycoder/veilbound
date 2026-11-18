# Veilbound sprite artwork

The bundled WebP sheets were made with built-in ImageGen using the supplied Bellwick and Hushwick diptych as a reference. The game composites them at the selected graphics quality and loads them from the same folder for offline play.

| File | Layout |
| --- | --- |
| [rowan.webp](rowan.webp) | Eleven 180 × 144 cells per row. The rows face forward, right, and away. The engine mirrors the side row for left-facing motion. Columns hold idle, two walking steps, dodge, guard, three sword poses, and three Dawnsteel poses. Each cell uses a foot anchor at (90, 130). |
| [village.webp](village.webp) | Two rows of transparent cutouts. Bellwick is on top and Hushwick is below. The `villageSprites` table in [the renderer](../index.html) records the source rectangles. |
| [village-ground.webp](village-ground.webp) | Six seamless 384 × 384 tiles. Each row contains ground cover, stone paving, and dirt track in that order. |
| [moonlit-valley.webp](moonlit-valley.webp) | A 1600 × 900 title backdrop. The engine draws the bell and Rowan as separate sprites on the rock ledge. |

## Generation prompts

- **Architecture.** Translate the reference’s engraved bell arch and honey and teal cottages into six separate sprites. Match the stone, timber, ivy, and lighting in both realms. Use a 40° overhead camera and keep the arch opening transparent.
- **Foliage and market.** Paint isolated apple and wine-red trees, market stands with their own wares, and flowers or cyan mushrooms. Use the corresponding palette from each half of the reference and keep the ground transparent.
- **Street props.** Recreate the reference’s curved stone footbridge with a leaf keystone, split-rail fence with stone endposts, and lantern on a dark wood post. Match the silhouette in both realms and preserve the opening under the bridge.
- **Landmarks and residents.** Paint paired cave mouths and open rune arches, Tess in her courier outfits, Merin with his red cap and staff, and Nelle with her embroidered plum cloak and lamp. Match the perspective and proportions of the Rowan sheet.
- **Rowan movement.** Use the reference’s burnt-orange hood, gold trim, dark hair, teal clothing, leather boots, and brass lantern. Draw front, side, and back rows with neutral stance, two steps, and a dodge. Keep the figure size and foot line consistent.
- **Rowan combat.** Use the movement sheet as the identity reference. Draw a round-shield guard, sword windup, extension, and follow-through in each of the same three directions. Leave swing effects to the game renderer.
- **Terrain.** Paint overhead tiles for orchard cover, irregular limestone setts, and pebble dirt, plus their violet and cyan counterparts. Keep the six materials distinct and make the edges repeatable.
- **Title backdrop.** Repaint the title’s layout with the reference’s foliage, a full moon, waterfalls, and a lit village in a blue valley. Leave the right-hand ledge open for the bell and Rowan and the left side dim enough for the title and menu.
