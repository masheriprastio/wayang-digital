document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('kelir-canvas');
  const videoElement = document.getElementById('webcam-video');
  const canvasPreview = document.getElementById('pip-canvas');
  const pipContainer = document.getElementById('pip-container');

  const kelir = new KelirScreen(canvas);

  const wayangKiri = new SpriteWayangRig();
  const wayangKanan = new SpriteWayangRig();

  function getResponsiveScale() {
    const originalSpriteHeight = 1400;
    const targetHeight = window.innerHeight * 0.54; 
    return Math.max(0.25, Math.min(0.42, targetHeight / originalSpriteHeight));
  }

  // State Kedua Wayang (Perhatikan nilai flipped: Kiri TRUE, Kanan FALSE agar berhadapan muka)
  let puppetLeft = {
    id: 0,
    baseX: window.innerWidth * 0.32,
    baseY: window.innerHeight * 0.73,
    x: window.innerWidth * 0.32,
    y: window.innerHeight * 0.73,
    z: 0.12,
    scale: getResponsiveScale(),
    flipped: true, // Menghadap ke KANAN (ke arah lawannya)
    angles: { upperArm: 0.05, foreArm: -0.65, hand: -0.1 }
  };

  let puppetRight = {
    id: 1,
    baseX: window.innerWidth * 0.68,
    baseY: window.innerHeight * 0.73,
    x: window.innerWidth * 0.68,
    y: window.innerHeight * 0.73,
    z: 0.14,
    scale: getResponsiveScale(),
    flipped: false, // Menghadap ke KIRI (ke arah lawannya)
    angles: { upperArm: 0.05, foreArm: -0.65, hand: -0.1 }
  };

  let activeMousePuppet = 0; // 0 = Wayang Kiri, 1 = Wayang Kanan
  let userInteracting = false;
  let lastInteractionTime = 0;

  window.addEventListener('resize', () => {
    const s = getResponsiveScale();
    puppetLeft.scale = s;
    puppetRight.scale = s;
    puppetLeft.baseY = window.innerHeight * 0.73;
    puppetRight.baseY = window.innerHeight * 0.73;
  });

  // 1. Klik Mouse untuk Memilih Wayang Mana yang Ingin Digeser
  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#ui-overlay') || e.target.closest('.interactive-btn')) return;

    userInteracting = true;
    lastInteractionTime = performance.now();

    const distToLeft = Math.hypot(e.clientX - puppetLeft.x, e.clientY - puppetLeft.y);
    const distToRight = Math.hypot(e.clientX - puppetRight.x, e.clientY - puppetRight.y);
    activeMousePuppet = distToLeft < distToRight ? 0 : 1;

    if (window.GamelanAudio) window.GamelanAudio.playCempala();
  });

  window.addEventListener('mouseup', () => {
    userInteracting = false;
  });

  // 2. Tombol Keyboard untuk Pindah Wayang (1, 2, atau Tab)
  window.addEventListener('keydown', (e) => {
    if (e.key === '1') {
      activeMousePuppet = 0;
    } else if (e.key === '2') {
      activeMousePuppet = 1;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      activeMousePuppet = activeMousePuppet === 0 ? 1 : 0;
    } else if (e.key.toLowerCase() === 'm' && window.GamelanAudio) {
      window.GamelanAudio.toggleBGM();
    }
  });

  // 3. Kontrol Tangan / Mouse
  const tracker = new WayangTracker((data) => {
    userInteracting = true;
    lastInteractionTime = performance.now();

    const puppetIndex = tracker.isCameraRunning ? data.handIndex : activeMousePuppet;
    const target = puppetIndex === 0 ? puppetLeft : puppetRight;

    target.x = data.x;
    target.y = Math.min(window.innerHeight * 0.76, data.y);
    target.z = data.z;

    // Gerakan tuding mengubah sudut lengan secara halus
    const armPitch  = (data.tudingY + 50) * 0.007;
    const elbowBend = (data.tudingX - 40) * 0.009;

    target.angles.upperArm = Math.max(-0.6, Math.min(0.7, armPitch));
    target.angles.foreArm  = Math.max(-1.4, Math.min(-0.1, -0.65 - elbowBend));
    target.angles.hand     = Math.max(-0.4, Math.min(0.4, data.tudingX * 0.005));
  });

  // 4. Render Loop dengan Gerakan Otomatis (Idle Breathing & Natural Sway)
  function animate(now) {
    const time = now * 0.001;

    // === GERAKAN OTOMATIS SAAT TIDAK DIGERAKKAN MANUAL ===
    // 1. Napas naik-turun tubuh wayang
    const breathL = Math.sin(time * 2.0) * 4;
    const breathR = Math.sin(time * 2.0 + 1.2) * 4;

    // 2. Ayunan halus lengan seirama gamelan
    const idleUpperL = Math.sin(time * 1.6) * 0.08 + 0.04;
    const idleForeL  = Math.cos(time * 1.4) * 0.12 - 0.65;
    const idleUpperR = Math.sin(time * 1.6 + 1.2) * 0.08 + 0.04;
    const idleForeR  = Math.cos(time * 1.4 + 1.2) * 0.12 - 0.65;

    // Terapkan gerakan otomatis jika pengguna tidak sedang menggeser wayang
    if (!userInteracting && (now - lastInteractionTime > 1000)) {
      puppetLeft.y = puppetLeft.baseY + breathL;
      puppetLeft.angles.upperArm += (idleUpperL - puppetLeft.angles.upperArm) * 0.06;
      puppetLeft.angles.foreArm  += (idleForeL - puppetLeft.angles.foreArm) * 0.06;

      puppetRight.y = puppetRight.baseY + breathR;
      puppetRight.angles.upperArm += (idleUpperR - puppetRight.angles.upperArm) * 0.06;
      puppetRight.angles.foreArm  += (idleForeR - puppetRight.angles.foreArm) * 0.06;
    }

    kelir.ctx.clearRect(0, 0, kelir.width, kelir.height);
    kelir.drawBackground();

    // Render Bayangan Kelir (Kedua Wayang)
    const blurL = Math.max(1, Math.round(puppetLeft.z * 22));
    kelir.ctx.save();
    kelir.ctx.filter = `blur(${blurL}px)`;
    wayangKiri.draw(kelir.ctx, puppetLeft.x, puppetLeft.y, puppetLeft.scale, puppetLeft.angles, puppetLeft.flipped, true);
    kelir.ctx.restore();

    const blurR = Math.max(1, Math.round(puppetRight.z * 22));
    kelir.ctx.save();
    kelir.ctx.filter = `blur(${blurR}px)`;
    wayangKanan.draw(kelir.ctx, puppetRight.x, puppetRight.y, puppetRight.scale, puppetRight.angles, puppetRight.flipped, true);
    kelir.ctx.restore();

    // Render Fisik Tajam jika Wayang Mendekati Layar Kelir
    if (puppetLeft.z < 0.25) {
      kelir.ctx.save();
      kelir.ctx.globalAlpha = Math.max(0.2, (0.25 - puppetLeft.z) / 0.25);
      wayangKiri.draw(kelir.ctx, puppetLeft.x, puppetLeft.y, puppetLeft.scale, puppetLeft.angles, puppetLeft.flipped, false);
      kelir.ctx.restore();
    }
    if (puppetRight.z < 0.25) {
      kelir.ctx.save();
      kelir.ctx.globalAlpha = Math.max(0.2, (0.25 - puppetRight.z) / 0.25);
      wayangKanan.draw(kelir.ctx, puppetRight.x, puppetRight.y, puppetRight.scale, puppetRight.angles, puppetRight.flipped, false);
      kelir.ctx.restore();
    }

    // Indikator Fokus Wayang yang Aktif
    if (!tracker.isCameraRunning) {
      const activeObj = activeMousePuppet === 0 ? puppetLeft : puppetRight;
      kelir.ctx.save();
      kelir.ctx.strokeStyle = "rgba(212, 175, 55, 0.45)";
      kelir.ctx.lineWidth = 1.5;
      kelir.ctx.setLineDash([4, 6]);
      kelir.ctx.beginPath();
      kelir.ctx.arc(activeObj.x, activeObj.y - 140, 38, 0, Math.PI * 2);
      kelir.ctx.stroke();
      kelir.ctx.restore();
    }

    kelir.drawGedebog();
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});