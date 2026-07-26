# TAMA LINK

Phase-one WebGL prototype for a pocket-sized digital companion.

## Included

- React, TypeScript, React Three Fiber, Drei, and Zustand
- Scroll-driven device rotation, camera push, FOV change, scale, and UI fade
- Procedural placeholder device and pet
- Independent CALL / PLAY / FEEL controls with hover, press, rebound, and cooldown
- A / S / D keyboard mappings
- Screen wake interaction and persisted wake state

## Asset replacement

Place production files at:

- `public/models/device/device.glb`
- `public/models/pet/pet.glb`

The canonical paths, colors, timing, and camera interaction values live in
`src/config/experience.ts`. The next integration pass can swap the procedural
components for GLB loaders while preserving event and state logic.

## Run

Use `pnpm dev` for development and `pnpm build` for a production build.
