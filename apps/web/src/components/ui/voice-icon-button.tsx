import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, LoaderCircle } from 'lucide-react';
import { TooltipIconButton } from './tooltip-icon-button';

interface VoiceIconProps {
  audioSrc: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: (status: Status) => void;
}

type Status = "init" | "loading" | "playing" | "paused" | "ended";

export const VoiceIconButton: React.FC<VoiceIconProps> = ({ 
  audioSrc,  
  className = '',
  disabled = false,
  onClick,
}) => {
  const [status, setStatus] = useState<Status>("init");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioSrc || !audioRef.current) return;
    console.log("audioSrc", audioSrc);
    const audio = audioRef.current;
    audioRef.current.src = audioSrc;
  
    const handleEnded = () => {
      setStatus("ended");
    };


    const handleCanPlayThrough = () => {
      console.log(111)
      audio.play();
      setStatus("playing");
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [audioSrc]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      console.log("togglePlay", status);
      onClick?.(status);
      switch (status) {
        case "init":
          setStatus("loading");
          break;
        case "playing":
          audioRef.current?.pause();
          setStatus("paused");
          break;
        case "paused":
          await audioRef.current?.play();
          setStatus("playing");
          break;
        case "ended":
          await audioRef.current?.play();
          setStatus("playing");
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setStatus("ended");
    }
  };

  const getIcon = () => {
    if (disabled) {
      return <Volume2 className="animate-pulse" />;
    }
    if (status === "loading" && !audioSrc) {
      return <LoaderCircle className="animate-spin" />;
    }
    return status === "playing" ? 
      <Pause /> : 
      <Volume2 className="ml-0.5" />;
  };

  return (
    <div className={`relative ${className}`}>
      <TooltipIconButton
        tooltip={status === "playing" ? "Pause" : "Play"}
        variant="ghost"
        onClick={togglePlay}
        disabled={disabled}
      >
        {getIcon()}
        
        {/* Ripple effect */}
        {status === "playing" && (
          <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20" />
        )}
      </TooltipIconButton>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        preload="none"
        className="hidden"
      />
    </div>
  );
};
