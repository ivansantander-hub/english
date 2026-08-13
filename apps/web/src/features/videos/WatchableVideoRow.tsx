import { useState } from "react";

import { VideoPlayer } from "../../components/VideoPlayer.js";
import { trpc } from "../../lib/trpc.js";

export function WatchableVideoRow({
  recommendedVideoId,
  videoId,
  title,
  channelName,
  thumbnailUrl,
  watchedSeconds,
  completed,
}: {
  recommendedVideoId: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  watchedSeconds: number;
  completed: boolean;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const recordWatch = trpc.videos.recordWatch.useMutation();

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 rounded-lg bg-surface p-2 text-left shadow-sm transition hover:-translate-y-0.5"
      >
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt="" className="h-12 w-20 flex-shrink-0 rounded-md object-cover" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{title}</span>
          <span className="block truncate text-xs text-ink/55">{channelName}</span>
        </span>
        {completed ? (
          <span className="flex-shrink-0 rounded-full bg-mint-tint px-2 py-0.5 text-xs font-bold text-mint">
            Completado
          </span>
        ) : watchedSeconds > 0 ? (
          <span className="flex-shrink-0 rounded-full bg-gold-tint px-2 py-0.5 text-xs font-bold text-ink/70">
            En progreso
          </span>
        ) : null}
      </button>
      {expanded && (
        <div className="mt-2">
          <VideoPlayer
            videoId={videoId}
            startAtSeconds={watchedSeconds}
            onProgress={(nextWatchedSeconds, nextCompleted) =>
              recordWatch.mutate({
                recommendedVideoId,
                watchedSeconds: nextWatchedSeconds,
                completed: nextCompleted,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
