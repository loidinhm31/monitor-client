import React, { useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface HudCircleProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const HudCircle: React.FC<HudCircleProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  className = "",
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  const handleHoverStart = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };

  const handleHoverEnd = () => {
    if (!disabled) {
      setIsHovered(false);
    }
  };

  return (
    <motion.div
      aria-disabled={disabled}
      aria-label={`${label} button`}
      aria-pressed={active}
      className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 cursor-pointer flex flex-col items-center justify-center transition-all duration-300 ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      role="button"
      style={{
        borderColor: active ? "#00d4ff" : "rgba(0, 212, 255, 0.6)",
        background: active
          ? "radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)"
          : "radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)",
      }}
      tabIndex={disabled ? -1 : 0}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={handleClick}
      onHoverEnd={handleHoverEnd}
      onHoverStart={handleHoverStart}
      onKeyDown={handleKeyDown}
    >
      {/* Rotating border effect */}
      <motion.div
        animate={{ rotate: 360 }}
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400"
        style={{ opacity: isHovered ? 1 : 0.3 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />

      <Icon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 mb-1" />
      <span className="text-xs text-cyan-400 font-mono uppercase tracking-wider">{label}</span>

      {active && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 30px rgba(0, 212, 255, 0.5)",
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default HudCircle;
