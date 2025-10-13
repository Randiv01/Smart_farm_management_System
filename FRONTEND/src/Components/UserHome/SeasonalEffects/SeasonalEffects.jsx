// src/Components/UserHome/SeasonalEffects/SeasonalEffects.jsx
import React, { useState, useEffect } from 'react';

const SeasonalEffects = () => {
  const [season, setSeason] = useState(null);
  const [particles, setParticles] = useState([]);

  // Determine current season based on date
  useEffect(() => {
    const getCurrentSeason = () => {
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const day = now.getDate();

      // Halloween: October 15 - November 1
      if ((month === 10 && day >= 15) || (month === 11 && day === 1)) {
        return 'halloween';
      }
      
      // Black Friday: Last Friday of November (around Nov 24-30)
      if (month === 11 && day >= 24 && day <= 30) {
        return 'blackfriday';
      }
      
      // Christmas: December 1 - December 26
      if ((month === 12 && day >= 1 && day <= 26)) {
        return 'christmas';
      }
      
      // New Year: December 27 - January 5
      if ((month === 12 && day >= 27) || (month === 1 && day <= 5)) {
        return 'newyear';
      }
      
      return null;
    };

    setSeason(getCurrentSeason());
  }, []);

  // Generate particles based on season
  useEffect(() => {
    if (!season) return;

    const particleCount = season === 'christmas' ? 50 : 
                         season === 'halloween' ? 30 : 30;

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 3 + 2,
      animationDelay: Math.random() * 5,
      size: Math.random() * 10 + 5,
      opacity: Math.random() * 0.5 + 0.3,
    }));

    setParticles(newParticles);
  }, [season]);

  if (!season) return null;

  // Season-specific configurations
  const seasonConfig = {
    christmas: {
      particles: ['❄️', '⛄', '🎄', '🎅', '⭐', '🔔'],
      gradient: 'from-blue-900/20 via-blue-800/10 to-transparent',
      glow: 'shadow-blue-500/50',
    },
    halloween: {
      particles: ['🎃', '👻', '🦇', '🕷️', '🕸️', '💀'],
      gradient: 'from-orange-900/20 via-purple-900/10 to-transparent',
      glow: 'shadow-orange-500/50',
    },
    blackfriday: {
      particles: ['💰', '🛍️', '💳', '🏷️', '💵', '🎁'],
      gradient: 'from-gray-900/30 via-yellow-900/10 to-transparent',
      glow: 'shadow-yellow-500/50',
    },
    newyear: {
      particles: ['🎆', '🎇', '✨', '🎉', '🎊', '🥂'],
      gradient: 'from-purple-900/20 via-pink-900/10 to-transparent',
      glow: 'shadow-purple-500/50',
    },
  };

  const config = seasonConfig[season];

  return (
    <>
      {/* Seasonal Overlay Gradient */}
      <div className={`fixed inset-0 pointer-events-none z-40 bg-gradient-to-b ${config.gradient}`} />

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((particle) => {
          const emoji = config.particles[particle.id % config.particles.length];
          
          return (
            <div
              key={particle.id}
              className="absolute animate-fall"
              style={{
                left: `${particle.left}%`,
                fontSize: `${particle.size}px`,
                opacity: particle.opacity,
                animationDuration: `${particle.animationDuration}s`,
                animationDelay: `${particle.animationDelay}s`,
                filter: season === 'christmas' ? 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' : 
                       season === 'halloween' ? 'drop-shadow(0 0 5px rgba(255,165,0,0.6))' :
                       season === 'blackfriday' ? 'drop-shadow(0 0 3px rgba(255,215,0,0.8))' :
                       season === 'newyear' ? 'drop-shadow(0 0 5px rgba(147,51,234,0.8))' : 'none',
              }}
            >
              {emoji}
            </div>
          );
        })}
      </div>

      {/* Seasonal Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }

        @keyframes slide-in-right {
          0% {
            transform: translateX(400px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fall {
          animation: fall linear infinite;
        }

        .animate-slide-in-right {
          animation: slide-in-right 1s ease-out forwards;
        }

        ${season === 'christmas' ? `
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        ` : ''}

        ${season === 'halloween' ? `
          @keyframes spooky-glow {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(255,165,0,0.6)); }
            50% { filter: drop-shadow(0 0 15px rgba(138,43,226,0.8)); }
          }
        ` : ''}

        ${season === 'blackfriday' ? `
          @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        ` : ''}

        ${season === 'newyear' ? `
          @keyframes sparkle {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.2) rotate(180deg); }
          }
        ` : ''}
      `}} />
    </>
  );
};

export default SeasonalEffects;
