class SpriteWayangRig {
  constructor() {
    this.images = {};
    this.loaded = false;

    // Titik pivot engsel (anchor joints)
    this.joints = {
      anchor: { x: 345, y: 760 },
      shoulderL: { x: 247.5, y: 432.5 },
      elbowL: { x: 50, y: 180 },
      wristL: { x: 40, y: 160 }
    };

    this.loadAssets();
  }

  loadAssets() {
    const assetList = {
      body: 'assets/body.png',
      upperArm: 'assets/upper-arm-1.png',
      foreArm: 'assets/forearm-1.png',
      hand: 'assets/hand-1.png'
    };

    let count = 0;
    const total = Object.keys(assetList).length;

    for (const [key, src] of Object.entries(assetList)) {
      this.images[key] = new Image();
      this.images[key].src = src;
      this.images[key].onload = () => {
        count++;
        if (count === total) this.loaded = true;
      };
    }
  }

  draw(ctx, x, y, scale, angles, isShadow = false) {
    if (!this.loaded) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Filter siluet jika dirender sebagai bayangan di kelir
    if (isShadow) {
      ctx.filter = 'brightness(0) opacity(0.85)';
    }

    // 1. Gambar Badan Utama
    ctx.drawImage(this.images.body, -this.joints.anchor.x, -this.joints.anchor.y);

    // 2. Gambar Lengan Kiri (Hierarki Sendi: Bahu -> Siku -> Pergelangan)
    ctx.save();
    ctx.translate(this.joints.shoulderL.x - this.joints.anchor.x, 
                  this.joints.shoulderL.y - this.joints.anchor.y);
    ctx.rotate(angles.upperArm);
    ctx.drawImage(this.images.upperArm, -25, -25);

    // Siku
    ctx.translate(0, 160);
    ctx.rotate(angles.foreArm);
    ctx.drawImage(this.images.foreArm, -20, -20);

    // Tangan & Tuding
    ctx.translate(0, 140);
    ctx.rotate(angles.hand);
    ctx.drawImage(this.images.hand, -20, -20);

    ctx.restore();
    ctx.restore();
  }
}