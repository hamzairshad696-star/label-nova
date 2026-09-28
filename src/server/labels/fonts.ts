import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont } from "pdf-lib";
import * as data from "./font-data";

const buf = (b64: string) => Uint8Array.from(Buffer.from(b64, "base64"));
const FILES = {
  regular: [buf(data.sansLatin400), buf(data.sansLatinExt400)],
  bold: [buf(data.sansLatin700), buf(data.sansLatinExt700)],
  mono: [buf(data.monoLatin500)],
};

export interface LabelFonts {
  regular: PDFFont[];
  bold: PDFFont[];
  mono: PDFFont[];
}

export async function embedFonts(doc: PDFDocument): Promise<LabelFonts> {
  doc.registerFontkit(fontkit);
  const embed = (list: Uint8Array[]) => Promise.all(list.map((b) => doc.embedFont(b, { subset: true })));
  return { regular: await embed(FILES.regular), bold: await embed(FILES.bold), mono: await embed(FILES.mono) };
}

// Characters any sans font can print, computed once from the actual font files.
let supported: Set<number> | null = null;
export async function supportedCodePoints(): Promise<Set<number>> {
  if (supported) return supported;
  const doc = await PDFDocument.create();
  const fonts = await embedFonts(doc);
  supported = new Set([...fonts.regular, ...fonts.bold].flatMap((f) => f.getCharacterSet()));
  return supported;
}

/** Characters in `text` that no label font can print (for validation messages). */
export async function unprintableChars(text: string): Promise<string[]> {
  const set = await supportedCodePoints();
  return [...new Set([...text].filter((ch) => !set.has(ch.codePointAt(0)!) && ch !== " "))];
}
