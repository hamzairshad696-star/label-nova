/** Quiet background for sign-in pages: dot grid, two faint routes, one slow beacon. Decorative only. */
export function AuthBackdrop() {
  const a = "M-40 620 C 260 620 300 380 560 380 S 900 560 1180 520 S 1500 300 1640 320";
  const b = "M-40 220 C 240 260 380 120 640 170 S 1020 330 1300 250 S 1560 120 1640 140";
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1600 900">
      <defs>
        <pattern id="auth-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#fff" fillOpacity=".06" />
        </pattern>
        <radialGradient id="auth-glow">
          <stop offset="0" stopColor="#ffb13b" stopOpacity=".5" />
          <stop offset="1" stopColor="#ffb13b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="auth-halo" cx="50%" cy="45%" r="50%">
          <stop offset="0" stopColor="#4b3fea" stopOpacity=".22" />
          <stop offset="1" stopColor="#4b3fea" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#auth-dots)" />
      <rect width="1600" height="900" fill="url(#auth-halo)" />
      <path d={a} fill="none" stroke="#8c84ff" strokeOpacity=".22" strokeWidth="1.5" />
      <path d={b} fill="none" stroke="#fff" strokeOpacity=".08" strokeWidth="1.2" />
      <g className="ln-route-live">
        <circle r="16" fill="url(#auth-glow)">
          <animateMotion path={a} dur="18s" repeatCount="indefinite" />
        </circle>
        <circle r="3.5" fill="#ffb13b">
          <animateMotion path={a} dur="18s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}
