import type { MarketMuseOutput } from '../types/marketMuse';

export function buildSlideOutline(output: MarketMuseOutput): string {
  let text = `Title: ${output.presentation_outline.title}\n\n`;

  output.presentation_outline.slides.forEach((slide, idx) => {
    text += `Slide ${idx + 1}: ${slide.title}\n`;
    slide.bullets.forEach((bullet) => {
      text += `- ${bullet}\n`;
    });
    text += `\n`;
  });

  return text;
}
