import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
}

const ParticleField: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev.slice(-10), // Keep only last 10 particles for performance
        {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: window.innerHeight,
        },
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleAnimationComplete = (particleId: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== particleId));
  };

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          animate={{
            y: -100,
            opacity: [0, 1, 1, 0],
          }}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full"
          style={{ left: particle.x, top: particle.y }}
          transition={{
            duration: 6,
            ease: "easeOut",
          }}
          onAnimationComplete={() => handleAnimationComplete(particle.id)}
        />
      ))}
    </div>
  );
};

export default ParticleField;
