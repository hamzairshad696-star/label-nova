import type { SVGProps } from "react";

/** Small stroke icon set drawn on a 20px grid. Decorative by default. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={20}
      height={20}
      {...props}
    />
  );
}

export const Icons = {
  layers: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M10 3l7 4-7 4-7-4z" /><path d="M3 11l7 4 7-4" /></Icon>
  ),
  table: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><rect x="3" y="4" width="14" height="12" rx="1.5" /><path d="M3 8h14M3 12h14M8 4v12" /></Icon>
  ),
  file: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M5 2.5h6.5L15 6v11.5H5z" /><path d="M11.5 2.5V6H15M7.5 10h5M7.5 13h5" /></Icon>
  ),
  box: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M3 6.5l7-3.5 7 3.5v7L10 17l-7-3.5z" /><path d="M3 6.5L10 10l7-3.5M10 10v7" /></Icon>
  ),
  wallet: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><rect x="2.5" y="5" width="15" height="11" rx="2" /><path d="M13.5 10.5h1.5M2.5 8h15" /></Icon>
  ),
  code: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M7 6l-4 4 4 4M13 6l4 4-4 4" /></Icon>
  ),
  users: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><circle cx="7.5" cy="7" r="2.75" /><path d="M2.5 16c.6-2.6 2.6-4 5-4s4.4 1.4 5 4M13 4.5a2.5 2.5 0 010 5M15 12c1.3.5 2.2 1.8 2.5 4" /></Icon>
  ),
  chart: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M3 16.5h14M6 13V9M10 13V5M14 13v-3" /></Icon>
  ),
  shield: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M10 2.5l6 2.5v4.5c0 3.8-2.6 6.6-6 8-3.4-1.4-6-4.2-6-8V5z" /><path d="M7.5 10l2 2 3.5-4" /></Icon>
  ),
  key: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><circle cx="7" cy="12" r="3.5" /><path d="M9.5 9.5L16 3M13.5 5.5l2 2" /></Icon>
  ),
  log: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M4 4.5h12M4 8.5h12M4 12.5h8M4 16.5h5" /></Icon>
  ),
  lock: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><rect x="4" y="9" width="12" height="8.5" rx="1.5" /><path d="M6.5 9V6.5a3.5 3.5 0 017 0V9" /></Icon>
  ),
  check: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M4.5 10.5l3.5 3.5 7.5-8" /></Icon>
  ),
  alert: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><circle cx="10" cy="10" r="7.5" /><path d="M10 6v4.5M10 13.5v.01" /></Icon>
  ),
  bolt: (p: SVGProps<SVGSVGElement>) => (
    <Icon {...p}><path d="M11 2.5L4.5 11H10l-1 6.5L15.5 9H10z" /></Icon>
  ),
};
