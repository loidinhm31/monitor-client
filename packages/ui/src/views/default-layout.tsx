import React, { useEffect, useState } from "react";
import ParticleField from "@repo/ui/components/atoms/particle-field";
import Sidebar from "@repo/ui/components/molecules/sidebar";
import { Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Breadcrumb from "@repo/ui/components/molecules/breadcrumb";

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);
  const handleBackToMenu = () => {
    setSidebarOpen(true);
  };

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-black text-cyan-400 relative overflow-hidden">
      {/* Animated background grid */}
      <div
        className="fixed inset-0 opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "gridMove 20s linear infinite",
        }}
      />

      {/* Holographic background effects */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 100, 0, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(0, 255, 136, 0.06) 0%, transparent 50%),
            linear-gradient(135deg, #000814 0%, #001d3d 50%, #000814 100%)
          `,
        }}
      />

      <ParticleField />

      {/* Main Layout */}
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <Sidebar
          activeItem={activeItem}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          setActiveItem={setActiveItem}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between p-4 lg:p-6 border-b border-cyan-400/20">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  className="text-cyan-400 hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}

              <motion.h1
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                className="text-xl md:text-2xl lg:text-3xl font-mono font-bold"
                style={{
                  background: "linear-gradient(45deg, #00d4ff, #00ff88, #ff6b35)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundSize: "200% 200%",
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                MONITOR CONTROL CENTER
              </motion.h1>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Mobile Breadcrumb */}
            {isMobile && <Breadcrumb activeItem={activeItem} onBack={handleBackToMenu} />}

            {/* Main Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};
