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
    return Math.max(0.24, Math.min(0.42, targetHeight / originalSpriteHeight));
  }

  // State Wayang Kiri (Arjuna) & Kanan (Karna)
  let puppetLeft = {
    id: 0,
    name: "Wayang Kiri (Arjuna)",
    x: window.innerWidth * 0.32,
    y: window.innerHeight * 0.73,
    z: 0.12,
    scale: getResponsiveScale(),
    flipped: false,
    angles: { upperArm: 0.2, foreArm: 0.6, hand: 0.1 }
  };

  let puppetRight = {
    id: 1,
    name: "Wayang Kanan (Karna)",
    x: window.innerWidth * 0.68,
    y: window.innerHeight * 0.73,
    z: 0.14,
    scale: getResponsiveScale(),
    flipped: true,
    angles: { upperArm: -0.2, foreArm: 0.6, hand: -0.1 }
  };

  // Indikator wayang yang sedang aktif dikontrol oleh mouse (0 = Kiri, 1 = Kanan)
  let activeMousePuppet = 0;

  window.addEventListener('resize', () => {
    const s = getResponsiveScale();
    puppetLeft.scale = s;
    puppetRight.scale = s;
    puppetLeft.y = window.innerHeight * 0.73;
    puppetRight.y = window.innerHeight * 0.73;
  });

  // 1. Logika Klik Mouse untuk Memilih Wayang Mana yang Ingin Digeser
  window.addEventListener('mousedown', (e) => {
    if (e.target.closest('#ui-overlay') || e.target.closest('.interactive-btn')) return;

    // Hitung jarak klik mouse ke masing-masing wayang
    const distToLeft = Math.hypot(e.clientX - puppetLeft.x, e.clientY - puppetLeft.y);
    const distToRight = Math.hypot(e.clientX - puppetRight.x, e.clientY - puppetRight.y);

    // Otomatis pilih wayang yang posisinya paling dekat dengan kursor klik
    activeMousePuppet = distToLeft < distToRight ? 0 : 1;

    if (window.GamelanAudio) window.GamelanAudio.playCempala();
  });

  // 2. Shortcut Keyboard untuk Pindah Kontrol Antar Wayang
  window.addEventListener('keydown', (e) => {
    if (e.key === '1') {
      activeMousePuppet = 0; // Pilih Wayang Kiri
    } else if (e.key === '2') {
      activeMousePuppet = 1; // Pilih Wayang Kanan
    } else if (e.key === 'Tab') {
      e.preventDefault();
      activeMousePuppet = activeMousePuppet === 0 ? 1 : 0; // Toggle Kiri <-> Kanan
    } else if (e.key.toLowerCase() === 'm' && window.GamelanAudio) {
      window.GamelanAudio.toggleBGM();
    }
  });

  // 3. Hubungkan Input Tangan (Webcam atau Mouse)
  const tracker = new WayangTracker((data) => {
    // Jika data berasal dari webcam dual-hand, gunakan handIndex. Jika mouse, gunakan activeMousePuppet.
    const puppetIndex = tracker.isCameraRunning ? data.handIndex : activeMousePuppet;
    const target = puppetIndex === 0 ? puppetLeft : puppetRight;

    target.x = data.x;
    target.y = Math.min(window.innerHeight * 0.76, data.y);
    target.z = data.z;

    // Batasi sudut siku (upperArm & foreArm) agar menekuk natural dan tidak terbalik
    const rawUpper = (data.tudingY + 50) * 0.007;
    const rawFore  = (data.tudingX - 40) * 0.010;

    target.angles.upperArm = Math.max(-0.9, Math.min(0.9, rawUpper));
    target.angles.foreArm  = Math.max(0.1,  Math.min(1.8, rawFore + 0.6));
    target.angles.hand     = Math.max(-0.6, Math.min(0.6, data.tudingX * 0.006));
  });

  // 4. Render Loop
  function animate() {
    kelir.ctx.clearRect(0, 0, kelir.width, kelir.height);
    kelir.drawBackground();

    // Render Bayangan Kelir
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

    // Render Fisik Tajam jika Wayang Mendekat ke Layar Kelir
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

    // Indikator Titik Fokus Kontrol Mouse (Garis Lingkaran Halus Emas pada Wayang yang Dipilih)
    if (!tracker.isCameraRunning) {
      const activeObj = activeMousePuppet === 0 ? puppetLeft : puppetRight;
      kelir.ctx.save();
      kelir.ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
      kelir.ctx.lineWidth = 1.5;
      kelir.ctx.setLineDash([4, 6]);
      kelir.ctx.beginPath();
      kelir.ctx.arc(activeObj.x, activeObj.y - 120, 36, 0, Math.PI * 2);
      kelir.ctx.stroke();
      kelir.ctx.restore();
    }

    kelir.drawGedebog();
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});