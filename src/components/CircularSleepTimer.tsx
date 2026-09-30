"use client";

import { useEffect, useState } from "react";

// A display clock only. AudioProvider remains responsible for timer expiry.
export function useRemainingSeconds(deadline: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadline === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  return deadline === null
    ? null
    : Math.max(0, Math.ceil((deadline - now) / 1000));
}

function formatTime(seconds: number) {
  if (seconds >= 3600) {
    return `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}`;
  }
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function CircularSleepTimer({
  deadline,
  minutes,
}: {
  deadline: number | null;
  minutes: number;
}) {
  const remaining = useRemainingSeconds(deadline);
  const total = minutes * 60;
  const seconds = remaining === null ? total : Math.min(total, remaining);
  const running = remaining !== null;
  const fraction = running && total > 0 ? seconds / total : 0;
  const fading = running && seconds <= 30;
  const label = running
    ? fading
      ? "Soft fade"
      : "Remaining"
    : minutes
      ? "No timer running"
      : "No timer";

  return (
    <div
      className={`circular-timer ${running ? "is-running" : ""} ${fading ? "is-fading" : ""}`}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <circle className="timer-track" cx="100" cy="100" r="90" />
        <circle
          className="timer-progress"
          cx="100"
          cy="100"
          r="90"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - fraction}
        />
      </svg>
      <div
        className="timer-center"
        role="timer"
        aria-live="off"
        aria-label={
          running
            ? `${seconds} seconds remaining${fading ? ", fading out" : ""}`
            : minutes
              ? `No timer running. ${minutes} minutes selected.`
              : "No timer. Continuous playback."
        }
      >
        <span className="timer-digits">
          {minutes ? formatTime(seconds) : "∞"}
        </span>
        <span className="timer-state">{label}</span>
      </div>
    </div>
  );
}
