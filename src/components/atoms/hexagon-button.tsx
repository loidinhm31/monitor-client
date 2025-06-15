import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface HexagonButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const HexagonButton: React.FC<HexagonButtonProps> = ({ icon: Icon, label, active = false, onClick }) => (
  <motion.div
    aria-label={`${label} button`}
    aria-pressed={active}
    className="relative w-20 h-20 cursor-pointer flex items-center justify-center"
    role="button"
    style={{
      clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
      background: active ? "rgba(0, 212, 255, 0.2)" : "rgba(0, 212, 255, 0.1)",
      border: "2px solid rgba(0, 212, 255, 0.6)",
    }}
    tabIndex={0}
    whileHover={{
      scale: 1.1,
      boxShadow: "0 0 20px rgba(0, 212, 255, 0.4)",
    }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    onKeyDown={(e) => {
      if ((e.key === "Enter" || e.key === " ") && onClick) {
        e.preventDefault();
        onClick();
      }
    }}
  >
    <div className="text-center">
      <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
      <span className="text-xs text-cyan-400 font-mono">{label}</span>
    </div>
  </motion.div>
);

export default HexagonButton;
