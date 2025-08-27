import React from "react";
import { motion } from "framer-motion";

interface StatusIndicatorProps {
  online?: boolean;
  pulse?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ online = false, pulse = true }) => (
  <motion.div
    animate={
      pulse
        ? {
            opacity: [1, 0.7, 1],
            scale: [1, 1.2, 1],
          }
        : {}
    }
    aria-label={online ? "Online" : "Offline"}
    className={`w-3 h-3 rounded-full ${online ? "bg-green-400" : "bg-red-400"}`}
    role="status"
    style={{
      boxShadow: online ? "0 0 10px #4ade80" : "0 0 10px #f87171",
    }}
    title={online ? "Online" : "Offline"}
    transition={{ duration: 2, repeat: Infinity }}
  />
);

export default StatusIndicator;
