import React, { useEffect, useRef, useState } from 'react';
import { ExerciseScene, getExercise, defaultRecipe } from 'exercise-animations/src/engine/index.ts';
import { Pause, Play, RotateCcw, Minus, Plus } from 'lucide-react';
import './form-exercise-viewer.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * FIT8 adapter for Form — Exercise Motion Studio.
 * First rollout: Goblet Squat only. Other FIT8 movements keep their current viewers
 * until matching Form motions are authored and checked.
 */
export default function FormExerciseViewer({ exerciseId = 'squat', name = 'Goblet Squat' }) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const frameRef = useRef(0);
  const phaseRef = useRef(0);
  const playingRef = useRef(true);
  const speedRef = useRef(1);
  const [status, setStatus] = useState('loading');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let lastTime = 0;
    let lastUiUpdate = 0;
    let scene;

    const renderFrame = () => {
      if (cancelled || !scene) return;
      const now = performance.now();
      if (!lastTime) lastTime = now;
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (playingRef.current) {
        phaseRef.current = (phaseRef.current + delta * speedRef.current / 4.8) % 1;
      }

      try {
        scene.render(phaseRef.current);
        if (now - lastUiUpdate > 90) {
          lastUiUpdate = now;
          setProgress(phaseRef.current);
        }
      } catch (err) {
        // The source studio deliberately blocks poses that fail its contact/balance checks.
        playingRef.current = false;
        setPlaying(false);
        setError('Bu kare Form hareket motorunun temas veya denge kontrolünden geçmedi. Animasyon güvenli biçimde durduruldu.');
        setStatus('blocked');
      }

      frameRef.current = requestAnimationFrame(renderFrame);
    };

    async function start() {
      try {
        if (exerciseId !== 'squat') {
          throw new Error('Form motoruna şu anda yalnızca Goblet Squat bağlandı.');
        }
        const exercise = getExercise('goblet-squat');
        const recipe = defaultRecipe(exercise);
        recipe.duration = 4.8;
        recipe.range = 1;
        recipe.view = 'three-quarter';
        recipe.background = 'studio';
        recipe.highlights = true;
        // Visual load only; the workout prescription and user weight records are unchanged.
        recipe.loadKg = 8;

        scene = new ExerciseScene(hostRef.current, exercise, recipe, true);
        sceneRef.current = scene;
        await scene.ready;
        if (cancelled) {
          scene.dispose();
          return;
        }
        scene.render(0);
        setStatus('ready');
        frameRef.current = requestAnimationFrame(renderFrame);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || '3D hareket motoru yüklenemedi.');
          setStatus('error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
      if (scene) scene.dispose();
      sceneRef.current = null;
    };
  }, [exerciseId]);

  const togglePlayback = () => {
    const next = !playingRef.current;
    playingRef.current = next;
    setPlaying(next);
    setError('');
    if (status === 'blocked' && next) setStatus('ready');
  };

  const seek = (event) => {
    const next = clamp(Number(event.target.value), 0, 1);
    phaseRef.current = next;
    setProgress(next);
    setError('');
    try {
      sceneRef.current?.render(next);
      if (status === 'blocked') setStatus('ready');
    } catch (err) {
      playingRef.current = false;
      setPlaying(false);
      setError('Seçilen kare hareket motorunun kontrolünden geçmedi.');
      setStatus('blocked');
    }
  };

  const changeSpeed = (delta) => {
    const next = clamp(Math.round((speedRef.current + delta) * 100) / 100, 0.5, 1.5);
    speedRef.current = next;
    setSpeed(next);
  };

  const restart = () => {
    phaseRef.current = 0;
    setProgress(0);
    setError('');
    playingRef.current = true;
    setPlaying(true);
    try {
      sceneRef.current?.render(0);
      if (status === 'blocked') setStatus('ready');
    } catch {
      setPlaying(false);
      playingRef.current = false;
    }
  };

  return (
    <section className="fit8-form-motion">
      <div className="fit8-form-motion-head">
        <span className="fit8-form-motion-badge"><i /> FORM · 3D MOTION STUDIO</span>
        <span className="fit8-form-motion-state">
          {status === 'loading' ? 'MODEL YÜKLENİYOR' : status === 'ready' ? 'ETKİLEŞİMLİ 3D' : status === 'blocked' ? 'KONTROLDE DURDU' : 'YÜKLEME HATASI'}
        </span>
      </div>
      <div className="fit8-form-motion-stage">
        <div ref={hostRef} className="fit8-form-motion-canvas" aria-label={`${name} 3D hareket animasyonu`} />
        {status === 'loading' && <div className="fit8-form-motion-overlay">Anatomik 3D model hazırlanıyor…</div>}
        {status === 'error' && <div className="fit8-form-motion-overlay">{error}</div>}
      </div>
      <div className="fit8-form-motion-timeline">
        <span>BAŞLANGIÇ</span>
        <input aria-label="Animasyon zaman çizgisi" type="range" min="0" max="1" step="0.005" value={progress} onChange={seek} />
        <span>BİTİŞ</span>
      </div>
      <div className="fit8-form-motion-controls">
        <button type="button" onClick={togglePlayback} disabled={status === 'loading' || status === 'error'} aria-label={playing ? 'Duraklat' : 'Oynat'}>
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button type="button" onClick={restart} disabled={status === 'loading' || status === 'error'} aria-label="Baştan başlat"><RotateCcw size={16} /></button>
        <span className="fit8-form-motion-divider" />
        <button type="button" onClick={() => changeSpeed(-0.25)} disabled={status === 'loading'} aria-label="Hızı azalt"><Minus size={15} /></button>
        <strong>{speed.toFixed(2).replace(/0$/, '')}×</strong>
        <button type="button" onClick={() => changeSpeed(0.25)} disabled={status === 'loading'} aria-label="Hızı artır"><Plus size={15} /></button>
      </div>
      {error && status === 'blocked' && <p className="fit8-form-motion-error">{error}</p>}
      <p className="fit8-form-motion-credit">3D karakter ve hareket motoru: Form — Exercise Motion Studio</p>
    </section>
  );
}
