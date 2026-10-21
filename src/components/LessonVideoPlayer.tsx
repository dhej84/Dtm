import React, { useState, useRef, useEffect, useCallback } from 'react';

interface LessonVideoPlayerProps {
  videoUrl?: string;
  lessonTitle: string;
  moduleTitle?: string;
  lessonId: string;
  moduleId?: string;
  onVideoProgress?: (progress: {
    currentTime: number;
    duration: number;
    watchedPercent: number;
    isCompleted: boolean;
  }) => void;
  onVideoEnded?: () => void;
  onCompleteTopic?: () => void;
  isTopicCompleted?: boolean;
}

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({
  videoUrl,
  lessonTitle,
  moduleTitle,
  lessonId,
  moduleId,
  onVideoProgress,
  onVideoEnded,
  onCompleteTopic,
  isTopicCompleted = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Playable video source: accepts http(s), blob, or relative /api/v1/videos URL
  const resolvedVideoUrl =
    videoUrl &&
    (videoUrl.startsWith('http://') ||
      videoUrl.startsWith('https://') ||
      videoUrl.startsWith('blob:') ||
      videoUrl.startsWith('/'))
      ? videoUrl
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  // Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [playFeedback, setPlayFeedback] = useState<'play' | 'pause' | null>(null);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<any>(null);

  // Storage key for saving resume position
  const progressStorageKey = `skillswap_video_pos_${lessonId}_${moduleId || 'default'}`;

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // 1. Initial Load & Saved Progress Restoration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasRestoredPosition(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setIsLoading(true);

    const savedPos = localStorage.getItem(progressStorageKey);
    if (savedPos) {
      const parsed = parseFloat(savedPos);
      if (!isNaN(parsed) && parsed > 2) {
        video.currentTime = parsed;
        setCurrentTime(parsed);
        setResumeNotice(`Resumed at ${formatTime(parsed)}`);
        setTimeout(() => setResumeNotice(null), 3500);
      }
    }
    setHasRestoredPosition(true);
  }, [lessonId, moduleId, resolvedVideoUrl, progressStorageKey]);

  // 2. Periodic and State Progress Persistence
  const saveCurrentProgress = useCallback(
    (timeToSave: number, dur: number) => {
      if (!dur || dur <= 0) return;
      try {
        localStorage.setItem(progressStorageKey, timeToSave.toString());
        const watchedPercent = Math.min(100, Math.round((timeToSave / dur) * 100));
        const isCompleted = watchedPercent >= 90;

        if (onVideoProgress) {
          onVideoProgress({
            currentTime: timeToSave,
            duration: dur,
            watchedPercent,
            isCompleted,
          });
        }
      } catch (err) {
        console.warn('Error saving video progress:', err);
      }
    },
    [progressStorageKey, onVideoProgress]
  );

  // Save on unmount / window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoRef.current) {
        saveCurrentProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (videoRef.current) {
        saveCurrentProgress(videoRef.current.currentTime, videoRef.current.duration);
      }
    };
  }, [saveCurrentProgress]);

  // 3. Auto-hide controls during active playback
  const triggerControlsVisibility = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      triggerControlsVisibility();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  // 4. Play / Pause Action
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true);
        setPlayFeedback('play');
        setTimeout(() => setPlayFeedback(null), 500);
      }).catch((err) => {
        console.warn('Video play prevented:', err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      saveCurrentProgress(video.currentTime, video.duration);
      setPlayFeedback('pause');
      setTimeout(() => setPlayFeedback(null), 500);
    }
    triggerControlsVisibility();
  };

  // 5. Volume & Mute Handling
  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clamped = Math.max(0, Math.min(1, newVolume));
    video.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        video.volume = 0.5;
        setVolume(0.5);
      }
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  // 6. Playback Speed
  const handleSpeedSelect = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    triggerControlsVisibility();
  };

  // 7. Fullscreen Toggle
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 8. Progress Seeking via mouse click / drag
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
    saveCurrentProgress(newTime, duration);
  };

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(percentage * duration);
    setHoverPosition(hoverX);
  };

  // 9. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        setCurrentTime(video.currentTime);
        triggerControlsVisibility();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        setCurrentTime(video.currentTime);
        triggerControlsVisibility();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
        triggerControlsVisibility();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
        triggerControlsVisibility();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted, duration]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // Update buffer progress
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      if (video.duration > 0) {
        setBufferedPercent((bufferedEnd / video.duration) * 100);
      }
    }

    // Periodically sync progress (every ~3 seconds)
    if (Math.floor(video.currentTime) % 3 === 0) {
      saveCurrentProgress(video.currentTime, video.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      saveCurrentProgress(videoRef.current.duration, videoRef.current.duration);
    }
    if (onVideoEnded) {
      onVideoEnded();
    }
    // Auto complete topic if available
    if (onCompleteTopic && !isTopicCompleted) {
      onCompleteTopic();
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerControlsVisibility}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      }}
      className={`relative w-full bg-[#0d1117] rounded-3xl overflow-hidden shadow-2xl border border-[#283044] select-none group flex flex-col justify-between ${
        isFullscreen ? 'h-screen rounded-none' : 'aspect-video'
      }`}
    >
      {/* Real HTML5 Video Element */}
      <video
        ref={videoRef}
        src={resolvedVideoUrl}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onCanPlay={() => setIsLoading(false)}
        onEnded={handleEnded}
        className="w-full h-full object-contain cursor-pointer bg-black"
      />

      {/* Top Overlay Header: Title, Live indicator, Topic name */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 z-20 flex items-center justify-between ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate max-w-[70%]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#82f5c1] animate-pulse shrink-0"></span>
          <div className="truncate">
            <h2 className="text-white text-xs sm:text-sm font-bold truncate">
              {moduleTitle || lessonTitle}
            </h2>
            <span className="text-[10px] text-white/70 tracking-wider uppercase font-mono">
              SkillSwap Video Classroom • {lessonTitle}
            </span>
          </div>
        </div>

        {/* Resume toast notice */}
        {resumeNotice && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#82f5c1] text-[#00714e] text-xs font-bold shadow-md animate-fadeIn">
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>{resumeNotice}</span>
          </div>
        )}
      </div>

      {/* Center Buffering Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-3 border-white/20 border-t-[#82f5c1] animate-spin"></div>
            <span className="text-white/80 text-xs font-medium tracking-wide">Buffering Video...</span>
          </div>
        </div>
      )}

      {/* Big Center Play / Replay Overlay Button (when paused or ended) */}
      {!isPlaying && !isLoading && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/25 cursor-pointer z-10 transition-all hover:bg-black/35"
        >
          <button
            type="button"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#3525cd]/90 hover:bg-[#3525cd] text-white flex items-center justify-center shadow-xl transform hover:scale-105 transition-all ring-4 ring-white/20"
            aria-label="Play video"
          >
            <span className="material-symbols-outlined text-[36px] sm:text-[44px] ml-1">
              {currentTime >= duration && duration > 0 ? 'replay' : 'play_arrow'}
            </span>
          </button>
        </div>
      )}

      {/* Quick Play / Pause Ripple Feedback */}
      {playFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-ping duration-300">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[48px]">
              {playFeedback === 'play' ? 'play_arrow' : 'pause'}
            </span>
          </div>
        </div>
      )}

      {/* Modern YouTube-Like Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-5 transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seekable Progress Bar */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          onMouseMove={handleProgressBarHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-2 hover:h-3 bg-white/25 rounded-full cursor-pointer transition-all mb-3.5 group/bar flex items-center"
        >
          {/* Buffered stream track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full pointer-events-none transition-all duration-200"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Played track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#3525cd] via-[#4f46e5] to-[#82f5c1] rounded-full pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber thumb */}
          <div
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-x-1/2 pointer-events-none transform scale-0 group-hover/bar:scale-100 transition-transform"
            style={{ left: `${progressPercent}%` }}
          />

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-white text-[11px] font-mono pointer-events-none shadow"
              style={{ left: `${hoverPosition}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Bottom Controls Row: Play, Vol, Time, Speed, Fullscreen, Topic Button */}
        <div className="flex items-center justify-between text-white text-xs gap-3">
          {/* Left Actions: Play/Pause, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Play / Pause Toggle */}
            <button
              onClick={togglePlay}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-white"
              title={isPlaying ? 'Pause (k / Space)' : 'Play (k / Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="material-symbols-outlined text-[24px] sm:text-[28px]">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Volume Control & Slider */}
            <div className="flex items-center gap-1.5 group/vol relative">
              <button
                onClick={toggleMute}
                className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
                  {isMuted || volume === 0
                    ? 'volume_off'
                    : volume < 0.5
                    ? 'volume_down'
                    : 'volume_up'}
                </span>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-20 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#82f5c1] hidden sm:block"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>

            {/* Time Stamp (Current / Total) */}
            <div className="text-white/80 font-mono text-[11px] sm:text-xs">
              <span>{formatTime(currentTime)}</span>
              <span className="text-white/40 mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Actions: Complete Module, Speed, Fullscreen */}
          <div className="flex items-center gap-2 relative">
            {/* Quick Topic Complete Toggle */}
            {onCompleteTopic && (
              <button
                onClick={onCompleteTopic}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-xs ${
                  isTopicCompleted
                    ? 'bg-[#006c4a] text-white'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={isTopicCompleted ? 'Topic completed' : 'Mark topic completed'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isTopicCompleted ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span>{isTopicCompleted ? 'Topic Watched ✓' : 'Mark Complete'}</span>
              </button>
            )}

            {/* Playback Speed Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-colors"
                title="Playback speed"
              >
                {playbackSpeed}x
              </button>

              {/* Speed Popover */}
              {showSpeedMenu && (
                <div className="absolute bottom-10 right-0 bg-[#131b2e] border border-[#283044] rounded-2xl p-1.5 shadow-2xl z-30 min-w-28 flex flex-col gap-1 animate-fadeIn">
                  <span className="text-[10px] uppercase font-bold text-white/50 px-2 py-1">
                    Playback Speed
                  </span>
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedSelect(spd)}
                      className={`px-3 py-1.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-[#3525cd] text-white font-bold'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>{spd === 1 ? '1x (Normal)' : `${spd}x`}</span>
                      {playbackSpeed === spd && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 transition-colors text-white"
              title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen (f)'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
