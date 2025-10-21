"use client";
import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";

function Model() {
  const { scene } = useGLTF("/public/models/bitcoin_factory.glb");
  return <primitive object={scene} scale={1.5} />;
}

export default function ModelViewer() {
  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden">
      
    </div>
  );
}
