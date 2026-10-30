"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
  type ReactNode,
} from "react";
import "./motion.css";

const subscribeMotion = (notify: () => void) => {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", notify);
  return () => preference.removeEventListener("change", notify);
};
const motionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotionSnapshot = () => false;

export function AnimatedCount({ value }: { value: number }) {
  const target = Number.isFinite(value) ? Math.round(value) : 0;
  const [count, setCount] = useState(0);
  const current = useRef(0);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    motionSnapshot,
    serverMotionSnapshot,
  );

  useEffect(() => {
    if (reducedMotion) {
      current.current = target;
      return;
    }
    const from = current.current;
    let start: number | undefined;
    let frame = 0;
    const update = (time: number) => {
      start ??= time;
      const progress = Math.min((time - start) / 650, 1);
      const eased = 1 - (1 - progress) ** 3;
      current.current = Math.round(from + (target - from) * eased);
      setCount(current.current);
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);

  return (
    <span className="motion-count">
      <span aria-hidden="true">
        {(reducedMotion ? target : count).toLocaleString("fr-FR")}
      </span>
      <span className="motion-sr-only">{target.toLocaleString("fr-FR")}</span>
    </span>
  );
}

export function AmbientBackdrop() {
  return (
    <div className="motion-ambient" aria-hidden="true">
      <div className="motion-aurora motion-aurora-lime" />
      <div className="motion-aurora motion-aurora-cyan" />
      <div className="motion-ambient-grid" />
      <div className="motion-particles">
        {Array.from({ length: 9 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </div>
  );
}

export function ReactiveCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    motionSnapshot,
    serverMotionSnapshot,
  );

  function move(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--motion-pointer-x",
      `${event.clientX - bounds.left}px`,
    );
    event.currentTarget.style.setProperty(
      "--motion-pointer-y",
      `${event.clientY - bounds.top}px`,
    );
    event.currentTarget.style.setProperty("--motion-highlight", "1");
  }

  return (
    <div
      className={`motion-card ${className}`.trim()}
      onPointerMove={move}
      onPointerLeave={(event) =>
        event.currentTarget.style.setProperty("--motion-highlight", "0")
      }
    >
      {children}
    </div>
  );
}
