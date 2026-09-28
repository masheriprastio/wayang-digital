document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('kelir-canvas');
  const videoElement = document.getElementById('webcam-video');
  const canvasPreview = document.getElementById('pip-canvas');
  const pipContainer = document.getElementById('pip-container');
  const uiOverlay = document.getElementById('ui-overlay');

  // Inisialisasi Layar Kelir
  const kelir = new KelirScreen(canvas);

  // Inisialisasi Wayang berbasis Potongan PNG
  const wayangRig = new SpriteWayangRig();

  // State posisi wayang
  let puppetState = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.65,
    z: 0.12,
    scale: 0.85,
    angles: {
      upperArm: 0.4,
      foreArm: 0.8,
      hand: 0.2
    }
  };

  // Hubungkan input tangan dari Tracker (Webcam / Mouse)
  const tracker = new WayangTracker((data) => {
    puppetState.x = data.x;
    puppetState.y = data.y;
    puppetState.z = data.z;
    
    // Konversi pergerakan tuding ke sudut rotasi sendi lengan
    puppetState.angles.upperArm = (data.tudingY + 50) * 0.01;
    puppetState.angles.foreArm  = (data.tudingX - 40) * 0.015;
    puppetState.angles.hand     = (data.tudingX * 0.01);
  });

  // Main Render Loop
  function animate() {
    kelir.ctx.clearRect(0, 0, kelir.width, kelir.height);
    kelir.drawBackground();

    // Gambar bayangan lembut wayang pada kelir
    const blurAmount = Math.max(1, Math.round(puppetState.z * 22));
    kelir.ctx.save();
    kelir.ctx.filter = `blur(${blurAmount}px)`;
    wayangRig.draw(kelir.ctx, puppetState.x, puppetState.y, puppetState.scale, puppetState.angles, true);
    kelir.ctx.restore();

    // Jika wayang mendekat ke kelir, gambar siluet fisiknya lebih tajam
    if (puppetState.z < 0.25) {
      kelir.ctx.save();
      kelir.ctx.globalAlpha = Math.max(0.2, (0.25 - puppetState.z) / 0.25);
      wayangRig.draw(kelir.ctx, puppetState.x, puppetState.y, puppetState.scale, puppetState.angles, false);
      kelir.ctx.restore();
    }

    kelir.drawGedebog();
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});