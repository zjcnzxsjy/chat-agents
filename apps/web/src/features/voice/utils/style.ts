export const getOrbStyles = (audioLevel: number, state: string) => {
  const baseIntensity = audioLevel * 0.6 + 0.4; // 0.4 to 1.0 range
  
  switch (state) {
    case 'recording':
      if (audioLevel > 0) {
        // Dynamic emerald glow based on audio level
        return {
          background: `radial-gradient(circle, 
            rgba(16, 185, 129, ${0.9 + audioLevel * 0.1}) 0%, 
            rgba(16, 185, 129, ${0.7 + audioLevel * 0.2}) 30%, 
            rgba(16, 185, 129, ${0.4 + audioLevel * 0.3}) 60%, 
            rgba(16, 185, 129, 0.1) 100%)`,
          boxShadow: `
            0 0 ${20 + audioLevel * 40}px rgba(16, 185, 129, ${0.4 + audioLevel * 0.4}),
            0 0 ${40 + audioLevel * 60}px rgba(16, 185, 129, ${0.2 + audioLevel * 0.3}),
            inset 0 0 ${10 + audioLevel * 20}px rgba(16, 185, 129, 0.1)
          `,
          borderColor: `rgba(16, 185, 129, ${0.6 + audioLevel * 0.4})`,
          scale: 1 + audioLevel * 0.05,
        };
      } else {
        // Gentle amber when no audio detected
        return {
          background: `radial-gradient(circle, 
            rgba(245, 158, 11, 0.8) 0%, 
            rgba(245, 158, 11, 0.6) 30%, 
            rgba(245, 158, 11, 0.3) 60%, 
            rgba(245, 158, 11, 0.1) 100%)`,
          boxShadow: `
            0 0 30px rgba(245, 158, 11, 0.3),
            0 0 60px rgba(245, 158, 11, 0.2),
            inset 0 0 15px rgba(245, 158, 11, 0.1)
          `,
          borderColor: 'rgba(245, 158, 11, 0.5)',
          scale: 1,
        };
      }
    case 'playing':
      // Dynamic violet glow based on audio level
      return {
        background: `radial-gradient(circle, 
          rgba(139, 92, 246, ${0.8 + audioLevel * 0.2}) 0%, 
          rgba(139, 92, 246, ${0.6 + audioLevel * 0.2}) 30%, 
          rgba(139, 92, 246, ${0.3 + audioLevel * 0.3}) 60%, 
          rgba(139, 92, 246, 0.1) 100%)`,
        boxShadow: `
          0 0 ${25 + audioLevel * 35}px rgba(139, 92, 246, ${0.4 + audioLevel * 0.3}),
          0 0 ${50 + audioLevel * 50}px rgba(139, 92, 246, ${0.2 + audioLevel * 0.2}),
          inset 0 0 ${10 + audioLevel * 15}px rgba(139, 92, 246, 0.1)
        `,
        borderColor: `rgba(139, 92, 246, ${0.6 + audioLevel * 0.3})`,
        scale: 1 + audioLevel * 0.03,
      };
    case 'processing':
      return {
        background: `radial-gradient(circle, 
          rgba(59, 130, 246, 0.8) 0%, 
          rgba(59, 130, 246, 0.6) 30%, 
          rgba(59, 130, 246, 0.3) 60%, 
          rgba(59, 130, 246, 0.1) 100%)`,
        boxShadow: `
          0 0 35px rgba(59, 130, 246, 0.4),
          0 0 70px rgba(59, 130, 246, 0.2),
          inset 0 0 20px rgba(59, 130, 246, 0.1)
        `,
        borderColor: 'rgba(59, 130, 246, 0.6)',
        scale: 1,
      };
    case 'requesting':
      return {
        background: `radial-gradient(circle, 
          rgba(14, 165, 233, 0.7) 0%, 
          rgba(14, 165, 233, 0.5) 30%, 
          rgba(14, 165, 233, 0.3) 60%, 
          rgba(14, 165, 233, 0.1) 100%)`,
        boxShadow: `
          0 0 30px rgba(14, 165, 233, 0.3),
          0 0 60px rgba(14, 165, 233, 0.2),
          inset 0 0 15px rgba(14, 165, 233, 0.1)
        `,
        borderColor: 'rgba(14, 165, 233, 0.5)',
        scale: 1,
      };
    case 'error':
      return {
        background: `radial-gradient(circle, 
          rgba(239, 68, 68, 0.8) 0%, 
          rgba(239, 68, 68, 0.6) 30%, 
          rgba(239, 68, 68, 0.3) 60%, 
          rgba(239, 68, 68, 0.1) 100%)`,
        boxShadow: `
          0 0 30px rgba(239, 68, 68, 0.4),
          0 0 60px rgba(239, 68, 68, 0.2),
          inset 0 0 15px rgba(239, 68, 68, 0.1)
        `,
        borderColor: 'rgba(239, 68, 68, 0.6)',
        scale: 1,
      };
    default:
      return {
        background: `radial-gradient(circle, 
          rgba(148, 163, 184, 0.3) 0%, 
          rgba(148, 163, 184, 0.2) 30%, 
          rgba(148, 163, 184, 0.1) 60%, 
          rgba(148, 163, 184, 0.05) 100%)`,
        boxShadow: `
          0 0 20px rgba(148, 163, 184, 0.2),
          0 0 40px rgba(148, 163, 184, 0.1),
          inset 0 0 10px rgba(148, 163, 184, 0.05)
        `,
        borderColor: 'rgba(148, 163, 184, 0.3)',
        scale: 1,
      };
  }
};
