import { useEffect, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Spinner } from "@repo/ui/components/ui/spinner";
import ParticleField from "@repo/ui/components/atoms/particle-field";
import HolographicContainer from "@repo/ui/components/atoms/holographic-container";
import StatusIndicator from "@repo/ui/components/atoms/status-indicator";
import { Eyes, SystemInfo } from "@repo/ui/types/sensors";
import SystemInformationTemplate from "@repo/ui/components/templates/controls/system-information-template";
import HostConnectionControl from "@repo/ui/components/templates/controls/host-connection-control";
import ServerCamera from "@repo/ui/components/templates/controls/server-camera";
import AudioControl from "@repo/ui/components/templates/controls/audio-control";
import Breadcrumb from "@repo/ui/components/molecules/breadcrumb";
import Sidebar from "@repo/ui/components/molecules/sidebar";
import { HostConnection } from "@repo/ui/types/connections";

export default function HomePage() {
  const [appliedHostConnection, setAppliedHostConnection] = useState<HostConnection | null>(null);
  const [openEyes, setOpenEyes] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [selectedEyes, setSelectedEyes] = useState<Eyes | null>(null);
  const [eyesStatus, setEyesStatus] = useState<boolean>(false);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const [isMobile, setIsMobile] = useState(false);

  const auth = "Basic " + btoa("admin:password");

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch system info when connection changes
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        if (appliedHostConnection !== null) {
          const response = await axios.get(`http://${appliedHostConnection?.host}/system`, {
            headers: { Authorization: auth },
          });

          const systemInfo = await response.data;

          systemInfo.eyes.unshift({ index: -1, name: "Select eyes" });
          setSystemInfo(response.data);
        }
      } catch (error) {
        console.error("Error fetching system information:", error);
      }
    };

    setSystemInfo(null);
    fetchSystemInfo();
  }, [appliedHostConnection]);

  // Handle back to menu on mobile
  const handleBackToMenu = () => {
    setSidebarOpen(true);
  };

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

            <div className="flex items-center gap-2">
              <StatusIndicator online={appliedHostConnection !== null} />
              <span className="hidden md:block text-sm font-mono text-cyan-400/70">
                {appliedHostConnection ? "ONLINE" : "OFFLINE"}
              </span>
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
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-mono text-cyan-400 mb-4 uppercase tracking-wider">
                      System Dashboard
                    </h2>

                    {/* Connection Status */}
                    <HostConnectionControl
                      appliedHostConnection={appliedHostConnection}
                      setAppliedHostConnection={setAppliedHostConnection}
                    />

                    {/* System Controls */}
                    {appliedHostConnection && (
                      <HolographicContainer className="p-4 md:p-6">
                        {/* System Information */}
                        {systemInfo ? (
                          <>
                            <div className="space-y-4">
                              <SystemInformationTemplate
                                openEyes={openEyes}
                                selectedEyes={selectedEyes}
                                setEyesStatus={setEyesStatus}
                                setSelectedEyes={setSelectedEyes}
                                systemInfo={systemInfo}
                              />
                            </div>

                            <ServerCamera hostConnection={appliedHostConnection?.host} />

                            <AudioControl hostConnection={appliedHostConnection?.host} />
                          </>
                        ) : (
                          <div className="flex items-center gap-2 justify-center py-8">
                            <Spinner size="sm" variant="liquid" />
                            <span className="text-sm text-cyan-400/70 font-mono">Loading system information...</span>
                          </div>
                        )}
                      </HolographicContainer>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
