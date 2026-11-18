import type { Training } from "./data";

// Builds the .pptx in the browser with PptxGenJS. The real app does the same
// from the deck JSON, as described in the spec.
export async function downloadPptx(t: Training) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = t.topic;

  for (const s of t.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(s.title, { x: 0.6, y: 0.4, w: 12, h: 0.9, fontSize: 32, bold: true, color: "1F2328", fontFace: "Arial" });
    if (s.bullets.length)
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: true } })),
        { x: 0.8, y: 1.5, w: 11.5, h: 3.2, fontSize: 22, color: "1F2328", fontFace: "Arial", valign: "top" },
      );
    if (s.prompt)
      slide.addText(`Discuss: ${s.prompt}`, {
        x: 0.8, y: 5.0, w: 11.5, h: 0.9, fontSize: 20, color: "1E3FB0", fill: { color: "F3F6FE" }, fontFace: "Arial",
      });
    if (s.videoTitle)
      slide.addText(
        s.videoUrl
          ? [{ text: "Video: " }, { text: s.videoTitle, options: { hyperlink: { url: s.videoUrl } } }]
          : `Video: ${s.videoTitle}`,
        { x: 0.8, y: 6.1, w: 11.5, h: 0.5, fontSize: 16, color: "57606A", fontFace: "Arial" },
      );
    slide.addNotes(`${s.notes} (about ${s.minutes} min)`);
  }

  const name = t.topic.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "training";
  await pptx.writeFile({ fileName: `${name}.pptx` });
}
