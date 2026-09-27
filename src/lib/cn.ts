import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the design-system tokens in globals.css, so that
// e.g. `text-h2` (a font size) is not mistaken for a text colour and dropped.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h2", "h3", "lead"],
      radius: ["control", "menu", "panel", "paper"],
      shadow: ["lift", "menu"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
