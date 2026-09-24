'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useAutoScroll(resetKey: string, fontSize: number) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [progress, setProgress] = useState(0);
  const pause = useCallback(() => {
    setPlaying(false);
    setFinished(false);
  }, []);
  const updateProgress = useCallback(() => {
    const view = viewportRef.current;
    if (!view) return;
    const max = view.scrollHeight - view.clientHeight;
    setProgress(max > 0 ? Math.round((view.scrollTop / max) * 100) : 0);
  }, []);
  const restart = useCallback(() => {
    pause();
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
    updateProgress();
  }, [pause, updateProgress]);
  useEffect(() => {
    restart();
  }, [resetKey, restart]);
  useEffect(() => {
    if (!playing) return;
    const view = viewportRef.current;
    if (!view) return;
    let frame = 0,
      last = 0,
      position = view.scrollTop;
    const step = (time: number) => {
      if (last) position += (Math.min(time - last, 100) / 1000) * speed;
      last = time;
      view.scrollTop = position;
      if (view.scrollTop >= view.scrollHeight - view.clientHeight - 1) {
        setPlaying(false);
        setFinished(true);
        return;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onHide);
    const observer = new ResizeObserver(updateProgress);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [pause, updateProgress]);
  useEffect(() => {
    updateProgress();
  }, [fontSize, updateProgress]);
  function toggle() {
    if (!resetKey) return;
    const view = viewportRef.current;
    if (!playing && view && view.scrollTop >= view.scrollHeight - view.clientHeight - 1)
      view.scrollTop = 0;
    setFinished(false);
    setPlaying((value) => !value);
  }
  return {
    viewportRef,
    playing,
    finished,
    speed,
    setSpeed,
    progress,
    pause,
    restart,
    toggle,
    updateProgress,
  };
}
