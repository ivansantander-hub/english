import { useState } from "react";

import { VideoPlayer } from "../../components/VideoPlayer.js";
import { trpc } from "../../lib/trpc.js";

export function RecommendedVideoCard({
  topicType,
  topicKey,
  label,
}: {
  topicType: "concept" | "error_type";
  topicKey: string;
  label?: string;
}): React.JSX.Element | null {
  const videosQuery = trpc.videos.getRecommendations.useQuery({ topicType, topicKey });
  const recordWatch = trpc.videos.recordWatch.useMutation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const videos = videosQuery.data ?? [];
  if (videos.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl bg-sky-tint p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-sky">
        {label ?? "Watch and practice"}
      </p>
      <ul className="space-y-2">
        {videos.map((video) => (
          <li key={video.id}>
            <button
              type="button"
              onClick={() => setExpandedId(expandedId === video.id ? null : video.id)}
              className="flex w-full items-center gap-3 rounded-lg bg-surface p-2 text-left shadow-sm transition hover:-translate-y-0.5"
            >
              {video.thumbnailUrl && (
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="h-12 w-20 flex-shrink-0 rounded-md object-cover"
                />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{video.title}</span>
                <span className="block truncate text-xs text-ink/55">{video.channelName}</span>
              </span>
            </button>
            {expandedId === video.id && (
              <div className="mt-2">
                <VideoPlayer
                  videoId={video.videoId}
                  onProgress={(watchedSeconds, completed) =>
                    recordWatch.mutate({ recommendedVideoId: video.id, watchedSeconds, completed })
                  }
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
