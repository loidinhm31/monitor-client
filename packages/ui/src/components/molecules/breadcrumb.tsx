import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteConfig } from "@repo/ui/config/site";

interface BreadcrumbProps {
  activeItem: string;
  onBack: () => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ activeItem, onBack }) => {
  const currentItem = siteConfig.navMenuItems.find((item) => item.id === activeItem);

  return (
    <div className="flex items-center gap-2 mb-4 lg:hidden">
      <motion.button
        className="flex items-center gap-2 text-cyan-400/70 hover:text-cyan-400 transition-colors"
        type="button"
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="font-mono text-sm uppercase tracking-wide">Menu</span>
      </motion.button>
      <ChevronRight className="w-4 h-4 text-cyan-400/50" />
      <span className="font-mono text-sm uppercase tracking-wide text-cyan-400">{currentItem?.label}</span>
    </div>
  );
};

export default Breadcrumb;
