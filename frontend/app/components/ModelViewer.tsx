"use client";
import React, { useEffect } from "react";

export default function ModelViewer() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as any;

    // Avoid reloading if already available
    if (w.customElements && w.customElements.get("model-viewer")) {
      createModelViewer();
      return;
    }

    // Dynamically load <model-viewer>
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.async = true;

    script.onload = () => {
      console.log("✅ Model-viewer loaded successfully");
      createModelViewer();
    };

    script.onerror = () => {
      console.error("❌ Failed to load model-viewer script");
    };

    document.head.appendChild(script);

    function createModelViewer() {
      const root = document.getElementById("modelviewer-root");
      if (!root) return;
      root.innerHTML = ""; // clear previous
      const el = document.createElement("model-viewer");
      el.setAttribute("src", "/models/bitcoin_factory.glb");
      el.setAttribute("alt", "Bitcoin Factory 3D Model");
      el.setAttribute("camera-controls", "");
      el.setAttribute("auto-rotate", "");
      el.setAttribute("exposure", "1");
      el.setAttribute("shadow-intensity", "1");
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.background = "transparent";
      root.appendChild(el);
    }
  }, []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-black p-4 shadow-xl">
      <div id="modelviewer-root" style={{ width: "100%", height: 520 }} />
    </div>
  );
}
