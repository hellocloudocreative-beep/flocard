/* ==========================================================================
   FLOCARD COSMIC 3D HERO CANVAS
   Cinematic WebGL cosmic environment with floating irregular rocky asteroids,
   drifting 3D luxury black-and-purple NFC business cards, glowing planetary
   ring system, layered starfield particles, and smooth mouse/scroll parallax.
   ========================================================================== */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CosmicHeroCanvas({ isLight = false }) {
  const containerRef = useRef(null);
  const animFrameId = useRef(null);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isLight ? 0xF5F3FF : 0x07040D, 0.016);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 150);
    camera.position.set(0, 0, 24);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.15 : 1.35;
    container.appendChild(renderer.domElement);

    // =========================================================================
    // LIGHTING SYSTEM (Cinematic 3-Point Studio Cosmic Lighting)
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(isLight ? 0xE9D5FF : 0x1E1033, 1.8);
    scene.add(ambientLight);

    // Primary violet rim light from planet coordinates
    const planetRimLight = new THREE.DirectionalLight(0xA855F7, 3.2);
    planetRimLight.position.set(22, 16, -20);
    scene.add(planetRimLight);

    // Front soft illumination key light
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    keyLight.position.set(-15, 12, 18);
    scene.add(keyLight);

    // Subtle cyan/blue fill light for dimensional edge definition
    const fillLight = new THREE.PointLight(0x7C3AED, 2.5, 45);
    fillLight.position.set(-12, -8, 8);
    scene.add(fillLight);

    // =========================================================================
    // BACKGROUND GLOWING PLANET & PLANETARY RING
    // =========================================================================
    const planetGroup = new THREE.Group();
    planetGroup.position.set(16, 8, -48);
    scene.add(planetGroup);

    // Planet Sphere (deep obsidian violet sphere)
    const planetGeom = new THREE.SphereGeometry(8.5, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x130A24,
      roughness: 0.8,
      metalness: 0.2
    });
    const planetMesh = new THREE.Mesh(planetGeom, planetMat);
    planetGroup.add(planetMesh);

    // Planet Atmosphere Rim Glow
    const atmosGeom = new THREE.SphereGeometry(8.75, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x9333EA,
      transparent: true,
      opacity: isLight ? 0.25 : 0.45,
      side: THREE.BackSide
    });
    const atmosMesh = new THREE.Mesh(atmosGeom, atmosMat);
    planetGroup.add(atmosMesh);

    // Glowing Planetary Ring
    const ringInner = 11.2;
    const ringOuter = 19.5;
    const ringGeom = new THREE.RingGeometry(ringInner, ringOuter, 64);

    // Procedural ring alpha texture with concentric grooves
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512;
    ringCanvas.height = 32;
    const rCtx = ringCanvas.getContext('2d');
    const rGrad = rCtx.createLinearGradient(0, 0, 512, 0);
    rGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
    rGrad.addColorStop(0.12, 'rgba(168, 85, 247, 0.4)');
    rGrad.addColorStop(0.3, 'rgba(216, 180, 254, 0.7)');
    rGrad.addColorStop(0.48, 'rgba(107, 0, 255, 0.2)');
    rGrad.addColorStop(0.65, 'rgba(192, 132, 252, 0.85)');
    rGrad.addColorStop(0.85, 'rgba(147, 51, 234, 0.4)');
    rGrad.addColorStop(1, 'rgba(107, 0, 255, 0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(0, 0, 512, 32);

    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isLight ? 0.55 : 0.85,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI * 0.42;
    ringMesh.rotation.y = -Math.PI * 0.12;
    planetGroup.add(ringMesh);

    // =========================================================================
    // LAYERED COSMIC STARFIELD & PARTICLES
    // =========================================================================
    const starCount = 850;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0xFFFFFF),
      new THREE.Color(0xE9D5FF),
      new THREE.Color(0xC084FC),
      new THREE.Color(0xA855F7),
      new THREE.Color(0x818CF8)
    ];

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      starPositions[idx] = (Math.random() - 0.5) * 85;
      starPositions[idx + 1] = (Math.random() - 0.5) * 60;
      starPositions[idx + 2] = -10 - Math.random() * 55;

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[idx] = col.r;
      starColors[idx + 1] = col.g;
      starColors[idx + 2] = col.b;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: isLight ? 0.6 : 0.85
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // =========================================================================
    // PROCEDURAL PROCEDURAL NFC BUSINESS CARD TEXTURE
    // =========================================================================
    function createCardFaceTexture(isBack = false) {
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 400;
      const ctx = c.getContext('2d');

      // Deep Obsidian base with ultraviolet radial sheen
      const bg = ctx.createRadialGradient(320, 200, 20, 320, 200, 420);
      bg.addColorStop(0, '#221138');
      bg.addColorStop(0.5, '#120A20');
      bg.addColorStop(1, '#08050E');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 640, 400);

      // Fine precision border inset
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(18, 18, 604, 364);

      if (!isBack) {
        // FRONT: Gold/Violet laser branding & Contactless Icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Sora", sans-serif';
        ctx.letterSpacing = '5px';
        ctx.fillText('FLOCARD', 46, 78);

        ctx.fillStyle = '#C084FC';
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('SMART NFC IDENTITY', 46, 104);

        // Contactless NFC Radiating Waves Icon
        ctx.strokeStyle = '#D8B4FE';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(560, 64, 10, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(560, 64, 18, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(560, 64, 26, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();

        // Metallic Microchip Decal
        ctx.fillStyle = '#D4AF37';
        ctx.fillRect(48, 160, 64, 52);
        ctx.strokeStyle = '#996515';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(48, 160, 64, 52);
        ctx.strokeRect(62, 160, 36, 52);
        ctx.strokeRect(48, 178, 64, 16);

        // Holographic Executive Label
        ctx.fillStyle = '#F4F4F5';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('EXECUTIVE EDITION', 48, 335);

        ctx.fillStyle = 'rgba(216, 180, 254, 0.65)';
        ctx.font = '13px monospace';
        ctx.fillText('NFC-216 • HIGH FREQ 13.56MHz', 48, 356);
      } else {
        // BACK: Magnetic Stripe & QR Grid Silhouette
        ctx.fillStyle = '#050308';
        ctx.fillRect(0, 48, 640, 65);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText('FLOCARD', 46, 170);

        ctx.fillStyle = '#A855F7';
        ctx.font = '13px monospace';
        ctx.fillText('ONE TAP. EVERY CONNECTION.', 46, 195);

        // Dynamic QR code box placeholder
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.fillRect(490, 240, 110, 110);
        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 2;
        ctx.strokeRect(490, 240, 110, 110);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '11px monospace';
        ctx.fillText('DYNAMIC QR', 506, 300);
      }

      return new THREE.CanvasTexture(c);
    }

    const frontTexture = createCardFaceTexture(false);
    const backTexture = createCardFaceTexture(true);

    // Card Side/Rim Metallic Material (reflects purple/white specular gleams)
    const cardEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x9333EA,
      metalness: 0.95,
      roughness: 0.18,
      emissive: 0x3B0764,
      emissiveIntensity: 0.35
    });

    const cardFrontMat = new THREE.MeshStandardMaterial({
      map: frontTexture,
      metalness: 0.65,
      roughness: 0.32
    });

    const cardBackMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      metalness: 0.65,
      roughness: 0.32
    });

    // Materials array for BoxGeometry: [right, left, top, bottom, front, back]
    const cardMaterials = [
      cardEdgeMat,
      cardEdgeMat,
      cardEdgeMat,
      cardEdgeMat,
      cardFrontMat,
      cardBackMat
    ];

    // Standard ID-1 Credit Card Aspect Ratio (85.6mm x 53.98mm = 3.37 x 2.125)
    const cardGeom = new THREE.BoxGeometry(3.37, 2.125, 0.05);

    // =========================================================================
    // SPAWN 5 FLOATING 3D NFC CARDS
    // =========================================================================
    const cardConfigs = [
      // Left foreground card
      {
        pos: [-11.5, 3.2, 5.0],
        rot: [0.35, 0.65, -0.2],
        scale: 1.05,
        rotSpeed: [0.003, 0.005, 0.002],
        floatPhase: 0.0,
        floatSpeed: 0.8,
        floatAmp: 0.35
      },
      // Right midground card
      {
        pos: [12.0, -1.8, 1.5],
        rot: [-0.25, -0.45, 0.18],
        scale: 0.95,
        rotSpeed: [-0.0025, 0.004, -0.002],
        floatPhase: 2.1,
        floatSpeed: 0.9,
        floatAmp: 0.4
      },
      // Deep left midground card
      {
        pos: [-14.5, -4.5, -9.0],
        rot: [0.4, -0.3, 0.3],
        scale: 0.8,
        rotSpeed: [0.002, -0.003, 0.0015],
        floatPhase: 4.2,
        floatSpeed: 0.7,
        floatAmp: 0.3
      },
      // Distant upper-center floating card
      {
        pos: [6.5, 7.5, -16.0],
        rot: [-0.4, 0.5, -0.15],
        scale: 0.65,
        rotSpeed: [0.0018, 0.0035, -0.001],
        floatPhase: 1.2,
        floatSpeed: 0.65,
        floatAmp: 0.25
      },
      // Bottom foreground dramatic accent card
      {
        pos: [-5.0, -8.2, 7.0],
        rot: [0.2, 0.25, -0.35],
        scale: 1.15,
        rotSpeed: [-0.003, 0.004, 0.0025],
        floatPhase: 3.5,
        floatSpeed: 1.0,
        floatAmp: 0.45
      }
    ];

    const cards = cardConfigs.map(cfg => {
      const mesh = new THREE.Mesh(cardGeom, cardMaterials);
      mesh.position.set(...cfg.pos);
      mesh.rotation.set(...cfg.rot);
      mesh.scale.setScalar(cfg.scale);
      scene.add(mesh);
      return {
        mesh,
        basePos: [...cfg.pos],
        cfg
      };
    });

    // =========================================================================
    // REALISTIC ROCKY ASTEROIDS (Deformed Organic Polygons)
    // =========================================================================
    function createAsteroidGeometry(radius = 1) {
      const geom = new THREE.DodecahedronGeometry(radius, 2);
      const posAttr = geom.attributes.position;
      const vertex = new THREE.Vector3();

      // Perturb vertices with deterministic noise to create rocky crags and craters
      for (let i = 0; i < posAttr.count; i++) {
        vertex.fromBufferAttribute(posAttr, i);
        const noise =
          Math.sin(vertex.x * 2.5) * Math.cos(vertex.y * 2.5) * Math.sin(vertex.z * 2.5) * 0.24 +
          Math.sin(vertex.x * 5.0) * 0.08;
        vertex.multiplyScalar(1 + noise);
        posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      geom.computeVertexNormals();
      return geom;
    }

    const asteroidMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x645B7A : 0x241C33,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true
    });

    const asteroidConfigs = [
      // Foreground large left asteroid
      { pos: [-13.5, 6.5, 4.0], scale: 1.6, rotSpeed: [0.004, 0.006, 0.002], driftV: [0.001, -0.0015], parallax: 1.4 },
      // Foreground right asteroid
      { pos: [14.0, 5.0, 3.0], scale: 1.25, rotSpeed: [-0.005, 0.003, -0.003], driftV: [-0.0012, 0.001], parallax: 1.3 },
      // Midground left asteroid
      { pos: [-16.0, -2.5, -6.0], scale: 2.1, rotSpeed: [0.002, 0.004, 0.001], driftV: [0.0008, 0.0008], parallax: 0.9 },
      // Midground upper center asteroid
      { pos: [-3.0, 9.5, -8.0], scale: 1.4, rotSpeed: [-0.003, 0.002, 0.004], driftV: [-0.0006, -0.0009], parallax: 0.85 },
      // Midground right floating asteroid
      { pos: [11.5, -6.5, -5.0], scale: 1.8, rotSpeed: [0.003, -0.004, 0.002], driftV: [0.0009, 0.0006], parallax: 0.95 },
      // Distant deep asteroids
      { pos: [7.0, -3.0, -22.0], scale: 2.8, rotSpeed: [0.0015, 0.002, -0.001], driftV: [-0.0005, 0.0004], parallax: 0.5 },
      { pos: [-8.0, 4.0, -28.0], scale: 3.2, rotSpeed: [-0.001, 0.0015, 0.001], driftV: [0.0004, -0.0003], parallax: 0.4 },
      { pos: [18.5, 12.0, -20.0], scale: 1.9, rotSpeed: [0.002, -0.002, 0.003], driftV: [-0.0007, -0.0005], parallax: 0.6 },
      // Smaller tumbling meteor rocks
      { pos: [-8.5, -7.0, 2.0], scale: 0.7, rotSpeed: [0.012, 0.008, 0.006], driftV: [0.002, 0.0015], parallax: 1.2 },
      { pos: [8.5, 8.0, 0.5], scale: 0.85, rotSpeed: [-0.009, -0.01, 0.005], driftV: [-0.0018, -0.001], parallax: 1.15 }
    ];

    const asteroids = asteroidConfigs.map(cfg => {
      const geom = createAsteroidGeometry(cfg.scale);
      const mesh = new THREE.Mesh(geom, asteroidMat);
      mesh.position.set(...cfg.pos);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(mesh);
      return {
        mesh,
        basePos: [...cfg.pos],
        cfg
      };
    });

    // =========================================================================
    // PARALLAX & MOUSE INTERACTION
    // =========================================================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let scrollY = window.scrollY || 0;

    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollY = window.scrollY || 0;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // IntersectionObserver to pause rendering when scrolled past hero
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });

    observer.observe(container);

    // =========================================================================
    // ANIMATION LOOP (Optimized 60fps Product Cinematography)
    // =========================================================================
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      if (!isVisibleRef.current) return;

      const elapsedTime = clock.getElapsedTime();
      const motionMultiplier = prefersReducedMotion ? 0.2 : 1.0;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      // Camera parallax
      const scrollOffset = scrollY * 0.008;
      camera.position.x = mouse.x * 2.2;
      camera.position.y = -mouse.y * 1.5 - scrollOffset;
      camera.lookAt(0, -scrollOffset * 0.5, 0);

      // Rotate and drift planet ring
      planetGroup.rotation.y = elapsedTime * 0.025 * motionMultiplier;
      ringMesh.rotation.z = elapsedTime * 0.04 * motionMultiplier;

      // Animate NFC Business Cards
      cards.forEach((item, idx) => {
        const { mesh, basePos, cfg } = item;
        const speedFactor = motionMultiplier;

        // Gentle rotational tumbling
        mesh.rotation.x += cfg.rotSpeed[0] * speedFactor;
        mesh.rotation.y += cfg.rotSpeed[1] * speedFactor;
        mesh.rotation.z += cfg.rotSpeed[2] * speedFactor;

        // Sinusoidal floating drift
        const bob = Math.sin(elapsedTime * cfg.floatSpeed + cfg.floatPhase) * cfg.floatAmp;
        mesh.position.y = basePos[1] + bob - scrollOffset * 0.6;
        mesh.position.x = basePos[0] + mouse.x * 0.8;
      });

      // Animate Asteroids
      asteroids.forEach(item => {
        const { mesh, basePos, cfg } = item;
        const speedFactor = motionMultiplier;

        // Realistic tumbling rotation
        mesh.rotation.x += cfg.rotSpeed[0] * speedFactor;
        mesh.rotation.y += cfg.rotSpeed[1] * speedFactor;
        mesh.rotation.z += cfg.rotSpeed[2] * speedFactor;

        // Layered scroll parallax (foreground moves faster)
        mesh.position.y = basePos[1] - scrollOffset * cfg.parallax + Math.sin(elapsedTime * 0.6 + basePos[0]) * 0.2;
        mesh.position.x = basePos[0] + mouse.x * cfg.parallax * 0.6;
      });

      // Subtle starfield twinkling
      starField.rotation.y = elapsedTime * 0.004 * motionMultiplier;

      renderer.render(scene, camera);
    };

    animFrameId.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose resources
      renderer.dispose();
      planetGeom.dispose();
      planetMat.dispose();
      atmosGeom.dispose();
      atmosMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      ringTexture.dispose();
      starGeom.dispose();
      starMat.dispose();
      cardGeom.dispose();
      cardEdgeMat.dispose();
      cardFrontMat.dispose();
      cardBackMat.dispose();
      frontTexture.dispose();
      backTexture.dispose();
      asteroidMat.dispose();
    };
  }, [isLight]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    />
  );
}
