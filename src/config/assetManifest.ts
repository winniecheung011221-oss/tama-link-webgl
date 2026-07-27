export const ASSETS = {
  device: {
    full: {
      url: "/models/device/tama-device-full.glb",
      scale: 3.25,
      position: [0.12, -0.12, 0] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
    buttons: {
      call: "/models/device/buttons/button-call-green.glb",
      play: "/models/device/buttons/button-play-yellow.glb",
      feel: "/models/device/buttons/button-feel-purple.glb",
    },
  },
  pet: {
    primary: "/models/pet/meowchi-animated-compressed.glb",
    fallbackImage: "/reference/phase-two/pet-front.png",
    scale: 3.15,
    position: [0, -1.55, 0] as [number, number, number],
  },
  props: {
    strawberry: "/models/props/food-strawberry.glb",
    pudding: "/models/props/food-pudding.glb",
    star: "/models/props/charm-star.glb",
  },
  scenes: {
    petHomeBlack: "/models/scenes/pet-home-black.glb",
  },
} as const;

export const ASSET_AUDIT = {
  note: "All supplied GLBs are single-mesh assets. No named device parts or animation clips were found.",
  webOptimization: "Meshopt geometry, WebP textures, 1024–2048 px texture cap, 10–16% geometry target.",
} as const;
