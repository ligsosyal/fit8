import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Pause,Play,RotateCcw,Minus,Plus} from 'lucide-react';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function segment(parent,a,b,r,mat){const d=new THREE.Vector3().subVectors(b,a);const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(r,Math.max(.01,d.length()-2*r),6,12),mat);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function sphere(parent,pos,scale,mat){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),mat);m.position.copy(pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
function makeRig(scene){
 const skin=new THREE.MeshStandardMaterial({color:0xd9a27f,roughness:.72}), shirt=new THREE.MeshStandardMaterial({color:0x789b63,roughness:.62}), shorts=new THREE.MeshStandardMaterial({color:0x263b30,roughness:.75}), jointMat=new THREE.MeshStandardMaterial({color:0xc98c69}), metal=new THREE.MeshStandardMaterial({color:0xb9c4c0,metalness:.78,roughness:.25}), grip=new THREE.MeshStandardMaterial({color:0x303a35,roughness:.65});
 const root=new THREE.Group();scene.add(root);
 // Torso, pelvis and head
 sphere(root,new THREE.Vector3(0,1.38,0),[.34,.49,.19],shirt);
 sphere(root,new THREE.Vector3(0,.91,0),[.29,.22,.18],shorts);
 const neck=segment(root,new THREE.Vector3(0,1.79,0),new THREE.Vector3(0,1.91,0),.075,skin);
 sphere(root,new THREE.Vector3(0,2.06,0),[.16,.2,.15],skin);
 // subtle face direction marker
 sphere(root,new THREE.Vector3(0,2.08,.132),[.075,.045,.025],jointMat);
 const limbs={};
 for(const side of [-1,1]){
  const x=side*.39;
  const shoulder=new THREE.Group();shoulder.position.set(x,1.67,0);root.add(shoulder);
  segment(shoulder,new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.39,0),.105,skin);
  const elbow=new THREE.Group();elbow.position.set(0,-.39,0);shoulder.add(elbow);
  segment(elbow,new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.38,0),.078,skin);
  sphere(elbow,new THREE.Vector3(0,-.39,0),[.07,.07,.07],jointMat);
  const hand=sphere(elbow,new THREE.Vector3(0,-.48,.01),[.075,.105,.065],skin);
  const dumb=new THREE.Group();dumb.position.set(0,-.52,.015);elbow.add(dumb);
  segment(dumb,new THREE.Vector3(0,-.12,0),new THREE.Vector3(0,.12,0),.025,grip);
  for(const y of [-.105,.105]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.055,24),metal);p.position.y=y;dumb.add(p);}
  const hip=new THREE.Group();hip.position.set(side*.17,.91,0);root.add(hip);
  segment(hip,new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.52,0),.13,shorts);
  const knee=new THREE.Group();knee.position.set(0,-.52,0);hip.add(knee);
  sphere(knee,new THREE.Vector3(0,0,0),[.105,.11,.11],jointMat);
  segment(knee,new THREE.Vector3(0,0,0),new THREE.Vector3(0,-.49,0),.085,skin);
  const foot=sphere(knee,new THREE.Vector3(0,-.51,.1),[.12,.075,.22],grip);
  limbs[side]={shoulder,elbow,dumb,hip,knee};
 }
 return {root,limbs};
}
function poseFor(id,t,limbs,root){
 const s=Math.sin(t*Math.PI*2),u=(1-Math.cos(t*Math.PI*2))/2;
 const L=limbs[-1],R=limbs[1];
 for(const q of [L,R]){q.shoulder.rotation.set(0,0,0);q.elbow.rotation.set(0,0,0);q.hip.rotation.set(0,0,0);q.knee.rotation.set(0,0,0);}
 root.position.y=0;root.rotation.set(0,0,0);
 if(id==='squat'){for(const q of [L,R]){q.hip.rotation.z=-.48*u;q.knee.rotation.z=.95*u;}root.rotation.z=.08*u;}
 else if(id==='floor'){for(const q of [L,R]){q.shoulder.rotation.z=-.95*u;q.elbow.rotation.z=.18*u;}root.rotation.x=-Math.PI/2;root.position.y=-.55;}
 else if(id==='row'){for(const q of [L,R]){q.shoulder.rotation.z=-.55+.42*u;q.elbow.rotation.z=-.25-.9*u;}root.rotation.z=.62;}
 else if(id==='rdl'){for(const q of [L,R]){q.hip.rotation.z=-.68*u;q.knee.rotation.z=.12*u;}root.rotation.z=.62*u;}
 else if(id==='shoulder'){for(const q of [L,R]){q.shoulder.rotation.z=-1.7*u;q.elbow.rotation.z=.12*u;}}
 else if(id==='deadbug'){for(const q of [L,R]){q.hip.rotation.z=.45*u;q.knee.rotation.z=-.7*u;}L.shoulder.rotation.z=-.9*u;R.shoulder.rotation.z=.9*u;}
 else if(id==='lunge'){L.hip.rotation.z=-.25*u;L.knee.rotation.z=.45*u;R.hip.rotation.z=.45*u;R.knee.rotation.z=-.85*u;}
 else if(id==='bridge'){root.position.y=.25*u;for(const q of [L,R]){q.knee.rotation.z=-.95;}}
 else if(id==='lateral'){for(const q of [L,R])q.shoulder.rotation.z=(q===L?1:-1)*1.15*u;}
 else if(id==='curl'){for(const q of [L,R])q.elbow.rotation.z=-1.35*u;}
 else if(id==='triceps'){for(const q of [L,R]){q.shoulder.rotation.z=-2.75;q.elbow.rotation.z=1.1-1.0*u;}}
 else if(id==='plank'){root.rotation.z=Math.PI/2;root.position.y=-.62;for(const q of [L,R]){q.shoulder.rotation.z=-.25;q.hip.rotation.z=0;q.knee.rotation.z=0;}}
}
export default function Exercise3D({exerciseId,name}){
 const host=useRef(null),anim=useRef({playing:true,speed:1,time:0});const [playing,setPlaying]=useState(true),[speed,setSpeed]=useState(1);
 useEffect(()=>{
  const el=host.current;if(!el)return;let renderer,frame,controls,rig;
  try{
   const scene=new THREE.Scene();scene.background=new THREE.Color('#111a14');scene.fog=new THREE.Fog('#111a14',5,11);
   const camera=new THREE.PerspectiveCamera(34,1,.1,50);camera.position.set(3.2,2.4,5.5);
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;el.appendChild(renderer.domElement);
   scene.add(new THREE.HemisphereLight(0xc9e7d0,0x263027,2.0));const key=new THREE.DirectionalLight(0xffe4c7,3.1);key.position.set(3,5,4);key.castShadow=true;scene.add(key);const rim=new THREE.DirectionalLight(0x8dbd86,2);rim.position.set(-4,2,-3);scene.add(rim);
   const floor=new THREE.Mesh(new THREE.CircleGeometry(2.5,64),new THREE.MeshStandardMaterial({color:'#202b23',roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.01;floor.receiveShadow=true;scene.add(floor);
   const grid=new THREE.GridHelper(5,20,'#49634c','#29392c');grid.position.y=.005;scene.add(grid);
   rig=makeRig(scene);controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.05,0);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=8;controls.maxPolarAngle=Math.PI*.82;
   const resize=()=>{const w=Math.max(1,el.clientWidth),h=Math.max(1,el.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
   let last=performance.now();const tick=now=>{frame=requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;if(anim.current.playing)anim.current.time+=dt*anim.current.speed*.42;poseFor(exerciseId,anim.current.time%1,rig.limbs,rig.root);controls.update();renderer.render(scene,camera);};frame=requestAnimationFrame(tick);
   return()=>{cancelAnimationFrame(frame);ro.disconnect();controls.dispose();renderer.dispose();el.removeChild(renderer.domElement);scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});};
  }catch(e){console.error('3D viewer:',e);return()=>{if(frame)cancelAnimationFrame(frame);if(renderer)renderer.dispose();};}
 },[exerciseId]);
 useEffect(()=>{anim.current.playing=playing;anim.current.speed=speed;},[playing,speed]);
 return <div className="fit8-3d-wrap"><div className="fit8-3d-canvas" ref={host}/><div className="fit8-3d-tag">INTERAKTİF 3D MODEL <span>•</span> SÜRÜKLE: DÖNDÜR · TEKERLEK: YAKINLAŞTIR</div><div className="fit8-3d-controls"><button onClick={()=>setPlaying(v=>!v)} aria-label={playing?'Duraklat':'Oynat'}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button onClick={()=>{anim.current.time=0;setPlaying(true)}} aria-label="Baştan başlat"><RotateCcw size={16}/></button><button onClick={()=>setSpeed(v=>clamp(v-.25,.5,1.5))}><Minus size={15}/></button><span>{speed.toFixed(2).replace(/0$/,'')}×</span><button onClick={()=>setSpeed(v=>clamp(v+.25,.5,1.5))}><Plus size={15}/></button></div><p className="fit8-3d-note">Eğitsel 3D hareket gösterimi. Model, gerçek kişinin birebir biyomekanik simülasyonu değildir; hareketi yavaşça öğren ve ağrı hissedersen dur.</p></div>;
}
