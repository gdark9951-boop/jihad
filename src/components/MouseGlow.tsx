"use client";

import React, { useState, useEffect } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export default function MouseGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth mouse movement using springs
  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Primary Glow */}
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          x: "-50%",
          y: "-50%",
        }}
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.25] dark:opacity-[0.4] bg-gradient-radial from-primary-400 via-primary-600/30 to-transparent blur-[100px]"
      />
      
      {/* Secondary Glow (Optional, for more color depth) */}
      <motion.div
        style={{
          left: smoothX,
          top: smoothY,
          x: "-50%",
          y: "-50%",
        }}
        transition={{ duration: 1 }}
        className="absolute w-[300px] h-[300px] rounded-full bg-gradient-radial from-blue-400/30 to-transparent blur-[40px] mix-blend-screen dark:mix-blend-overlay"
      />
    </div>
  );
}
