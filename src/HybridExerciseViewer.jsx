import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPlayer, getExercise } from '@februarysea/workout-motion/h2';
import { Pause, Play, RotateCcw, Minus, Plus } from 'lucide-react';

// FIT8 exercise IDs -> exact movement IDs from workout-motion.
// Variations are mapped only where the movement pattern is equivalent.
const motionMap = {
  squat: 'goblet-squat',
  floor: 'dumbbell-floor-press',
  row: 'single-arm-dumbbell-row',
  rdl: 'dumbbell-romanian-deadlift',
  shoulder: 'dumbbell-shoulder-press',
  deadbug: 'dead-bug',
  lunge: 'reverse-lunge',
  bridge: 'glute-bridge',
  lateral: 'lateral-raise',
  curl: 'hammer-curl',
  triceps: 'overhead-dumbbell-triceps-extension',
  plank: 'forearm-plank',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Exercise3D({ exerciseId, name }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const motionId = motionMap[exerciseId] || 'bodyweight-squat';
  const metadata = getExercise(motionId);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let player;
    try {
      player = createPlayer(host, motionId, {
        autoplay: false,
        speed,
        title: `${name} – FIT8 hareket animasyonu`,
        onStateChange: (state) => {
          if (typeof state?.playing === 'boolean') setPlaying(state.playing);
          if (typeof state?.progress === 'number') setProgress(state.progress);
        },
      });
      playerRef.current = player;
      player.play();
      setPlaying(true);
    } catch (error) {
      console.error('FIT8 motion player could not start:', error);
    }

    return () => {
      if (player) player.destroy();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [motionId, name]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.play();
    else player.pause();
  }, [playing]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (player && typeof player.progress === 'number') setProgress(player.progress);
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  const togglePlayback = useCallback(() => setPlaying((value) => !value), []);
  const restart = useCallback(() => {
    const player = playerRef.current;
    if (player) player.seek(0);
    setProgress(0);
    setPlaying(true);
  }, []);
  const seek = useCallback((event) => {
    const value = Number(event.target.value);
    setProgress(value);
    playerRef.current?.seek(value);
  }, []);
  const changeSpeed = (delta) => setSpeed((value) => clamp(Math.round((value + delta) * 100) / 100, 0.5, 1.5));

  return (
    <div className="fit8-motion-wrap">
      <div className="fit8-motion-heading">
        <span className="fit8-motion-badge"><i /> HAREKET ANİMASYONU</span>
        <span className="fit8-motion-duration">{metadata?.duration ? `${metadata.duration.toFixed(1)} sn döngü` : 'Döngü animasyonu'}</span>
      </div>
      <div className="fit8-motion-stage">
        <div className="workout-motion" ref={hostRef} aria-label={`${name} egzersiz animasyonu`} />
      </div>
      <div className="fit8-motion-timeline">
        <span>BAŞLANGIÇ</span>
        <input aria-label="Animasyon zaman çizgisi" type="range" min="0" max="1" step="0.01" value={progress} onChange={seek} />
        <span>BİTİŞ</span>
      </div>
      <div className="fit8-motion-controls">
        <button type="button" onClick={togglePlayback} aria-label={playing ? 'Duraklat' : 'Oynat'}>
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button type="button" onClick={restart} aria-label="Baştan başlat"><RotateCcw size={16} /></button>
        <span className="fit8-motion-divider" />
        <button type="button" onClick={() => changeSpeed(-0.25)} aria-label="Hızı azalt"><Minus size={15} /></button>
        <strong>{speed.toFixed(2).replace(/0$/, '')}×</strong>
        <button type="button" onClick={() => changeSpeed(0.25)} aria-label="Hızı artır"><Plus size={15} /></button>
      </div>
      {exerciseId === 'bridge' && (
        <p className="fit8-motion-note">Animasyon temel glute bridge hareketini gösterir; FIT8 programındaki dambıl varyasyonunda ağırlık kalça üzerinde tutulur.</p>
      )}
      {exerciseId === 'plank' && (
        <p className="fit8-motion-note">Plank izometrik bir harekettir; bu nedenle animasyon sabit doğru pozisyonu gösterir.</p>
      )}
      <p className="fit8-motion-attribution">Animasyon kaynağı: workout-motion · PolyForm Noncommercial 1.0.0</p>
    </div>
  );
}
