// lib/hooks/useProctor.ts
// Lightweight anti-cheat instrumentation: tab switches, window blur, and
// implausibly fast answers are tracked and stored with each result.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ProctorStats {
  tabSwitches: number;
  suspicious: number;
  warned: boolean;
}

const FAST_ANSWER_MS = 700;
const FAST_ANSWER_LIMIT = 3;
const PAUSE_MS = 60_000;

export function useProctor() {
  const [tabSwitches, setTabSwitches] = useState(0);
  const [suspicious, setSuspicious] = useState(0);
  const warnedRef = useRef(false);
  const fastCount = useRef(0);
  const hiddenSince = useRef<number | null>(null);
  const lastTransition = useRef<number>(0);

  useEffect(() => {
    const markTransition = (at: number) => {
      if (at - lastTransition.current < 250) return; // dedupe blur+visibility pairs
      lastTransition.current = at;
      setTabSwitches((c) => {
        const next = c + 1;
        warnedRef.current = true;
        return next;
      });
    };

    const onVisibility = () => {
      if (document.hidden) {
        hiddenSince.current = Date.now();
      } else {
        if (hiddenSince.current !== null && Date.now() - hiddenSince.current > 300) {
          markTransition(Date.now());
        }
        hiddenSince.current = null;
      }
    };

    const onBlur = () => {
      markTransition(Date.now());
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const reportAnswer = useCallback((timeMs: number) => {
    if (timeMs > 0 && timeMs < FAST_ANSWER_MS) {
      fastCount.current += 1;
      if (fastCount.current >= FAST_ANSWER_LIMIT) {
        setSuspicious((s) => Math.max(s, 1));
      }
    }
    if (timeMs > PAUSE_MS) {
      setSuspicious((s) => s + 1);
    }
  }, []);

  return { tabSwitches, suspicious, reportAnswer } as ProctorStats & {
    reportAnswer: (timeMs: number) => void;
  };
}