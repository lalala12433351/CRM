import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Music, Radio } from 'lucide-react';

interface CallRecordingPlayerProps {
  recordingUrl?: string;
  durationSeconds: number;
  callId: string;
}

export const CallRecordingPlayer: React.FC<CallRecordingPlayerProps> = ({
  recordingUrl,
  durationSeconds,
  callId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<any>(null);

  // Default audio fallback URL (standard royalty free ambient/tone audio)
  const audioSource = recordingUrl || 'https://actions.google.com/sounds/v1/ambiences/office_voices.ogg';

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          intervalRef.current = setInterval(() => {
            if (audioRef.current) {
              setCurrentTime(Math.floor(audioRef.current.currentTime));
            }
          }, 250);
        })
        .catch((e) => {
          console.warn("Audio play blocked or unavailable, using timer simulation:", e);
          // Fallback simulation timer if audio element fails to load remote url
          setIsPlaying(true);
          intervalRef.current = setInterval(() => {
            setCurrentTime((prev) => {
              if (prev >= durationSeconds) {
                setIsPlaying(false);
                clearInterval(intervalRef.current);
                return 0;
              }
              return prev + 1;
            });
          }, 1000);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const effectiveDuration = durationSeconds > 0 ? durationSeconds : 60;
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 space-y-2 font-noto shadow-2xs">
      <audio
        ref={audioRef}
        src={audioSource}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }}
        preload="none"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            title={isPlaying ? "Pause Recording" : "Play Recording"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-slate-700" />}
          </button>

          {/* Label & Status */}
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-sans font-medium text-slate-900">
              <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              <span className="font-bold">Call Recording HQ</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              {formatSecs(currentTime)} / {formatSecs(effectiveDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute Audio" : "Mute Audio"}
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Download Audio Button */}
          <a
            href={audioSource}
            download={`call_recording_${callId}.ogg`}
            target="_blank"
            rel="noopener noreferrer"
            title="Download Audio File"
            className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Progress Bar & Waveform Simulation */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Animated Waveform Visualization */}
        <div className="flex items-center justify-between h-3 space-x-0.5 px-0.5">
          {[20, 45, 75, 30, 90, 60, 40, 85, 30, 70, 95, 50, 30, 80, 60, 40, 90, 35, 65, 80, 45, 90, 30, 60, 40].map((height, i) => {
            const isPassed = (i / 25) * 100 <= progressPercent;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-all ${
                  isPassed ? 'bg-emerald-600' : 'bg-slate-200'
                } ${isPlaying && isPassed ? 'animate-pulse' : ''}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
