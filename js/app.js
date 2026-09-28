document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('kelir-canvas');
  const videoElement = document.getElementById('webcam-video');
  const canvasPreview = document.getElementById('pip-canvas');
  const pipContainer = document.getElementById('pip-container');

  const kelir = new KelirScreen(canvas);

  const wayangKiri = new SpriteWayangRig();
  const wayangKanan = new SpriteWayangRig();

  // Fungsi penghitung skala proporsional (tinggi wayang = ~55% tinggi layar monitor)
  function getResponsiveScale() {
    const originalSpriteHeight = 1400; // Tinggi asli gambar PNG
    const targetHeight = window.innerHeight * 0.55; 
    return Math.max(0.25, Math.min(0.48, targetHeight / originalSpriteHeight));
  }

  // State Posisi Dua Wayang
  let puppetLeft = {
    x: window.innerWidth * 0.35,
    y: window.innerHeight * 0.72, // Posisi berdiri pas di atas gedebog
    z: 0.12,
    scale: getResponsiveScale(),
    flipped: false,
    angles: { upperArm: 0.3, foreArm: 0.6, hand: 0.2 }
  };

  let puppetRight = {
    x: window.innerWidth * 0.65,
    y: window.innerHeight * 0.72,
    z: 0.14,
    scale: getResponsiveScale(),
    flipped: true, // Berhadapan ke kiri
    angles: { upperArm: -0.3, foreArm: -0.6, hand: -0.2 }
  };

  // Update ukuran otomatis saat jendela browser di-resize
  window.addEventListener('resize', () => {
    const newScale = getResponsiveScale();
    puppetLeft.scale = newScale;
    puppetRight.scale = newScale;
    puppetLeft.y = window.innerHeight * 0.72;
    puppetRight.y = window.innerHeight * 0.72;
  });

  // Hubungkan input tangan (Webcam / Mouse)
  const tracker = new WayangTracker((data) => {
    const target = data.handIndex === 0 ? puppetLeft : puppetRight;
    target.x = data.x;
    // Pertahankan ketinggian agar tetap menancap di batang pisang
    target.y = Math.min(window.innerHeight * 0.76, data.y);
    target.z = data.z;

    target.angles.upperArm = (data.tudingY + 50) * 0.008;
    target.angles.foreArm  = (data.tudingX - 40) * 0.012;
    target.angles.hand     = data.tudingX * 0.008;
  });

  // Render Loop
  function animate() {
    kelir.ctx.clearRect(0, 0, kelir.width, kelir.height);
    kelir.drawBackground();

    // 1. Render Bayangan Kelir (Kedua Wayang)
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

    // 2. Render Fisik Tajam (Saat Wayang Menempel ke Kelir)
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

    kelir.drawGedebog();
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});