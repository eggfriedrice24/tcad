import { DoubleSide, MeshStandardMaterial } from "three";

export const defaultMaterial = new MeshStandardMaterial({
  color: 0xD4D4D8,
  side: DoubleSide,
  flatShading: true,
});

export const selectedMaterial = new MeshStandardMaterial({
  color: 0xEC4899,
  side: DoubleSide,
  flatShading: true,
});

export const hoveredMaterial = new MeshStandardMaterial({
  color: 0xA1A1AA,
  side: DoubleSide,
  flatShading: true,
});
