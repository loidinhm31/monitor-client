import React from "react";
import { motion } from "framer-motion";

interface HolographicContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "default" | "dark";
}

const HolographicContainer: React.FC<HolographicContainerProps> = ({
  children,
  className = "",
  delay = 0,
  variant = "default",
}) => (
  <motion.div
    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
    className={`relative overflow-hidden ${className}`}
    initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
    style={{
      background: variant === "dark" ? "rgba(0, 10, 20, 0.3)" : "rgba(0, 20, 40, 0.2)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(0, 212, 255, 0.3)",
      borderRadius: "20px",
      boxShadow: "0 0 40px rgba(0, 212, 255, 0.2), inset 0 0 40px rgba(0, 212, 255, 0.05)",
    }}
    transition={{ duration: 0.6, delay }}
  >
    <motion.div
      animate={{ x: "100%" }}
      className="absolute inset-0"
      initial={{ x: "-100%" }}
      style={{
        background: "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.1), transparent)",
        pointerEvents: "none",
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

export default HolographicContainer;
