class SpriteWayangRig {
  constructor() {
    this.images = {};
    this.loaded = false;

    // Titik engsel presisi sesuai anatomi potongan PNG fisik
    this.joints = {
      anchor: { x: 345, y: 760 },        // Poros tengah badan wayang
      shoulderL: { x: 247.5, y: 432.5 }, // Bahu kiri (titik ikat badan)
      shoulderR: { x: 442.5, y: 432.5 }, // Bahu kanan

      // Titik lubang engsel pada masing-masing potongan gambar PNG
      upperArm: {
        pivot: { x: 48, y: 45 },    // Lubang engsel bahu (pangkal atas)
        elbow: { x: 44, y: 245 }     // Lubang engsel siku (ujung bawah)
      },
      foreArm: {
        pivot: { x: 42, y: 38 },    // Lubang engsel siku (pangkal atas)
        wrist: { x: 38, y: 215 }     // Lubang engsel pergelangan tangan (ujung bawah)
      },
      hand: {
        pivot: { x: 35, y: 32 }     // Lubang engsel pergelangan pada tangan & tuding
      }
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

  // Fungsi menggambar satu rantai lengan (Bahu -> Siku -> Pergelangan/Tuding)
  drawArmChain(ctx, shoulderJoint, angles) {
    ctx.save();
    // 1. Pindah ke titik lubang bahu pada badan
    ctx.translate(shoulderJoint.x - this.joints.anchor.x, shoulderJoint.y - this.joints.anchor.y);
    ctx.rotate(angles.upperArm);
    ctx.drawImage(this.images.upperArm, -this.joints.upperArm.pivot.x, -this.joints.upperArm.pivot.y);

    // 2. Pindah ke titik lubang siku tepat di ujung lengan atas
    const elbowOffsetX = this.joints.upperArm.elbow.x - this.joints.upperArm.pivot.x;
    const elbowOffsetY = this.joints.upperArm.elbow.y - this.joints.upperArm.pivot.y;
    ctx.translate(elbowOffsetX, elbowOffsetY);
    ctx.rotate(angles.foreArm);
    ctx.drawImage(this.images.foreArm, -this.joints.foreArm.pivot.x, -this.joints.foreArm.pivot.y);

    // 3. Pindah ke titik lubang pergelangan tepat di ujung lengan depan
    const wristOffsetX = this.joints.foreArm.wrist.x - this.joints.foreArm.pivot.x;
    const wristOffsetY = this.joints.foreArm.wrist.y - this.joints.foreArm.pivot.y;
    ctx.translate(wristOffsetX, wristOffsetY);
    ctx.rotate(angles.hand);
    ctx.drawImage(this.images.hand, -this.joints.hand.pivot.x, -this.joints.hand.pivot.y);

    ctx.restore();
  }

  draw(ctx, x, y, scale, angles, isFlipped = false, isShadow = false) {
    if (!this.loaded) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(isFlipped ? -scale : scale, scale);

    if (isShadow) {
      ctx.filter = 'brightness(0) opacity(0.85)';
    }

    // A. Gambar Lengan Belakang (Sisi kanan wayang)
    const backArmAngles = {
      upperArm: angles.upperArm * 0.7 - 0.25,
      foreArm: angles.foreArm * 0.8 + 0.35,
      hand: angles.hand * 0.8
    };
    this.drawArmChain(ctx, this.joints.shoulderR, backArmAngles);

    // B. Gambar Badan Utama
    ctx.drawImage(this.images.body, -this.joints.anchor.x, -this.joints.anchor.y);

    // C. Gambar Lengan Depan (Sisi kiri wayang - Lengan Utama)
    this.drawArmChain(ctx, this.joints.shoulderL, angles);

    ctx.restore();
  }
}