import type { Slide } from "@/lib/data";

export function SlideView({ slide }: { slide: Slide }) {
  return (
    <div className="flex aspect-video w-full flex-col overflow-hidden border border-line bg-white">
      <div aria-hidden="true" className="h-1.5 w-full bg-brand" />
      <div className="flex flex-1 flex-col gap-3 p-5 sm:gap-4 sm:p-8">
        <div className="text-lg font-semibold tracking-tight sm:text-[26px]">{slide.title}</div>
        <ul className="list-disc pl-5 text-sm leading-relaxed marker:text-brand sm:text-base">
          {slide.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        {slide.prompt && (
          <div className="mt-auto border-l-[3px] border-brand bg-brand-wash px-3 py-2 text-sm sm:text-base">
            <span className="font-semibold text-brand-ink">Discuss </span>
            {slide.prompt}
          </div>
        )}
        {slide.videoTitle && <div className="text-sm text-muted">Video: {slide.videoTitle}</div>}
      </div>
    </div>
  );
}
