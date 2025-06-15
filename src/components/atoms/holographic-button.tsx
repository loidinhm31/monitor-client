import React from "react";
import { motion } from "framer-motion";

interface HolographicButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const HolographicButton: React.FC<HolographicButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className = "",
  size = "default",
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      aria-disabled={disabled}
      className={`relative overflow-hidden rounded-lg font-mono uppercase tracking-wider transition-all duration-300 ${sizeClasses[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      disabled={disabled}
      style={{
        background:
          variant === "danger"
            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(185, 28, 28, 0.1) 100%)"
            : "linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 100, 150, 0.1) 100%)",
        border: `1px solid ${variant === "danger" ? "rgba(239, 68, 68, 0.5)" : "rgba(0, 212, 255, 0.5)"}`,
        color: variant === "danger" ? "#ef4444" : "#00d4ff",
      }}
      type="button"
      whileHover={
        !disabled
          ? {
              scale: 1.02,
              boxShadow: variant === "danger" ? "0 0 20px rgba(239, 68, 68, 0.4)" : "0 0 20px rgba(0, 212, 255, 0.4)",
            }
          : {}
      }
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ x: "-100%" }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
        }}
        transition={{ duration: 0.5 }}
        whileHover={{ x: "100%" }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default HolographicButton;
