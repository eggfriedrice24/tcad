import { Grid } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Color } from "three";

const BG_LIGHT = new Color(0xFAFAFA);
const BG_DARK = new Color(0x0A0A0A);

export function Scene() {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    scene.background = isDark ? BG_DARK : BG_LIGHT;

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains("dark");
      scene.background = dark ? BG_DARK : BG_LIGHT;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [scene, gl]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 7]} intensity={0.8} />
      <Grid
        args={[100, 100]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#a1a1aa"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#71717a"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid
      />
    </>
  );
}
