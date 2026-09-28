class SpriteWayangRig {
  constructor() {
    this.images = {};
    this.loaded = false;

    // Koordinat titik engsel presisi sesuai resolusi asli gambar PNG (1400px)
    this.joints = {
      anchor: { x: 345, y: 760 },        // Poros tengah badan wayang
      shoulderL: { x: 247.5, y: 432.5 }, // Bahu kiri (titik engsel asli)
      shoulderR: { x: 442.5, y: 432.5 }, // Bahu kanan
      pivotUpperArm: { x: 35, y: 35 },   // Lubang engsel atas pada upper-arm.png
      pivotForeArm: { x: 28, y: 28 },    // Lubang engsel siku pada forearm.png
      pivotHand: { x: 26, y: 26 },       // Lubang engsel pergelangan pada hand.png
      upperArmLength: 250,               // Panjang lengan atas (skala asli PNG)
      foreArmLength: 225                 // Panjang lengan depan (skala asli PNG)
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
      this.images[key].onerror = () => {
        count++;
        if (count === total) this.loaded = true;
      };
    }
  }

  draw(ctx, x, y, scale, angles, isFlipped = false, isShadow = false) {
    if (!this.loaded) return;

    ctx.save();
    ctx.translate(x, y);
    // Skala wayang (dan flip horizontal jika saling berhadapan)
    ctx.scale(isFlipped ? -scale : scale, scale);

    // Filter siluet bayangan kelir
    if (isShadow) {
      ctx.filter = 'brightness(0) opacity(0.85)';
    }

    // 1. Gambar Lengan Belakang (Lengan Kanan)
    ctx.save();
    ctx.translate(this.joints.shoulderR.x - this.joints.anchor.x, this.joints.shoulderR.y - this.joints.anchor.y);
    ctx.rotate(angles.upperArm * 0.8 - 0.2);
    ctx.drawImage(this.images.upperArm, -this.joints.pivotUpperArm.x, -this.joints.pivotUpperArm.y);

    ctx.translate(0, this.joints.upperArmLength);
    ctx.rotate(angles.foreArm * 0.8 + 0.3);
    ctx.drawImage(this.images.foreArm, -this.joints.pivotForeArm.x, -this.joints.pivotForeArm.y);

    ctx.translate(0, this.joints.foreArmLength);
    ctx.rotate(angles.hand);
    ctx.drawImage(this.images.hand, -this.joints.pivotHand.x, -this.joints.pivotHand.y);
    ctx.restore();

    // 2. Gambar Badan Utama & Gapit Tengah
    ctx.drawImage(this.images.body, -this.joints.anchor.x, -this.joints.anchor.y);

    // 3. Gambar Lengan Depan (Lengan Kiri Utama)
    ctx.save();
    ctx.translate(this.joints.shoulderL.x - this.joints.anchor.x, this.joints.shoulderL.y - this.joints.anchor.y);
    ctx.rotate(angles.upperArm);
    ctx.drawImage(this.images.upperArm, -this.joints.pivotUpperArm.x, -this.joints.pivotUpperArm.y);

    ctx.translate(0, this.joints.upperArmLength);
    ctx.rotate(angles.foreArm);
    ctx.drawImage(this.images.foreArm, -this.joints.pivotForeArm.x, -this.joints.pivotForeArm.y);

    ctx.translate(0, this.joints.foreArmLength);
    ctx.rotate(angles.hand);
    ctx.drawImage(this.images.hand, -this.joints.pivotHand.x, -this.joints.pivotHand.y);
    ctx.restore();

    ctx.restore();
  }
}