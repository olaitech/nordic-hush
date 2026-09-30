"use client";
import { CircularSleepTimer, useRemainingSeconds } from "./CircularSleepTimer";
import { useAudio } from "@/context/AudioProvider";

export function Countdown() {
  const { deadline } = useAudio();
  const seconds = useRemainingSeconds(deadline);
  if (seconds === null) return null;
  return (
    <span className="countdown">
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}{" "}
      {seconds <= 30 ? "· fading out" : "remaining"}
    </span>
  );
}

export function SleepTimer() {
  const { timer, deadline, setTimer } = useAudio();
  return (
    <section
      id="sleep-timer"
      className="sleep-timer circular-sleep-panel"
      aria-labelledby="timer-heading"
    >
      <CircularSleepTimer deadline={deadline} minutes={timer} />
      <div className="timer-settings">
        <div className="timer-copy">
          <div>
            <h2 id="timer-heading">Sleep timer</h2>
            <p>Fades out gently in the final 30 seconds.</p>
            <p className="timer-hint">
              {deadline
                ? "The timer applies to your whole mix."
                : timer
                  ? "No timer running. Starts when you press play."
                  : "Continuous playback. Take your time."}
            </p>
          </div>
        </div>
        <div className="timer-options">
          {[
            { value: 15, label: "15m", accessible: "15 min" },
            { value: 30, label: "30m", accessible: "30 min" },
            { value: 60, label: "1h", accessible: "60 min" },
            { value: 120, label: "2h", accessible: "2 hours" },
            { value: 0, label: "∞", accessible: "No timer" },
          ].map((option) => (
            <button
              key={option.value}
              aria-label={
                option.value
                  ? `Set sleep timer to ${option.accessible}`
                  : "No timer"
              }
              aria-pressed={timer === option.value}
              className={timer === option.value ? "selected" : ""}
              onClick={() => setTimer(option.value)}
            >
              {option.label}
            </button>
          ))}
          {timer !== 0 && (
            <button className="cancel-timer" onClick={() => setTimer(0)}>
              Cancel timer
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
