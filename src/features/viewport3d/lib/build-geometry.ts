import type { MeshData } from "@/types/mesh";

import { BufferAttribute, BufferGeometry } from "three";

export function buildGeometry(mesh: MeshData): BufferGeometry {
  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new BufferAttribute(new Float32Array(mesh.positions), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(mesh.normals), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(mesh.uvs), 2));
  geometry.setIndex(new BufferAttribute(new Uint32Array(mesh.indices), 1));

  geometry.computeBoundingSphere();

  return geometry;
}
