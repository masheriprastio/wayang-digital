class KelirScreen {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.blencong = {
      baseX: this.width * 0.5,
      baseY: this.height * 0.32,
      x: this.width * 0.5,
      y: this.height * 0.32,
      intensity: 1.0,
      radius: Math.max(this.width, this.height) * 0.85,
      time: 0
    };

    this.grainPattern = null;
    this.createMoriPattern();

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.blencong.baseX = this.width * 0.5;
    this.blencong.baseY = this.height * 0.32;
    this.blencong.radius = Math.max(this.width, this.height) * 0.88;
  }

  createMoriPattern() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 128;
    pCanvas.height = 128;
    const pCtx = pCanvas.getContext('2d');
    const imgData = pCtx.createImageData(128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = 240 + Math.floor(Math.random() * 15);
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 12;
    }
    pCtx.putImageData(imgData, 0, 0);
    this.grainPattern = this.ctx.createPattern(pCanvas, 'repeat');
  }

  update(dt = 0.016) {
    this.blencong.time += dt * 3.5;
    const t = this.blencong.time;
    const flicker1 = Math.sin(t * 1.7) * 0.04;
    const flicker2 = Math.cos(t * 3.1) * 0.03;
    const flicker3 = Math.sin(t * 7.9) * 0.02;

    this.blencong.intensity = 1.0 + flicker1 + flicker2 + flicker3;
    this.blencong.x = this.blencong.baseX + Math.sin(t * 2.3) * 6;
    this.blencong.y = this.blencong.baseY + Math.cos(t * 1.9) * 4;
  }

  drawBackground() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const grad = ctx.createRadialGradient(this.blencong.x, this.blencong.y, 10, this.blencong.x, this.blencong.y, this.blencong.radius * this.blencong.intensity);
    grad.addColorStop(0.0, "rgba(255, 246, 215, 0.98)");
    grad.addColorStop(0.25, "rgba(250, 205, 125, 0.95)");
    grad.addColorStop(0.55, "rgba(180, 110, 45, 0.85)");
    grad.addColorStop(0.85, "rgba(45, 20, 8, 0.95)");
    grad.addColorStop(1.0, "rgba(12, 6, 2, 1.0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (this.grainPattern) {
      ctx.save();
      ctx.fillStyle = this.grainPattern;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  drawGedebog() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const trunkHeight = 70;
    const topY = h - trunkHeight;

    const gGrad1 = ctx.createLinearGradient(0, topY, 0, h);
    gGrad1.addColorStop(0, "#2c1c0e");
    gGrad1.addColorStop(0.4, "#4a331c");
    gGrad1.addColorStop(0.8, "#25170c");
    gGrad1.addColorStop(1, "#120a04");

    ctx.fillStyle = gGrad1;
    ctx.fillRect(0, topY, w, trunkHeight);

    ctx.strokeStyle = "rgba(10, 5, 2, 0.6)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const yLine = topY + 15 + i * 14;
      ctx.beginPath();
      ctx.moveTo(0, yLine);
      ctx.lineTo(w, yLine);
      ctx.stroke();
    }

    ctx.fillStyle = "#1a0f07";
    ctx.fillRect(0, topY - 8, w, 8);
    ctx.fillStyle = "#8a5828";
    ctx.fillRect(0, topY - 6, w, 2);
  }

  renderScene(puppets) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawBackground();

    // Shadow Pass dengan Gaussian Blur dinamis
    puppets.forEach(puppet => {
      ctx.save();
      const blurAmount = Math.max(1, Math.round(puppet.z * 24));
      ctx.filter = `blur(${blurAmount}px)`;
      puppet.draw(ctx, true);
      ctx.restore();
    });

    // Sharp Pass jika wayang menempel dekat kelir
    puppets.forEach(puppet => {
      if (puppet.z < 0.25) {
        ctx.save();
        ctx.filter = 'none';
        ctx.globalAlpha = Math.max(0.2, (0.25 - puppet.z) / 0.25);
        puppet.draw(ctx, false);
        ctx.restore();
      }
    });

    this.drawGedebog();
  }
}

window.KelirScreen = KelirScreen;