export const THEME = {
  background: "#040605",
  green: "#b8ff5f",
  orange: "#ffae59",
  purple: "#b784ff",
} as const;

export const SCENE = {
  wheelSensitivity: 0.00072,
  pressMs: 220,
  actionMs: 1150,
  modelPaths: {
    device: "/models/device/device.glb",
    pet: "/models/pet/pet.glb",
  },
} as const;
