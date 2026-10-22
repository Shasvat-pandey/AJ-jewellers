import { useEffect, useRef, useState } from "react";
import introVideo from "../../../../assets/videos/intro.mp4";
import introVideoMobile from "../../../../assets/videos/intro-mobile.mp4"; 

function isPageReload() {
  const navigationEntry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  return navigationEntry?.type === "reload";
}

export default function IntroSplash() {
  const [visible, setVisible] = useState(isPageReload);
  const [fadingOut, setFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 2. Check the window width to determine which video source to load 
  // (768px is the standard Tailwind 'md' mobile breakpoint)
  const currentVideoSrc = window.innerWidth < 768 ? introVideoMobile : introVideo;

  const dismiss = () => {
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 600);
  };

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-100 bg-black flex items-center justify-center transition-opacity duration-600 ease-out ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src={currentVideoSrc} // 3. Dynamically set the source here
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        className="w-full h-full object-cover"
      />

      <button
        onClick={dismiss}
        className="absolute bottom-6 right-6 md:bottom-10 md:right-10 font-jost text-xs md:text-sm tracking-[0.14em] text-white/90 border border-white/40 px-5 py-2.5 md:px-6 md:py-3 hover:bg-white/10 transition-colors"
      >
        SKIP
      </button>
    </div>
  );
}