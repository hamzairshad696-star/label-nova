import { LogoMark, Wordmark } from "./logo";

/**
 * Runs before first paint. Skips the intro for the rest of the session once seen,
 * and always when reduced motion is requested. Static string only — no interpolation.
 */
const decide = `try{var d=document.documentElement;if(sessionStorage.getItem("ln-intro")||matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.intro="off"}else{sessionStorage.setItem("ln-intro","1")}}catch(e){document.documentElement.dataset.intro="off"}`;

/** ~2s brand moment on the first page of a visit: mark → orbit draws → wordmark reveals → light sweep → fade. */
export function BrandIntro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <div className="ln-intro" aria-hidden="true">
        <div className="ln-intro__lockup">
          <LogoMark className="ln-intro__mark" orbitClassName="ln-intro__orbit" />
          <Wordmark className="ln-intro__word ln-sweep" />
        </div>
      </div>
    </>
  );
}
