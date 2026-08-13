import { trpc } from "../../lib/trpc.js";

import { WatchableVideoRow } from "./WatchableVideoRow.js";

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
            <WatchableVideoRow
              recommendedVideoId={video.id}
              videoId={video.videoId}
              title={video.title}
              channelName={video.channelName}
              thumbnailUrl={video.thumbnailUrl}
              watchedSeconds={video.watchedSeconds}
              completed={video.completed}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
