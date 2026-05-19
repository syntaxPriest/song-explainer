"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  PlayerContext,
  type PlayerContextValue,
} from "@/components/player/player-context";

// Spotify's iframe API isn't published with official types — describe the
// surface we use.
type EmbedController = {
  addListener: (
    event: "ready" | "playback_update",
    cb: (e: { data: PlaybackData }) => void,
  ) => void;
  removeListener: (event: "ready" | "playback_update") => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (ms: number) => void;
  loadUri: (uri: string) => void;
  destroy: () => void;
};

type PlaybackData = {
  position: number; // ms
  duration: number; // ms
  isPaused: boolean;
  isBuffering: boolean;
};

type SpotifyIframeAPI = {
  createController: (
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: EmbedController) => void,
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeAPI) => void;
  }
}

const SCRIPT_SRC = "https://open.spotify.com/embed/iframe-api/v1";

// The Spotify embed iframe API delivers itself via a one-shot
// `window.onSpotifyIframeApiReady(api)` callback. After it fires, there is
// no global to retrieve the API from — so we cache the resolved promise at
// module scope. Subsequent mounts (route changes, strict-mode double effects)
// share the cached promise instead of waiting on a callback that won't fire
// a second time.
let apiPromise: Promise<SpotifyIframeAPI> | null = null;

function loadIframeApi(): Promise<SpotifyIframeAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in browser"));
  }
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<SpotifyIframeAPI>((resolve) => {
    window.onSpotifyIframeApiReady = (api) => resolve(api);
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

export function SpotifyPlayerProvider({
  spotifyId,
  children,
}: {
  spotifyId: string;
  children: React.ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  // Bumped on every effect run. createController callbacks check this so a
  // late-arriving callback from a torn-down effect (strict-mode double-mount,
  // route change) can't attach a stale iframe.
  const genRef = useRef(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const attachIframeHost = useCallback((el: HTMLDivElement | null) => {
    hostRef.current = el;
  }, []);

  useEffect(() => {
    const myGen = ++genRef.current;
    let controller: EmbedController | null = null;

    (async () => {
      const api = await loadIframeApi();
      const host = await waitForHost(hostRef);
      if (!host || myGen !== genRef.current) return;

      // Clear any leftover iframe from a prior mount so the SDK doesn't
      // stack a second one inside the same host.
      while (host.firstChild) host.removeChild(host.firstChild);

      api.createController(
        host,
        {
          uri: `spotify:track:${spotifyId}`,
          width: "100%",
          height: 352,
        },
        (c) => {
          if (myGen !== genRef.current) {
            try {
              c.destroy();
            } catch {
              // ignore
            }
            return;
          }
          controller = c;
          controllerRef.current = c;
          c.addListener("ready", () => setIsReady(true));
          c.addListener("playback_update", (e) => {
            setPosition(e.data.position);
            setDuration(e.data.duration);
            setIsPaused(e.data.isPaused);
          });
        },
      );
    })().catch((err) => console.warn("[spotify-player]", err));

    return () => {
      try {
        controller?.destroy();
      } catch {
        // ignore — iframe may already be torn down
      }
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      setIsReady(false);
      setPosition(0);
      setDuration(0);
      setIsPaused(true);
    };
  }, [spotifyId]);

  const seek = useCallback((ms: number) => {
    controllerRef.current?.seek(Math.max(0, Math.floor(ms)));
  }, []);
  const play = useCallback(() => controllerRef.current?.play(), []);
  const pause = useCallback(() => controllerRef.current?.pause(), []);
  const togglePlay = useCallback(
    () => controllerRef.current?.togglePlay(),
    [],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      position,
      duration,
      isPaused,
      isReady,
      seek,
      play,
      pause,
      togglePlay,
      attachIframeHost,
    }),
    [
      position,
      duration,
      isPaused,
      isReady,
      seek,
      play,
      pause,
      togglePlay,
      attachIframeHost,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

function waitForHost(
  ref: React.MutableRefObject<HTMLDivElement | null>,
): Promise<HTMLDivElement | null> {
  if (ref.current) return Promise.resolve(ref.current);
  return new Promise((resolve) => {
    let tries = 0;
    const tick = () => {
      if (ref.current) return resolve(ref.current);
      if (tries++ > 100) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
