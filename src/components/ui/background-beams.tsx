"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 w-full h-full z-0 overflow-hidden",
        className
      )}
    >
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: [0, 1, 0.5, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-sky-400/10 to-primary/10"
      />
    </div>
  );
};