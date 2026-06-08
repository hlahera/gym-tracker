import { useCallback, useEffect, useRef, useState } from 'react';

import { notifyRestComplete } from '@/lib/rest-timer-feedback';

type RestTimerState = 'idle' | 'running' | 'finished';

export function useRestTimer(defaultSeconds: number) {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(defaultSeconds);
  const [state, setState] = useState<RestTimerState>('idle');
  const [label, setLabel] = useState<string | null>(null);
  const endAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef(false);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTick();
    endAtRef.current = null;
    setRemaining(0);
    setState('finished');
    if (!notifiedRef.current) {
      notifiedRef.current = true;
      notifyRestComplete();
    }
  }, [clearTick]);

  const tick = useCallback(() => {
    if (endAtRef.current == null) return;
    const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) finish();
  }, [finish]);

  const start = useCallback(
    (seconds?: number, contextLabel?: string) => {
      const duration = Math.max(5, seconds ?? defaultSeconds);
      clearTick();
      notifiedRef.current = false;
      setTotal(duration);
      setRemaining(duration);
      setLabel(contextLabel ?? null);
      setState('running');
      endAtRef.current = Date.now() + duration * 1000;
      intervalRef.current = setInterval(tick, 250);
    },
    [clearTick, defaultSeconds, tick],
  );

  const skip = useCallback(() => {
    clearTick();
    endAtRef.current = null;
    setRemaining(0);
    setState('idle');
    setLabel(null);
  }, [clearTick]);

  const dismissFinished = useCallback(() => {
    setState('idle');
    setLabel(null);
  }, []);

  const adjust = useCallback(
    (deltaSeconds: number) => {
      if (state !== 'running' || endAtRef.current == null) return;
      endAtRef.current += deltaSeconds * 1000;
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      setTotal((t) => Math.max(left, t + deltaSeconds));
      if (left <= 0) finish();
    },
    [finish, state],
  );

  useEffect(() => {
    return clearTick;
  }, [clearTick]);

  useEffect(() => {
    setTotal(defaultSeconds);
  }, [defaultSeconds]);

  const progress = total > 0 ? remaining / total : 0;

  return {
    remaining,
    total,
    progress,
    state,
    label,
    isActive: state === 'running' || state === 'finished',
    start,
    skip,
    dismissFinished,
    adjust,
  };
}

export function formatRestTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
