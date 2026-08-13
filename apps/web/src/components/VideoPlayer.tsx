import { useEffect, useRef } from "react";

// Minimal shape of the bits of the YouTube IFrame Player API this component uses.
interface YTPlayer {
  getCurrentTime: () => number;
  destroy: () => void;
}
interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}
interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: { start?: number };
      events: {
        onStateChange: (event: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const REPORT_INTERVAL_MS = 5_000;
const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

let apiLoadPromise: Promise<YTNamespace> | null = null;

function loadYouTubeIframeApi(): Promise<YTNamespace> {
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      document.head.appendChild(script);
    }
  });
  return apiLoadPromise;
}

export function VideoPlayer({
  videoId,
  startAtSeconds = 0,
  onProgress,
}: {
  videoId: string;
  startAtSeconds?: number;
  onProgress: (watchedSeconds: number, completed: boolean) => void;
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  // Captured once at mount — resuming is a one-time seek, not something that
  // should re-create the player if the underlying watch progress changes.
  const startAtRef = useRef(startAtSeconds);

  useEffect(() => {
    let player: YTPlayer | undefined;
    let reportInterval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    void loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      player = new YT.Player(containerRef.current, {
        videoId,
        playerVars: { start: Math.floor(startAtRef.current) },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              if (reportInterval) clearInterval(reportInterval);
              reportInterval = setInterval(() => {
                onProgressRef.current(Math.round(event.target.getCurrentTime()), false);
              }, REPORT_INTERVAL_MS);
            } else if (event.data === YT.PlayerState.ENDED) {
              onProgressRef.current(Math.round(event.target.getCurrentTime()), true);
            } else if (reportInterval) {
              clearInterval(reportInterval);
              reportInterval = undefined;
              onProgressRef.current(Math.round(event.target.getCurrentTime()), false);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (reportInterval) clearInterval(reportInterval);
      player?.destroy();
    };
  }, [videoId]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink/10">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
