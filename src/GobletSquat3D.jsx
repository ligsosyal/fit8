import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HumanAvatar, loadHumanPackage } from 'humanforge/human';
import { Pause, Play, RotateCcw, RotateCw, Minus, Plus, Eye, EyeOff } from 'lucide-react';
import './goblet-squat-3d.css';

// HumanForge's CC0 human asset pack. The model assets are loaded on demand and cached by the browser.
const HUMAN_ASSETS = 'https://cdn.jsdelivr.net/gh/abdulrehman043/humanforge@v0.5.0/assets/human';
const CYCLE_SECONDS = 4.2;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function makeDumbbell() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x303a35, metalness: 0.82, roughness: 0.28 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x9bd46e, metalness: 0.28, roughness: 0.48 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.23, 18), grip);
  handle.rotation.z = Math.PI / 2;
  group.add(handle);
  [-1, 1].forEach((side) => {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.065, 24), metal);
    plate.rotation.z = Math.PI / 2;
    plate.position.x = side * 0.145;
    group.add(plate);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.072, 20), grip);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = side * 0.19;
    group.add(cap);
  });
  group.scale.setScalar(0.9);
  return group;
}

function addMuscleMarker(parent, position, scale) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffa34d, transparent: true, opacity: 0.36,
    depthWrite: false, side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.renderOrder = 4;
  parent.add(mesh);
  return mesh;
}

