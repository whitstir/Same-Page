import type { Slide } from "@/lib/data";

export function SlideView({ slide }: { slide: Slide }) {
  return (
    <div className="flex aspect-video w-full flex-col gap-3 overflow-hidden rounded-xl border border-line-strong bg-white p-5 sm:p-7">
      <div className="text-lg font-bold sm:text-2xl">{slide.title}</div>
      <ul className="list-disc pl-5 text-sm leading-relaxed sm:text-base">
        {slide.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
      {slide.prompt && (
        <div className="rounded-lg bg-subtle px-3 py-2 text-sm sm:text-base">
          <strong>Discuss:</strong> {slide.prompt}
        </div>
      )}
      {slide.videoTitle && (
        <div className="text-sm text-muted">
          ▶ Video:{" "}
          {slide.videoUrl ? (
            <a href={slide.videoUrl} target="_blank" rel="noreferrer">
              {slide.videoTitle}
            </a>
          ) : (
            slide.videoTitle
          )}
        </div>
      )}
    </div>
  );
}
