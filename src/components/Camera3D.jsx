import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Kamera 3D RK. `progress` = ref nombor 0..1 (dari scroll hero).
 * 0   : kamera senget 3/4, terapung
 * 0.75: lensa betul-betul menghadap penonton, dekat
 */
export default function Camera3D({ progress, onReady, onFail }) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      onFail && onFail();
      return undefined;
    }
    const small = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);

    // Lampu macam studio: softbox hangat dari kiri atas, lampu tepi sejuk dari belakang
    const key = new THREE.DirectionalLight('#fff1dc', 2.6); key.position.set(-3, 4, 4); scene.add(key);
    const rim = new THREE.DirectionalLight('#cfe0ff', 2.2); rim.position.set(3.5, 1.5, -4); scene.add(rim);
    const fill = new THREE.DirectionalLight('#ffffff', 0.4); fill.position.set(2, -1, 3); scene.add(fill);

    const rig = new THREE.Group();   // pusingan ikut scroll
    const float = new THREE.Group(); // terapung + ikut tetikus
    float.add(rig); scene.add(float);

    let model = null;
    let raf = 0; let visible = true; let disposed = false;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load('/models/rk-camera.glb', (g) => {
      if (disposed) return;
      model = g.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const holder = new THREE.Group();
      holder.add(model);
      holder.scale.setScalar(2.2 / Math.max(size.x, size.y, size.z));
      holder.rotation.y = 1.0; // lensa menghadap +Z (penonton) — model asal senget ~30°
      // cari pusat muka lensa (dalam ruang holder sendiri, sebelum masuk rig)
      holder.updateMatrixWorld(true);
      const v = new THREE.Vector3();
      let maxZ = -Infinity;
      const meshes = [];
      holder.traverse((o) => { if (o.isMesh) meshes.push(o); });
      meshes.forEach((m) => {
        const pos = m.geometry.attributes.position;
        for (let i = 0; i < pos.count; i += 3) { v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld); if (v.z > maxZ) maxZ = v.z; }
      });
      let sx = 0, sy = 0, n = 0;
      meshes.forEach((m) => {
        const pos = m.geometry.attributes.position;
        for (let i = 0; i < pos.count; i += 3) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
          if (v.z > maxZ - 0.12) { sx += v.x; sy += v.y; n += 1; }
        }
      });
      if (n) { holder.position.x -= sx / n; holder.position.y -= sy / n * 0.6; }
      rig.add(holder);
      onReady && onReady();
    }, undefined, () => onFail && onFail());

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const onMove = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) loop(); });
    io.observe(el);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new THREE.Clock();
    // telefon lemah: kalau frame lambat, turunkan resolusi sekali
    let frames = 0, slow = 0, lastT = performance.now(), lowered = false;

    function loop() {
      if (!visible || disposed) { raf = 0; return; }
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      const p = clamp(progress.current || 0);
      const turn = ease(clamp(p / 0.72));

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      // pusing dari 3/4 ke menghadap depan
      rig.rotation.y = lerp(-0.75, 0, turn);
      rig.rotation.x = lerp(0.18, 0.02, turn);
      rig.rotation.z = lerp(-0.06, 0, turn);

      const idle = reduce ? 0 : 1 - turn;
      float.position.x = small ? lerp(0.22, 0, turn) : lerp(0.95, 0, turn);
      float.position.y = (small ? lerp(-0.32, 0, turn) : lerp(-0.42, 0, turn)) + Math.sin(t * 0.9) * 0.05 * idle;
      float.rotation.y = pointer.x * 0.18 * (1 - turn * 0.7);
      float.rotation.x = pointer.y * 0.1 * (1 - turn * 0.7);

      // dolly masuk ke lensa
      const zoom = ease(clamp((p - 0.25) / 0.6));
      const baseZ = small ? 10.8 : 6.2;
      cam.position.set(0, lerp(0.15, 0, turn), lerp(baseZ, small ? 3.6 : 2.9, zoom));
      cam.lookAt(0, 0, 0);
      key.intensity = 2.6 + zoom * 0.8;

      renderer.render(scene, cam);
      if (!lowered) {
        const now = performance.now();
        if (now - lastT > 45) slow += 1;
        lastT = now; frames += 1;
        if (frames === 90) {
          if (slow > 45) { renderer.setPixelRatio(1); resize(); }
          lowered = true;
        }
      }
    }
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      renderer.dispose(); pmrem.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); });
      });
      el.innerHTML = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} className="cam3d" aria-hidden="true" />;
}