export default function GobletSquat3D() {
  const mountRef = useRef(null);
  const engineRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showMuscles, setShowMuscles] = useState(true);
  const [phaseLabel, setPhaseLabel] = useState('Başlangıç pozisyonu');
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  useEffect(() => {
    let alive = true;
    let raf = 0;
    let last = 0;
    let lastUi = 0;
    let renderer;
    let controls;
    let avatar;
    let scene;
    let camera;
    let resizeObserver;

    const start = async () => {
      try {
        const pkg = await loadHumanPackage(HUMAN_ASSETS);
        if (!alive) return;

        avatar = new HumanAvatar(pkg);
        avatar.textureSize = '1k';
        avatar.anisotropy = 2;
        avatar.normalMaps = false;
        await avatar.setConfig({
          gender: 1,
          age: 0.18,
          muscle: 0.76,
          weight: 0.42,
          height: 0.55,
          proportions: 0.56,
          firmness: 0.72,
          african: 0,
          asian: 0,
          caucasian: 1,
          detail: {},
          skin: 'young_caucasian_male',
          skinTint: '#ffffff',
          eyes: 'brownlight',
          eyebrows: 'eyebrow001',
          eyebrowColor: '#30241d',
          eyelashes: null,
          hair: 'short02',
          hairColor: '#29221e',
          clothes: ['male_casualsuit01', 'shoes01']
        });
        if (!alive) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color('#111a14');
        camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
        camera.position.set(0, 1.05, 3.55);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        mountRef.current.replaceChildren(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.075;
        controls.minDistance = 2.25;
        controls.maxDistance = 5.8;
        controls.minPolarAngle = 0.35;
        controls.maxPolarAngle = Math.PI * 0.49;
        controls.target.set(0, 0.92, 0);
        controls.update();

        scene.add(new THREE.HemisphereLight(0xdde9dc, 0x253027, 2.05));
        const key = new THREE.DirectionalLight(0xfff0d9, 3.0);
        key.position.set(-3, 5, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x9bd46e, 1.5);
        rim.position.set(3, 2.5, -3);
        scene.add(rim);

        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(2.8, 64),
          new THREE.MeshStandardMaterial({ color: 0x1b281e, roughness: 0.95, metalness: 0 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.005;
        scene.add(floor);
        const grid = new THREE.GridHelper(5, 20, 0x40533f, 0x29382b);
        grid.position.y = 0.012;
        scene.add(grid);

        scene.add(avatar.group);

        const bone = (name) => avatar.bones.find((b) => b.name === `mixamorig:${name}`);
        const names = ['Hips','Spine','Spine1','Spine2','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg',
          'LeftFoot','RightFoot','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftHand','RightHand'];
        const bones = Object.fromEntries(names.map((name) => [name, bone(name)]));
        const rest = {};
        Object.entries(bones).forEach(([name, b]) => {
          if (b) rest[name] = { rotation: b.rotation.clone(), position: b.position.clone() };
        });

        // Dumbbell and translucent muscle-region markers are attached to the rig, so they follow the pose.
        const weight = makeDumbbell();
        const chest = bones.Spine2 || bones.Spine1;
        if (chest) {
          weight.position.set(0, -0.13, 0.24);
          weight.rotation.set(0.12, 0, 0);
          chest.add(weight);
        }
        const markers = [];
        ['LeftUpLeg','RightUpLeg'].forEach((name) => {
          if (bones[name]) markers.push(addMuscleMarker(bones[name], [0, -0.2, 0.045], [0.075, 0.2, 0.035]));
        });
        if (bones.Hips) {
          markers.push(addMuscleMarker(bones.Hips, [-0.105, -0.08, -0.12], [0.105, 0.09, 0.055]));
          markers.push(addMuscleMarker(bones.Hips, [0.105, -0.08, -0.12], [0.105, 0.09, 0.055]));
        }
        if (bones.Spine1) markers.push(addMuscleMarker(bones.Spine1, [0, 0.02, 0.095], [0.12, 0.19, 0.035]));

        const applyPose = (depth) => {
          const setX = (name, delta) => {
            const b = bones[name], r = rest[name];
            if (b && r) { b.rotation.copy(r.rotation); b.rotation.x += delta; }
          };
          const setY = (name, delta) => {
            const b = bones[name], r = rest[name];
            if (b && r) { b.rotation.copy(r.rotation); b.rotation.y += delta; }
          };
          ['Hips','Spine','Spine1','Spine2','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg',
            'LeftFoot','RightFoot','LeftArm','RightArm','LeftForeArm','RightForeArm'].forEach((n) => {
              if (bones[n] && rest[n]) bones[n].rotation.copy(rest[n].rotation);
            });
          // Arms remain flexed around the chest-held dumbbell throughout the repetition.
          setX('LeftArm', -0.78); setX('RightArm', -0.78);
          setX('LeftForeArm', -0.72); setX('RightForeArm', -0.72);
          setY('LeftArm', -0.12); setY('RightArm', 0.12);
          // Controlled squat: hip/knee flexion, small ankle contribution and stable torso.
          setX('LeftUpLeg', -0.78 * depth);
          setX('RightUpLeg', -0.78 * depth);
          setX('LeftLeg', 1.28 * depth);
          setX('RightLeg', 1.28 * depth);
          setX('LeftFoot', -0.18 * depth);
          setX('RightFoot', -0.18 * depth);
          setX('Spine', 0.07 * depth);
          setX('Spine1', 0.11 * depth);
          setX('Spine2', 0.04 * depth);
          if (bones.Hips && rest.Hips) {
            bones.Hips.position.copy(rest.Hips.position);
            bones.Hips.position.y -= 0.13 * depth;
          }
        };

        const resize = () => {
          if (!mountRef.current || !renderer) return;
          const w = Math.max(1, mountRef.current.clientWidth);
          const h = Math.max(1, mountRef.current.clientHeight);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        };
        resize();
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mountRef.current);

        engineRef.current = {
          camera, controls, renderer,
          setProgress: (p) => { engineRef.current.progress = p; applyPose(0.5 - 0.5 * Math.cos(p * Math.PI * 2)); },
          resetCamera: () => {
            camera.position.set(0, 1.05, 3.55);
            controls.target.set(0, 0.92, 0);
            controls.update();
          },
          progress: 0,
          setShowMuscles: (v) => markers.forEach((m) => { m.visible = v; })
        };
        setStatus('ready');

        const tick = (now) => {
          if (!alive) return;
          raf = requestAnimationFrame(tick);
          if (!last) last = now;
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (playingRef.current) {
            engineRef.current.progress = (engineRef.current.progress + dt * speedRef.current / CYCLE_SECONDS) % 1;
          }
          const p = engineRef.current.progress;
          const depth = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
          applyPose(depth);
          controls.update();
          renderer.render(scene, camera);
          if (now - lastUi > 100) {
            lastUi = now;
            setProgress(p);
            setPhaseLabel(p < 0.12 || p > 0.88 ? 'Ayakta · başlangıç' : p < 0.42 ? 'Kontrollü iniş' : p < 0.58 ? 'Alt pozisyon' : 'Kontrollü yükseliş');
          }
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        console.error('FIT8 Goblet Squat 3D:', e);
        if (alive) { setError(e?.message || '3D model yüklenemedi.'); setStatus('error'); }
      }
    };

    start();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      controls?.dispose();
      if (renderer) renderer.dispose();
      if (mountRef.current) mountRef.current.replaceChildren();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const toggle = useCallback(() => setPlaying((v) => !v), []);
  const restart = useCallback(() => {
    if (engineRef.current) engineRef.current.setProgress(0);
    setProgress(0);
    setPlaying(true);
  }, []);
  const seek = useCallback((event) => {
    const p = Number(event.target.value);
    if (engineRef.current) engineRef.current.setProgress(p);
    setProgress(p);
  }, []);
  const changeSpeed = (delta) => setSpeed((v) => clamp(Math.round((v + delta) * 100) / 100, 0.5, 1.5));
  const resetCamera = () => engineRef.current?.resetCamera();
  const toggleMuscles = () => setShowMuscles((v) => {
    engineRef.current?.setShowMuscles(!v);
    return !v;
  });

  return (
    <section className="fit8-pro3d">
      <div className="fit8-pro3d-top">
        <span className="fit8-pro3d-badge"><i /> GERÇEKÇİ 3D · GOBLET SQUAT</span>
        <span className="fit8-pro3d-status">{status === 'loading' ? 'MODEL YÜKLENİYOR' : status === 'error' ? 'YÜKLEME HATASI' : 'ETKİLEŞİMLİ MODEL'}</span>
      </div>
      <div className="fit8-pro3d-stage">
        <div className="fit8-pro3d-canvas" ref={mountRef} />
        {status === 'loading' && <div className="fit8-pro3d-overlay">3D insan modeli hazırlanıyor…<small>İlk açılışta model dosyaları indirilebilir.</small></div>}
        {status === 'error' && <div className="fit8-pro3d-overlay fit8-pro3d-error">{error}<small>Diğer hareketlerin animasyonları etkilenmedi.</small></div>}
        <div className="fit8-pro3d-hint">Döndürmek için sürükle · Yakınlaştırmak için iki parmakla aç</div>
        <button className="fit8-pro3d-camera" onClick={resetCamera} type="button" title="Kamerayı sıfırla"><RotateCw size={15} /></button>
      </div>
      <div className="fit8-pro3d-muscles">
        <div><b>ÇALIŞAN KAS GRUPLARI</b><small>Turuncu bölgeler temsili vurgudur.</small></div>
        <button type="button" onClick={toggleMuscles}>{showMuscles ? <Eye size={14}/> : <EyeOff size={14}/>} {showMuscles ? 'Gizle' : 'Göster'}</button>
        <span>Quadriceps</span><span>Gluteus</span><span>Core stabilizatörleri</span>
      </div>
      <div className="fit8-pro3d-phase">{phaseLabel}</div>
      <div className="fit8-pro3d-timeline">
        <span>BAŞLANGIÇ</span>
        <input aria-label="Goblet squat zaman çizgisi" type="range" min="0" max="0.999" step="0.005" value={progress} onChange={seek}/>
        <span>DÖNGÜ</span>
      </div>
      <div className="fit8-pro3d-controls">
        <button type="button" onClick={toggle} aria-label={playing ? 'Duraklat' : 'Oynat'}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button>
        <button type="button" onClick={restart} aria-label="Baştan başlat"><RotateCcw size={15}/></button>
        <i />
        <button type="button" onClick={() => changeSpeed(-0.25)} aria-label="Yavaşlat"><Minus size={14}/></button>
        <strong>{speed.toFixed(2).replace(/0$/, '')}×</strong>
        <button type="button" onClick={() => changeSpeed(0.25)} aria-label="Hızlandır"><Plus size={14}/></button>
      </div>
      <div className="fit8-pro3d-technique">
        <div><b>TEKNİK KONTROL</b><p>Dizler ayak parmaklarıyla aynı yönde. Topuklar yerde. Gövde kontrollü ve bel nötr.</p></div>
        <div><b>HAREKET EVRELERİ</b><p>Kalçayı geriye-aşağı gönder · rahat derinlikte durakla · topuklardan kuvvet alarak yüksel.</p></div>
      </div>
      <p className="fit8-pro3d-credit">Model altyapısı: HumanForge · CC0 MakeHuman/MPFB varlıkları · 3D kontrol: Three.js</p>
    </section>
  );
}
