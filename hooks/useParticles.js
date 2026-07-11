import { useEffect } from "react";

// Initialize the particles.js star background (a global CDN script) once on mount.
export function useParticles(id = "particles-js") {
  useEffect(() => {
    if (typeof window.particlesJS !== "function") return; // CDN blocked / offline
    window.particlesJS(id, {
      particles: {
        number: { value: 130, density: { enable: true, value_area: 900 } },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.7, random: true, anim: { enable: true, speed: 0.6, opacity_min: 0.15 } },
        size: { value: 1.8, random: true },
        line_linked: { enable: false },
        move: { enable: true, speed: 0.35, direction: "none", random: true, out_mode: "out" }
      },
      retina_detect: true
    });
  }, [id]);
}
