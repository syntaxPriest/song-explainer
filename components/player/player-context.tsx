"use client";

import { createContext, useContext } from "react";

export type PlayerState = {
  position: number; // ms
  duration: number; // ms (0 when unknown)
  isPaused: boolean;
  isReady: boolean;
};

export type PlayerActions = {
  seek: (ms: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
};

export type PlayerContextValue = PlayerState &
  PlayerActions & {
    attachIframeHost: (el: HTMLDivElement | null) => void;
  };

const noop = () => {};

const DEFAULT: PlayerContextValue = {
  position: 0,
  duration: 0,
  isPaused: true,
  isReady: false,
  seek: noop,
  play: noop,
  pause: noop,
  togglePlay: noop,
  attachIframeHost: noop,
};

export const PlayerContext = createContext<PlayerContextValue>(DEFAULT);

export function usePlayer(): PlayerContextValue {
  return useContext(PlayerContext);
}
