# Veilbound sprite artwork

The bundled WebP sheets were made with built-in ImageGen using the supplied Bellwick and Hushwick diptych as a reference. The game composites them at the selected graphics quality and loads them from the same folder for offline play.

| File | Layout |
| --- | --- |
| [rowan.webp](rowan.webp) | Eleven 180 × 144 cells per row. The rows face forward, right, and away. The engine mirrors the side row for left-facing motion. Columns hold idle, two walking steps, dodge, guard, three sword poses, and three Dawnsteel poses. Each cell uses a foot anchor at (90, 130). |
| [village.webp](village.webp) | Two rows of transparent cutouts. Bellwick is on top and Hushwick is below. The `villageSprites` table in [the renderer](../index.html) records the source rectangles. |
| [village-ground.webp](village-ground.webp) | Six seamless 384 × 384 tiles. Each row contains ground cover, stone paving, and dirt track in that order. |
| [moonlit-valley.webp](moonlit-valley.webp) | A 1600 × 900 title backdrop. The engine draws the bell and Rowan as separate sprites on the rock ledge. |
| [world-surfaces.webp](world-surfaces.webp) | Six columns by four rows of 256 × 256 world materials. Each realm occupies two rows, ordered by region index. |
| [region-props.webp](region-props.webp) | Four columns by six rows of 256 × 256 landmark sprites in region order, paired by realm. |
| [chamber-surfaces.webp](chamber-surfaces.webp) | Four columns by three rows of 256 × 256 tiles. The dungeon floors are followed by the two cave materials. |
| [sanctum-props.webp](sanctum-props.webp) | Five columns by two rows of 256 × 256 relics in dungeon order. |
| [guardians.webp](guardians.webp) | Four columns by three rows of 256 × 256 guardian sprites in dungeon order, followed by the Regent’s fractured form. |
| [instruments.webp](instruments.webp) | Four columns by three rows of 256 × 256 sprites in instrument order. |
| [interface.webp](interface.webp) | A two-by-two atlas of the handbell, journal, satchel, and compass. |
| [last-bell.webp](last-bell.webp) | A 1600 × 900 dawn illustration for the ending. |

## Generation prompts

- **Architecture.** Translate the reference’s engraved bell arch and honey and teal cottages into six separate sprites. Match the stone, timber, ivy, and lighting in both realms. Use a 40° overhead camera and keep the arch opening transparent.
- **Foliage and market.** Paint isolated apple and wine-red trees, market stands with their own wares, and flowers or cyan mushrooms. Use the corresponding palette from each half of the reference and keep the ground transparent.
- **Street props.** Recreate the reference’s curved stone footbridge with a leaf keystone, split-rail fence with stone endposts, and lantern on a dark wood post. Match the silhouette in both realms and preserve the opening under the bridge.
- **Landmarks and residents.** Paint paired cave mouths and open rune arches, Tess in her courier outfits, Merin with his red cap and staff, and Nelle with her embroidered plum cloak and lamp. Match the perspective and proportions of the Rowan sheet.
- **Rowan movement.** Use the reference’s burnt-orange hood, gold trim, dark hair, teal clothing, leather boots, and brass lantern. Draw front, side, and back rows with neutral stance, two steps, and a dodge. Keep the figure size and foot line consistent.
- **Rowan combat.** Use the movement sheet as the identity reference. Draw a round-shield guard, sword windup, extension, and follow-through in each of the same three directions. Leave swing effects to the game renderer.
- **Terrain.** Paint overhead tiles for orchard cover, irregular limestone setts, and pebble dirt, plus their violet and cyan counterparts. Keep the six materials distinct and make the edges repeatable.
- **Title backdrop.** Repaint the title’s layout with the reference’s foliage, a full moon, waterfalls, and a lit village in a blue valley. Leave the right-hand ledge open for the bell and Rowan and the left side dim enough for the title and menu.
- **Overworld materials.** Paint repeatable overhead orchard litter, marsh mud, snowy scree, meadow grass, river stones, bluff sod, basalt, graveyard earth, court paving, dune sand, and coastal shale. Keep each surface distinct and legible beneath the player. The packed Gloam tiles use region-specific color grades.
- **Regional landmarks.** Isolate an apple tree, willow, basalt cluster, alpine pine, haycart, obelisk, court fountain, desert tree, driftwood, reed bed, and windblown lantern pine. Use the same overhead perspective and alpha treatment as the village cutouts.
- **Dungeon materials and relics.** Paint visually distinct low-contrast materials for mossy limestone, aqueduct slate, foundry bronze, observatory mosaics, manor parquet, Choir tiles, clockwork cast iron, Reliquary ice, garden serpentine stone, citadel amethyst, and two natural cave surfaces. Give each dungeon a matching isolated relic, from a moss-covered plinth to a fractured crown.
- **Guardians and instruments.** Illustrate the ten guardian silhouettes and the Regent’s fractured form in painted pixels. Produce individual transparent instrument sprites with readable outlines and distinguishing materials.
- **Menu illustrations.** Paint an engraved handbell, open field journal, leather satchel, and brass compass as four cutouts on transparent backgrounds.
- **Ending.** Paint Rowan and Ione standing over the forest village at dawn, with the lantern lifted and room for the closing text along the left edge.
