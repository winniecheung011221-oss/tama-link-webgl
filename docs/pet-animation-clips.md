# Pet animation audit

Inspected on 2026-07-27.

| Source | Result |
| --- | --- |
| `宠物动画.glb` | No animation clips |
| `宠物动画_compressed.glb` | No animation clips |
| `宠物动画_webp.glb` | No animation clips |
| `宠物.glb` | No animation clips |

The current site uses the optimized `meowchi-animated-compressed.glb` as the
primary visual model and drives idle, call, play, feel, feed, clean, and sleep
feedback procedurally. A future rigged GLB can replace it without changing the
care-state interface.
