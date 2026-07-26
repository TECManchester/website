import Image from "next/image";
import { Play } from "lucide-react";
import { formatDuration, type YouTubeVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});

function formatDate(iso: string) {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : dateFormat.format(new Date(ms));
}

export function VideoCard({
  video,
  className,
}: {
  video: YouTubeVideo;
  className?: string;
}) {
  const duration = formatDuration(video.durationSeconds);
  const date = formatDate(video.publishedAt);

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className={cn("group block", className)}
    >
      <div className="bg-ink shadow-card group-hover:shadow-card-lg relative aspect-video overflow-hidden rounded-[14px] transition duration-250 group-hover:-translate-y-1">
        {video.thumbnail && (
          <Image
            src={video.thumbnail}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        )}
        <span className="absolute inset-0 grid place-items-center bg-linear-to-b from-transparent via-transparent to-ink/60">
          <span className="group-hover:bg-green grid size-14 place-items-center rounded-full bg-white/90 transition duration-200">
            <Play className="text-ink ml-0.5 size-[22px] fill-current" />
          </span>
        </span>
        {duration && (
          <span className="bg-ink/80 absolute right-2.5 bottom-2.5 rounded-md px-2 py-0.5 text-xs font-semibold text-white">
            {duration}
          </span>
        )}
      </div>
      <h3 className="group-hover:text-green-600 mt-3.5 text-lg font-bold transition-colors">
        {video.title}
      </h3>
      {date && <p className="text-grey-500 mt-1 text-[13.5px]">{date}</p>}
    </a>
  );
}
