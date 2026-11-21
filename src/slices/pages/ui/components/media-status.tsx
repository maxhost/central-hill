"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type MediaPlaybackCallbacks = {
  onReady?: () => void;
  onError?: () => void;
};

const MediaStatus = createContext<MediaPlaybackCallbacks | null>(null);

/** Absent outside Welcome, so existing player consumers retain their behavior. */
export function useMediaStatus() {
  return useContext(MediaStatus);
}

/** A keyed boundary: a different asset gets fresh state and cannot inherit an old failure. */
export function WelcomeMediaFrame({ children, preview, errorLabel }: {
  children: ReactNode;
  preview?: boolean;
  errorLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const onReady = useCallback(() => setState(current => current === "error" ? current : "ready"), []);
  const onError = useCallback(() => setState("error"), []);
  const callbacks = useMemo(() => ({ onReady, onError }), [onReady, onError]);

  useEffect(() => {
    // A cached image can finish before hydration installs the capture listeners.
    let disposed = false;
    const image = ref.current?.querySelector("img");
    if (image?.complete) {
      void Promise.resolve().then(() => {
        if (!disposed) (image.naturalWidth > 0 ? onReady : onError)();
      });
    }
    return () => { disposed = true; };
  }, [onReady, onError]);

  return (
    <MediaStatus.Provider value={callbacks}>
      <div
        ref={ref}
        className="relative h-full w-full overflow-hidden"
        data-welcome-media-state={state}
        onLoadCapture={event => { if (event.target instanceof HTMLImageElement) onReady(); }}
        onErrorCapture={event => { if (event.target instanceof HTMLImageElement) onError(); }}
      >
        {state === "error" ? (
          preview && errorLabel ? <p role="status" className="absolute inset-0 flex items-center justify-center p-5 text-center text-sm text-ink-soft">{errorLabel}</p> : null
        ) : children}
      </div>
    </MediaStatus.Provider>
  );
}
