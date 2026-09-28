class WayangTracker {
  constructor(onHandDataCallback) {
    this.onHandData = onHandDataCallback;
    this.videoElement = null;
    this.cameraInstance = null;
    this.handsInstance = null;
    this.isCameraRunning = false;

    // Filter Smoothing (Exponential Moving Average)
    this.smoothedHands = [
      { x: window.innerWidth * 0.4, y: window.innerHeight * 0.65, z: 0.12, tilt: 0, tudingX: 45, tudingY: -50 },
      { x: window.innerWidth * 0.65, y: window.innerHeight * 0.65, z: 0.15, tilt: 0, tudingX: -45, tudingY: -50 }
    ];
    this.smoothAlpha = 0.28;

    this.isMouseDown = false;
    this.setupMouseEvents();
  }

  async initCamera(videoElement, canvasPreview = null) {
    this.videoElement = videoElement;
    this.canvasPreview = canvasPreview;

    if (!window.Hands) return false;

    try {
      this.handsInstance = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.6
      });

      this.handsInstance.onResults((results) => this.processMediaPipeResults(results));

      this.cameraInstance = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.isCameraRunning && this.videoElement) {
            await this.handsInstance.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.cameraInstance.start();
      this.isCameraRunning = true;
      return true;
    } catch (err) {
      console.error(err);
      this.isCameraRunning = false;
      return false;
    }
  }

  stopCamera() {
    if (this.cameraInstance) {
      this.cameraInstance.stop();
      this.isCameraRunning = false;
    }
  }

  processMediaPipeResults(results) {
    if (this.canvasPreview && results.image) {
      const pCtx = this.canvasPreview.getContext('2d');
      pCtx.save();
      pCtx.clearRect(0, 0, this.canvasPreview.width, this.canvasPreview.height);
      pCtx.drawImage(results.image, 0, 0, this.canvasPreview.width, this.canvasPreview.height);

      if (results.multiHandLandmarks && window.drawConnectors && window.drawLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          window.drawConnectors(pCtx, landmarks, window.HAND_CONNECTIONS, { color: '#ffcc00', lineWidth: 2 });
          window.drawLandmarks(pCtx, landmarks, { color: '#ff3333', lineWidth: 1, radius: 3 });
        }
      }
      pCtx.restore();
    }

    if (!results.multiHandLandmarks) return;

    results.multiHandLandmarks.forEach((landmarks, index) => {
      if (index > 1) return;

      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const pinkyTip = landmarks[20];
      const pinkyMCP = landmarks[17];

      // Mirroring horizontal
      const rawX = (1 - middleMCP.x) * window.innerWidth;
      const rawY = middleMCP.y * window.innerHeight * 0.95;

      const handSpan = Math.hypot(wrist.x - middleMCP.x, wrist.y - middleMCP.y);
      const rawZ = Math.max(0.02, Math.min(0.9, 1.0 - (handSpan - 0.1) * 3.5));
      const rawTilt = Math.atan2(wrist.x - middleMCP.x, middleMCP.y - wrist.y) * 0.8;

      const tudingRawX = (indexTip.x - thumbTip.x) * 350 + (index === 0 ? 45 : -45);
      const tudingRawY = (indexTip.y - middleMCP.y) * 250 - 50;

      const isPinkyRaised = (pinkyMCP.y - pinkyTip.y) > 0.08 && (middleMCP.y - landmarks[12].y) < 0.06;

      const s = this.smoothedHands[index];
      const a = this.smoothAlpha;
      s.x += (rawX - s.x) * a;
      s.y += (rawY - s.y) * a;
      s.z += (rawZ - s.z) * a;
      s.tilt += (rawTilt - s.tilt) * a;
      s.tudingX += (tudingRawX - s.tudingX) * a;
      s.tudingY += (tudingRawY - s.tudingY) * a;

      if (this.onHandData) {
        this.onHandData({
          handIndex: index,
          x: s.x,
          y: s.y,
          z: s.z,
          tilt: s.tilt,
          tudingX: s.tudingX,
          tudingY: s.tudingY,
          isDancing: isPinkyRaised
        });
      }
    });
  }

  setupMouseEvents() {
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('#ui-overlay') || e.target.closest('.interactive-btn')) return;
      this.isMouseDown = true;
      this.updateMousePuppet(e.clientX, e.clientY);
      if (window.GamelanAudio) window.GamelanAudio.playCempala();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown && !this.isCameraRunning) {
        this.updateMousePuppet(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', () => { this.isMouseDown = false; });

    window.addEventListener('wheel', (e) => {
      if (this.isCameraRunning) return;
      const delta = e.deltaY * 0.001;
      const s = this.smoothedHands[0];
      s.z = Math.max(0.02, Math.min(0.9, s.z + delta));
      if (this.onHandData) {
        this.onHandData({
          handIndex: 0,
          x: s.x, y: s.y, z: s.z, tilt: s.tilt,
          tudingX: s.tudingX, tudingY: s.tudingY, isDancing: false
        });
      }
    });
  }

  updateMousePuppet(clientX, clientY) {
    const s = this.smoothedHands[0];
    const dx = clientX - s.x;
    s.x = clientX;
    s.y = Math.min(window.innerHeight - 80, clientY);
    s.tilt = Math.max(-0.25, Math.min(0.25, dx * 0.015));
    s.tudingX = 40 + Math.sin(clientX * 0.02) * 35;
    s.tudingY = -50 + Math.cos(clientY * 0.02) * 30;

    if (this.onHandData) {
      this.onHandData({
        handIndex: 0,
        x: s.x, y: s.y, z: s.z, tilt: s.tilt,
        tudingX: s.tudingX, tudingY: s.tudingY, isDancing: false
      });
    }
  }
}

window.WayangTracker = WayangTracker;