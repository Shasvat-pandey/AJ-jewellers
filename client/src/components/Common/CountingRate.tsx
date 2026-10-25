import { useState, useEffect, useRef } from "react";

interface CountingRateProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

/**
 * Animated counting number component for live market rates.
 * Features:
 * - IntersectionObserver to trigger counting right when scrolled into view
 * - Smooth easeOutCubic deceleration curve
 * - tabular-nums to prevent layout jitter during counting
 * - Custom INR formatting support
 */
export default function CountingRate({
  value,
  duration = 1500,
  formatter,
  className = "",
}: CountingRateProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  // Trigger when element scrolls into view
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // If IntersectionObserver is not supported, start immediately
    if (typeof IntersectionObserver === "undefined") {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Run the smooth count-up animation once visible and value is available
  useEffect(() => {
    if (!hasStarted || !value || value <= 0) {
      if (value === 0) setDisplayValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    let frameId: number;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic: energetic start with smooth deceleration towards final value
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [hasStarted, value, duration]);

  const output = formatter ? formatter(displayValue) : displayValue.toLocaleString("en-IN");

  return (
    <span ref={elementRef} className={`inline-block tabular-nums ${className}`}>
      {output}
    </span>
  );
}
