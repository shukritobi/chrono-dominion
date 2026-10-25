# First three original tank sprites

The browser game loads three original, standalone SVGs from this folder:

| Army | Vehicle | File |
| --- | --- | --- |
| Coalition Forces | Lynx Battle Tank | [coalition-lynx.svg](coalition-lynx.svg) |
| Iron Federation | Bull Battle Tank | [federation-bull.svg](federation-bull.svg) |
| Psionic Order | Viper Battle Tank | [psionic-viper.svg](psionic-viper.svg) |

These are **vector pilot sprites**, not extracted art from any commercial title. Browser `Image` assets load asynchronously; the game gracefully falls back to procedural vehicle drawings if sprites cannot be loaded.

A separate high-resolution three-tank concept sheet and 128px transparent raster prototypes were produced in an asset pack. The raster concept assets have not been committed to the repository yet. They should be uploaded once approved and should not be presented as complete multi-angle 3D renders.

## Next asset pipeline tasks
1. Review/approve the faction silhouette designs.
2. Create editable 3D meshes from approved concepts.
3. Lock the orthographic camera, world-to-pixel ratio, lighting and team-colour system.
4. Render 32-direction vehicle sprite sets and animated movement/turrets.
5. Generate PNG/WebP atlases + consistent pivot metadata.
6. Replace the static pilot SVG draw path with atlas frame selection; validate on all three maps.

See [manifest.json](manifest.json) for current sprite IDs and metadata.
