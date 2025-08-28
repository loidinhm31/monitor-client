import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import HolographicContainer from "@repo/ui/components/atoms/holographic-container";
import { getRoutes, RouteConfig } from "@repo/ui/lib/menu-site";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: string;
  setActiveItem: (item: string) => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeItem, setActiveItem, isMobile }) => {
  const navigate = useNavigate();
  const handleItemClick = (item: RouteConfig): void => {
    setActiveItem(item.id);
    if (isMobile) onClose();
    navigate(item.path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={isMobile ? { x: isOpen ? 0 : -256 } : { x: 0 }}
        className={`fixed top-0 left-0 h-full w-64 z-50 lg:relative lg:translate-x-0 ${
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
        } transition-transform duration-300 lg:transition-none`}
        initial={isMobile ? { x: -256 } : { x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <HolographicContainer className="h-full" variant="dark">
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-mono text-cyan-400 uppercase tracking-wider">Control</h2>
              {isMobile && (
                <button className="text-cyan-400 hover:text-white transition-colors" type="button" onClick={onClose}>
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Menu Items */}
            <nav className="flex-1 space-y-2">
              {getRoutes().map((item) => (
                <motion.button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeItem === item.id
                      ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/30"
                      : "text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-400/10"
                  }`}
                  type="button"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                >
                  {/*<item.icon className="w-5 h-5" />*/}
                  <span className="font-mono text-sm uppercase tracking-wide">{item.title}</span>
                  {activeItem === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </motion.button>
              ))}
            </nav>
          </div>
        </HolographicContainer>
      </motion.aside>
    </>
  );
};

export default Sidebar;
