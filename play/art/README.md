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
| [kit-book.webp](kit-book.webp) | Open vellum field book for the map, journal, and keyboard bindings. |
| [kit-roll.webp](kit-roll.webp) | Open leather tool roll for equipment. |
| [kit-surfaces.webp](kit-surfaces.webp) | Six 256 × 256 material tiles for walnut, vellum, leather, felt, brass, and slate. The native controls use cropped copies of the same materials. |
| [kit-fittings.webp](kit-fittings.webp) | Six 192 × 192 cutouts for the health gem, lantern, keycap, tool socket, and two realm seals. |
| [kit-sign.webp](kit-sign.webp) | Carved walnut signboard for menu actions and the location plaque. |
| [foes-orchard.webp](foes-orchard.webp), [foes-gloam.webp](foes-gloam.webp), [foes-court.webp](foes-court.webp), [foes-border.webp](foes-border.webp) | All 28 regular enemies in game data order, eight per atlas and four on the last sheet. 432 × 432 cells. |
| [warders-early.webp](warders-early.webp), [warders-late.webp](warders-late.webp) | Five warders per sheet, in dungeon order, in 496 × 496 cells. |
| [entrances-early.webp](entrances-early.webp), [entrances-late.webp](entrances-late.webp) | Five dungeon entrances and a cave mouth per sheet. 520 × 520 cells. |
| [room-props.webp](room-props.webp), [mechanisms.webp](mechanisms.webp) | 384 × 384 cells for pots, chests, wells, plates, levers, weights, tablets, resets, and the ten dungeon mechanisms. |
| [field-props.webp](field-props.webp), [field-structures.webp](field-structures.webp), [field-flora.webp](field-flora.webp) | Furnishings in 384 × 384 cells and bridges, trees, reeds, rocks, stairs, and a windmill in 520 × 520 cells. |
| [villagers.webp](villagers.webp) | The five remaining villagers and a Gloam windmill. 432 × 432 cells. |
| [interaction-props.webp](interaction-props.webp), [finds.webp](finds.webp) | 384 × 384 cells for mirrors, portraits, relays, bells, moving rafts, return pads, hazards, quest items, keys, pickups, and lanterns. |
| [masonry-fittings.webp](masonry-fittings.webp), [wallstone-a.webp](wallstone-a.webp), [wallstone-b.webp](wallstone-b.webp), [water-surfaces.webp](water-surfaces.webp) | Column and window cutouts, 448 × 448 wall tiles in dungeon order with caves in the last cell of each sheet, and 512 × 512 water and exposed riverbed tiles for both realms. |

The [field renderer](../field-art.js) anchors the new cutouts eight pixels above the bottom of each cell and mirrors the combatants at runtime. The entrance art is separate from the wall openings inside the dungeons. Those openings share the stone wall mask and use the existing room graph and lock state.

## Generation prompts

- **Enemies and warders.** Use the village diptych’s small adventurer as the reference for scale, painterly edges, and three-quarter orthographic view. Give each creature its own full-body silhouette and readable gear. Acorn armor, aquamarine glass wings, forge chitin, root limbs, dark velvet, coral fins, clockwork, ice, and sand distinguish the different regions. Face slightly right in a ready stance and leave transparent gutters for the foot anchors and mirrored animation.
- **Entrances and cave mouths.** Paint isolated heavy arches with a deep, dark recess, sculpted jambs, and two or three shallow stone steps. Use the ten dungeon material palettes, with a mossy cave in Aurelia and purple rock and cyan fungi in the Gloam.
- **Puzzle props and mechanisms.** Use small sculpted cutouts with upper-left lighting. Paint closed and open chests, opposing lever positions, carved bowls and tablets, and one mechanism for each dungeon. Paint the mirror, gilt portrait, relay socket, tether ring, bell, raft, crystal and thorn traps, and antique brass gear separately.
- **Villagers, foliage, and field props.** Paint Pella with her apple basket, Oren with his fishing rod, Fenn with his hammer, Isla with her telescope, and Marn carrying grain. Use matching perspective for the bridge, mill towers with separate animated sails, carts, skiff, trellis, kiln, stores, shelves, stone clusters, reeds, and the hollow trees in both realms.
- **Finds.** Paint the ledger, flute, spindle, chart, mill key, and bell ribbon as isolated quest objects. Give the health charm, coin, two dungeon keys, and amber and cyan lanterns distinct high-contrast silhouettes.
- **Masonry and water.** Paint full-bleed close-up wall tiles with running-bond joints, chips, and mineral streaks in each dungeon palette. Paint separate column and stained glass cutouts. Use overhead river surfaces with thin painted current ripples and two exposed riverbed textures, matching the Aurelia and Gloam palettes.

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
- **Field book and tool roll.** Paint an open brass-bound vellum ledger with a pressed leaf and a separate open oxblood leather roll with stitched suede compartments. Keep the writing and tool surfaces clear for the game renderer.
- **Interface materials and fittings.** Paint matte walnut, vellum, leather, green felt, hammered brass, and slate as flat game textures. Isolate a red heart gem, an enamel lantern, a blank brass keycap, a felt tool socket, and claret and violet realm seals. Use the eight-point crest from the village bell arch.
- **Menu sign.** Paint an isolated walnut board with beveled ends, brass leaf fittings, and a clear center for menu labels.
