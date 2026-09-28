import { DESKTOP, MOBILE, ARRIVALS, ROUTE_DURATION } from "./geometry";

const STAGES = [
  { name: "Order", caption: "Order received" },
  { name: "Rate", caption: "Best value found" },
  { name: "Label", caption: "4×6 PDF ready" },
  { name: "Carrier", caption: "Handed over" },
  { name: "Tracking", caption: "In transit" },
  { name: "Delivered", caption: "At the door" },
] as const;

const DUR = `${ROUTE_DURATION}s`;
const FADE_START = 0.9;
const FADE_END = 0.94;

type Geometry = typeof DESKTOP | typeof MOBILE;
type Placement = (i: number, x: number, y: number) => { x: number; y: number; anchor: "start" | "middle" | "end" };

/** Illustrative animation of the shipping journey. Pure SVG + SMIL: no JS, no animation library. */
function Route({ g, width, height, place, idPrefix }: { g: Geometry; width: number; height: number; place: Placement; idPrefix: string }) {
  const L = g.length;
  const kp = g.keyPoints.split(";").map(Number);
  const offsets = kp.map((p) => (L * (1 - p)).toFixed(1)).join(";");
  const glowId = `${idPrefix}-glow`;
  const dotsId = `${idPrefix}-dots`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-labelledby={`${idPrefix}-title`}>
      <title id={`${idPrefix}-title`}>
        A parcel travelling from order, to rate, to label, to carrier, to tracking, to delivery.
      </title>
      <defs>
        <pattern id={dotsId} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#fff" fillOpacity=".07" />
        </pattern>
        <radialGradient id={glowId}>
          <stop offset="0" stopColor="#ffb13b" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffb13b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={width} height={height} fill={`url(#${dotsId})`} />
      <path d={g.path} fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.5" />

      {/* Animated version */}
      <g className="ln-route-live">
        <path d={g.path} fill="none" stroke="#8c84ff" strokeWidth="2" strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L}>
          <animate attributeName="stroke-dashoffset" values={offsets} keyTimes={g.keyTimes} dur={DUR} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0;0" keyTimes={`0;0.04;${FADE_START};${FADE_END};1`} dur={DUR} repeatCount="indefinite" />
        </path>
        {g.stations.map(([x, y], i) => {
          const a = ARRIVALS[i]!;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="6" fill="#0a1330" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="6" fill={i === 5 ? "#ffb13b" : "#8c84ff"} opacity="0">
                <animate
                  attributeName="opacity"
                  values="0;0;1;1;0;0"
                  keyTimes={`0;${a};${(a + 0.01).toFixed(3)};${FADE_START};${FADE_END};1`}
                  dur={DUR}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
        {/* Arrival ring at the destination */}
        <circle cx={g.stations[5][0]} cy={g.stations[5][1]} r="6" fill="none" stroke="#ffb13b" strokeWidth="1.5" opacity="0">
          <animate attributeName="r" values="6;6;26;26" keyTimes={`0;${ARRIVALS[5]};0.88;1`} dur={DUR} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;.8;0;0" keyTimes={`0;${ARRIVALS[5]};${(ARRIVALS[5]! + 0.01).toFixed(3)};0.88;1`} dur={DUR} repeatCount="indefinite" />
        </circle>
        <g opacity="0">
          <animate attributeName="opacity" values="0;1;1;0;0" keyTimes={`0;0.04;${FADE_START};${FADE_END};1`} dur={DUR} repeatCount="indefinite" />
          <animateMotion path={g.path} keyPoints={g.keyPoints} keyTimes={g.keyTimes} calcMode="linear" dur={DUR} repeatCount="indefinite" />
          <circle r="20" fill={`url(#${glowId})`} />
          <circle r="4.5" fill="#ffb13b" />
        </g>
      </g>

      {/* Reduced-motion version: the finished journey */}
      <g className="ln-route-static">
        <path d={g.path} fill="none" stroke="#8c84ff" strokeWidth="2" />
        {g.stations.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill={i === 5 ? "#ffb13b" : "#8c84ff"} />
        ))}
      </g>

      {g.stations.map(([x, y], i) => {
        const p = place(i, x, y);
        const stage = STAGES[i]!;
        return (
          <text key={stage.name} x={p.x} y={p.y} textAnchor={p.anchor}>
            <tspan fill="#eef0fa" fontSize="15" fontWeight="600">
              {stage.name}
            </tspan>
            <tspan x={p.x} dy="19" fill="#9aa3c4" fontSize="12.5">
              {stage.caption}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}

// Desktop: labels above stations that sit high, below those that sit low.
const placeDesktop: Placement = (_i, x, y) => (y < 150 ? { x, y: y - 44, anchor: "middle" } : { x, y: y + 32, anchor: "middle" });
// Mobile: labels on the open side of each station.
const placeMobile: Placement = (_i, x, y) => (x > 170 ? { x: x - 18, y: y - 2, anchor: "end" } : { x: x + 18, y: y - 2, anchor: "start" });

export function RouteVisual() {
  return (
    <>
      <div className="hidden md:block">
        <Route g={DESKTOP} width={1220} height={270} place={placeDesktop} idPrefix="route-d" />
      </div>
      <div className="mx-auto max-w-[380px] md:hidden">
        <Route g={MOBILE} width={360} height={630} place={placeMobile} idPrefix="route-m" />
      </div>
    </>
  );
}
