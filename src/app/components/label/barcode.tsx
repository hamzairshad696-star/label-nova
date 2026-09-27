import { code128Bars } from "@/lib/barcode/code128";
import { cn } from "@/lib/cn";

interface BarcodeProps {
  value: string;
  className?: string;
  /** Quiet zone on each side, in modules. Code 128 requires at least 10. */
  quietZone?: number;
}

/** Scannable Code 128 barcode as crisp vector SVG. */
export function Barcode({ value, className, quietZone = 10 }: BarcodeProps) {
  const { bars, totalModules } = code128Bars(value);
  const width = totalModules + quietZone * 2;
  return (
    <svg
      viewBox={`0 0 ${width} 40`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={cn("block w-full", className)}
      role="img"
      aria-label={`Barcode for ${value}`}
    >
      {bars.map((b) => (
        <rect key={b.x} x={b.x + quietZone} y={0} width={b.width} height={40} fill="currentColor" />
      ))}
    </svg>
  );
}
