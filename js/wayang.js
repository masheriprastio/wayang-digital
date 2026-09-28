class WayangPuppet {
  constructor(options = {}) {
    this.name = options.name || "Raden Arjuna";
    this.x = options.x || window.innerWidth * 0.5;
    this.y = options.y || window.innerHeight * 0.65;
    this.z = options.z || 0.15;
    this.scale = options.scale || 1.0;
    this.flipped = options.flipped || false;
    this.tilt = options.tilt || 0;

    this.upperArmLength = 65;
    this.forearmLength = 55;

    this.shoulderFront = { x: 10, y: -95 };
    this.shoulderBack  = { x: -8, y: -90 };

    this.handTargetFront = { x: 45, y: -50 };
    this.handTargetBack  = { x: -25, y: -45 };

    this.armFront = { angle1: 0.6, angle2: 1.1 };
    this.armBack  = { angle1: -0.4, angle2: 0.9 };

    this.isDancing = false;
    this.danceTimer = 0;
    this.danceDuration = 2.4;
  }

  solveTwoBoneIK(shoulder, target, l1, l2, bendRight = true) {
    const dx = target.x - shoulder.x;
    const dy = target.y - shoulder.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    const maxReach = (l1 + l2) * 0.999;
    const minReach = Math.abs(l1 - l2) * 1.05;
    dist = Math.max(minReach, Math.min(maxReach, dist));

    const alpha = Math.atan2(dy, dx);
    const cosAngle1 = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
    const angle1Offset = Math.acos(Math.max(-1, Math.min(1, cosAngle1)));
    const theta1 = bendRight ? (alpha - angle1Offset) : (alpha + angle1Offset);

    const cosAngle2 = (l1 * l1 + l2 * l2 - dist * dist) / (2 * l1 * l2);
    const angle2Internal = Math.acos(Math.max(-1, Math.min(1, cosAngle2)));
    const theta2 = bendRight ? (Math.PI - angle2Internal) : -(Math.PI - angle2Internal);

    return { theta1, theta2 };
  }

  triggerKiprahan() {
    this.isDancing = true;
    this.danceTimer = 0;
    if (window.GamelanAudio) {
      window.GamelanAudio.playCempala();
      window.GamelanAudio.playGamelanNote(5, 1.2, 0.4);
    }
  }

  update(dt = 0.016) {
    if (this.isDancing) {
      this.danceTimer += dt;
      if (this.danceTimer >= this.danceDuration) {
        this.isDancing = false;
        this.danceTimer = 0;
      } else {
        const bounce = Math.sin(this.danceTimer * 12) * 18;
        const wave = Math.cos(this.danceTimer * 8);
        this.handTargetFront.x = 40 + wave * 35;
        this.handTargetFront.y = -60 + bounce * 0.8;
        this.handTargetBack.x = -30 - wave * 30;
        this.handTargetBack.y = -50 - bounce * 0.5;
        this.tilt = Math.sin(this.danceTimer * 6) * 0.15;
      }
    }

    const ikFront = this.solveTwoBoneIK(this.shoulderFront, this.handTargetFront, this.upperArmLength, this.forearmLength, !this.flipped);
    this.armFront.angle1 = ikFront.theta1;
    this.armFront.angle2 = ikFront.theta2;

    const ikBack = this.solveTwoBoneIK(this.shoulderBack, this.handTargetBack, this.upperArmLength, this.forearmLength, this.flipped);
    this.armBack.angle1 = ikBack.theta1;
    this.armBack.angle2 = ikBack.theta2;
  }

  draw(ctx, isShadow = false) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const zScaleFactor = isShadow ? (1.0 + this.z * 0.45) : 1.0;
    const finalScale = this.scale * zScaleFactor;

    ctx.scale(this.flipped ? -finalScale : finalScale, finalScale);
    ctx.rotate(this.tilt);

    let fillColor = "#110b06";
    let ornamentColor = "#d4af37";
    if (isShadow) {
      const alpha = Math.max(0.35, 1.0 - this.z * 0.7);
      fillColor = `rgba(16, 9, 4, ${alpha})`;
      ornamentColor = `rgba(120, 80, 20, ${alpha * 0.4})`;
    }

    this.drawArm(ctx, this.shoulderBack, this.armBack, fillColor, isShadow, true);
    this.drawBody(ctx, fillColor, ornamentColor, isShadow);
    this.drawArm(ctx, this.shoulderFront, this.armFront, fillColor, isShadow, false);
    this.drawGapit(ctx, isShadow);

    ctx.restore();
  }

  drawBody(ctx, fillColor, ornamentColor, isShadow) {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = ornamentColor;
    ctx.lineWidth = isShadow ? 1.5 : 2;

    ctx.beginPath();
    ctx.moveTo(0, -110);
    ctx.lineTo(15, -118);
    ctx.lineTo(22, -125);
    ctx.lineTo(34, -135);
    ctx.lineTo(26, -137);
    ctx.lineTo(24, -145);
    ctx.lineTo(20, -152);
    ctx.lineTo(32, -165);
    ctx.lineTo(24, -170);
    ctx.bezierCurveTo(35, -210, -15, -225, -25, -185);
    ctx.bezierCurveTo(-35, -170, -30, -140, -18, -130);
    ctx.lineTo(-24, -125);
    ctx.lineTo(-12, -115);
    ctx.lineTo(-10, -100);
    ctx.closePath();
    ctx.fill();
    if (!isShadow) ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, -100);
    ctx.lineTo(12, -98);
    ctx.bezierCurveTo(22, -80, 20, -50, 10, -30);
    ctx.lineTo(6, -10);
    ctx.lineTo(18, 40);
    ctx.bezierCurveTo(25, 90, 10, 140, 0, 180);
    ctx.lineTo(-15, 175);
    ctx.bezierCurveTo(-35, 110, -25, 40, -15, -10);
    ctx.bezierCurveTo(-20, -50, -18, -80, -10, -100);
    ctx.closePath();
    ctx.fill();
    if (!isShadow) ctx.stroke();

    if (!isShadow) {
      ctx.beginPath();
      ctx.ellipse(14, -140, 5, 2, Math.PI * 0.1, 0, Math.PI * 2);
      ctx.moveTo(-8, -128);
      ctx.lineTo(-18, -135);
      ctx.moveTo(-2, -90);
      ctx.quadraticCurveTo(8, -75, 2, -60);
      ctx.moveTo(-10, -15);
      ctx.lineTo(8, -12);
      ctx.stroke();
    }
  }

  drawArm(ctx, shoulder, armAngles, fillColor, isShadow, isBackArm = false) {
    ctx.save();
    ctx.translate(shoulder.x, shoulder.y);

    const l1 = this.upperArmLength;
    const l2 = this.forearmLength;

    ctx.rotate(armAngles.angle1);
    ctx.fillStyle = fillColor;

    ctx.beginPath();
    ctx.ellipse(l1 * 0.5, 0, l1 * 0.52, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(l1, 0);
    ctx.rotate(armAngles.angle2);

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(l2 * 0.7, -4);
    ctx.bezierCurveTo(l2 + 10, -8, l2 + 15, 2, l2, 5);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isShadow ? "rgba(25, 15, 8, 0.7)" : "#3a2512";
    ctx.lineWidth = isShadow ? 2.0 : 2.5;
    ctx.beginPath();
    ctx.moveTo(l2 * 0.85, 2);
    ctx.lineTo(l2 * 0.85 - 20, 240);
    ctx.stroke();

    ctx.restore();
  }

  drawGapit(ctx, isShadow) {
    ctx.strokeStyle = isShadow ? "rgba(20, 10, 5, 0.85)" : "#231408";
    ctx.lineWidth = isShadow ? 4.5 : 5.5;
    ctx.beginPath();
    ctx.moveTo(-5, -160);
    ctx.quadraticCurveTo(0, 40, -4, 380);
    ctx.stroke();

    ctx.fillStyle = isShadow ? "rgba(40, 25, 10, 0.8)" : "#e0c068";
    [-60, 20, 120].forEach(knotY => {
      ctx.beginPath();
      ctx.arc(-2, knotY, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

window.WayangPuppet = WayangPuppet;