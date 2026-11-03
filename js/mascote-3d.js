// <mascote-3d src="..." fallback="..."> — mascote em three.js que gira e anda conforme o scroll da seção pai [data-3d-track]
(function () {
  if (customElements.get('mascote-3d')) return;
  const POSES = [
    { ry: -0.5, rx: 0.05, x: 0, y: 0, s: 1 },
    { ry: 0.6, rx: 0, x: 0.15, y: 0.05, s: 1.05 },
    { ry: -1.2, rx: 0.1, x: -0.1, y: -0.05, s: 0.95 },
    { ry: 3.4, rx: -0.05, x: 0.1, y: 0.08, s: 1.1 },
    { ry: 0.2, rx: 0.15, x: -0.05, y: 0, s: 1 },
    { ry: 6.28 - 0.4, rx: 0, x: 0, y: 0.05, s: 1.08 },
  ];
  class Mascote3D extends HTMLElement {
    connectedCallback() {
      this.style.cssText += ';display:block;position:absolute;inset:0;width:100%;height:100%';
      const img = document.createElement('img');
      img.src = this.getAttribute('fallback') || '';
      img.alt = '';
      img.style.cssText = 'position:absolute;inset:8%;width:84%;height:84%;object-fit:contain;transition:opacity .4s';
      this.appendChild(img);
      this._img = img;
      this._boot().catch((e) => console.warn('mascote-3d', e));
    }
    disconnectedCallback() { this._dead = true; removeEventListener('scroll', this._onScroll); this._ro && this._ro.disconnect(); }
    async _boot() {
      const THREE = await import('https://esm.sh/three@0.160.0');
      const { GLTFLoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
      if (this._dead) return;
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      r.setPixelRatio(Math.min(devicePixelRatio, 2));
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      this.appendChild(r.domElement);
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      cam.position.set(0, 0.1, 4.2);
      scene.add(new THREE.HemisphereLight(0xfff6dd, 0x1f2a5c, 1.6));
      const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(2, 3, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0xf2c14e, 2); rim.position.set(-3, 1, -2); scene.add(rim);
      const pivot = new THREE.Group(); scene.add(pivot);
      const gltf = await new GLTFLoader().loadAsync(this.getAttribute('src'));
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      obj.position.sub(c);
      obj.scale.setScalar(2.2 / Math.max(size.x, size.y, size.z));
      obj.traverse((m) => { if (m.isMesh && m.material && !m.material.map) { m.material = new THREE.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.55 }); } });
      pivot.add(obj);
      this._img.style.opacity = '0';
      const fit = () => { const w = this.clientWidth || 1, h = this.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
      this._ro = new ResizeObserver(fit); this._ro.observe(this); fit();
      let target = 0, cur = 0;
      this._onScroll = () => {
        const track = this.closest('[data-3d-track]') || this.parentElement;
        const b = track.getBoundingClientRect(), vh = innerHeight;
        target = Math.min(1, Math.max(0, (vh * 0.5 - b.top) / Math.max(1, b.height - vh * 0.2)));
      };
      addEventListener('scroll', this._onScroll, { passive: true }); this._onScroll();
      const lerp = (a, b, t) => a + (b - a) * t;
      const t0 = performance.now();
      const loop = () => {
        if (this._dead) return;
        cur += (target - cur) * 0.08;
        const f = cur * (POSES.length - 1), i = Math.min(POSES.length - 2, Math.floor(f)), t = f - i, ease = t * t * (3 - 2 * t);
        const A = POSES[i], B = POSES[i + 1], tm = (performance.now() - t0) / 1000;
        pivot.rotation.y = lerp(A.ry, B.ry, ease) + Math.sin(tm * 0.8) * 0.06;
        pivot.rotation.x = lerp(A.rx, B.rx, ease);
        pivot.position.x = lerp(A.x, B.x, ease);
        pivot.position.y = lerp(A.y, B.y, ease) + Math.sin(tm * 1.6) * 0.04;
        pivot.scale.setScalar(lerp(A.s, B.s, ease));
        r.render(scene, cam);
        requestAnimationFrame(loop);
      };
      loop();
    }
  }
  customElements.define('mascote-3d', Mascote3D);
})();
