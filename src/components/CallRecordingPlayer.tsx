import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Radio, Loader2, MicOff } from 'lucide-react';
import { fetchWithTenantAuth } from '../lib/auth';
import { openPhoneSetup } from '../lib/calling';
import { apiUrl, isNative } from '../lib/platform';

interface CallRecordingPlayerProps {
  recordingUrl?: string;
  recordingStatus?: string;
  durationSeconds: number;
  callId: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Recording is uploading from the agent\'s phone...',
  not_found: 'No recording found on the agent\'s phone for this call.',
  failed: 'Recording upload failed. Reopen the app with a network connection to retry.',
  disabled: 'Call recording is turned off for this workspace.',
};

/** Server recordings are served through `/api/calls/:id/recording`, which returns a short-lived URL. */
async function resolvePlayableUrl(recordingUrl: string): Promise<string> {
  if (!recordingUrl.startsWith('/api/')) return recordingUrl;
  const res = await fetchWithTenantAuth(recordingUrl);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.error || 'Recording unavailable');
  return apiUrl(String(data.url));
}

export const CallRecordingPlayer: React.FC<CallRecordingPlayerProps> = ({
  recordingUrl,
  recordingStatus,
  durationSeconds,
  callId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setResolvedUrl('');
    setError('');
    setIsPlaying(false);
    setCurrentTime(0);
  }, [recordingUrl]);

  const ensureUrl = async (): Promise<string> => {
    if (resolvedUrl) return resolvedUrl;
    setLoading(true);
    try {
      const url = await resolvePlayableUrl(recordingUrl || '');
      setResolvedUrl(url);
      return url;
    } finally {
      setLoading(false);
    }
  };

  if (!recordingUrl) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 flex items-center space-x-2 text-[11px] text-slate-500 font-noto">
        <MicOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="min-w-0 flex-1">
          {STATUS_LABEL[recordingStatus || ''] || 'No recording for this call. Turn on automatic call recording in the Phone app, then place the call from the CRM.'}
          {isNative && (
            <button type="button" onClick={openPhoneSetup} className="ml-1 font-semibold text-slate-700 underline">
              Set up recordings
            </button>
          )}
        </span>
      </div>
    );
  }

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      setError('');
      const url = await ensureUrl();
      if (audio.src !== url) audio.src = url;
      await audio.play();
      setIsPlaying(true);
    } catch (e: any) {
      setError(e?.message || 'Could not play recording');
      setIsPlaying(false);
    }
  };

  const handleDownload = async () => {
    try {
      const url = await ensureUrl();
      window.open(url, '_blank', 'noopener');
    } catch (e: any) {
      setError(e?.message || 'Could not download recording');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !isMuted;
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
        onTimeUpdate={() => audioRef.current && setCurrentTime(Math.floor(audioRef.current.currentTime))}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsPlaying(false);
          if (resolvedUrl) setError('Recording link expired, press play to retry');
          setResolvedUrl('');
        }}
        preload="none"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={togglePlay}
            disabled={loading}
            title={isPlaying ? 'Pause Recording' : 'Play Recording'}
            className={`touch-target pressable w-12 h-12 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-slate-700" />
            )}
          </button>

          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-sans font-medium text-slate-900">
              <Radio className={`w-3.5 h-3.5 ${isPlaying ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
              <span className="font-bold">Call Recording</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              {formatSecs(currentTime)} / {formatSecs(effectiveDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="touch-target pressable w-12 h-12 md:w-8 md:h-8 rounded-lg active:bg-slate-200 md:hover:bg-slate-200/80 text-slate-500 transition-all cursor-pointer flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Download Audio File"
            aria-label={`Download recording for call ${callId}`}
            className="touch-target pressable w-12 h-12 md:w-8 md:h-8 rounded-lg active:bg-slate-200 md:hover:bg-slate-200/80 text-slate-500 transition-all cursor-pointer flex items-center justify-center"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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

      {error && <p className="text-[10px] text-rose-600">{error}</p>}
    </div>
  );
};
