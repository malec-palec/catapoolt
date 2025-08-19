interface Point {
  x: number;
  y: number;
}

class Leg {
  private topPoint: Point;
  private bottomPoint: Point;
  private circleCenter: Point;
  private time: number = 0;
  private radius: number = 150; // Distance between top and bottom points
  private arcRange: number = Math.PI / 8; // Small segment range (30 degrees)
  private frequency: number = 0.04; // Speed of oscillation
  private maxCurvature: number = 40; // Maximum curvature offset at arc extremes
  private currentAngle: number = Math.PI / 2; // Track current angle for curvature calculation
  private oscillationDirection: number = 1; // 1 for normal, -1 for opposite direction

  constructor(topPoint: Point, radius: number = 150, timeOffset: number = 0, oscillationDirection: number = 1) {
    this.topPoint = { ...topPoint };
    this.radius = radius;
    this.time = timeOffset;
    this.oscillationDirection = oscillationDirection;

    // Circle center is at the top point - bottom point orbits around it
    this.circleCenter = { x: this.topPoint.x, y: this.topPoint.y };

    // Initialize bottom point at extreme side position based on direction
    const baseAngle = Math.PI / 2; // Bottom position
    const startingAngle = baseAngle + this.arcRange * this.oscillationDirection;
    this.currentAngle = startingAngle;

    this.bottomPoint = {
      x: this.circleCenter.x + Math.cos(startingAngle) * this.radius,
      y: this.circleCenter.y + Math.sin(startingAngle) * this.radius,
    };
  }

  public update(): void {
    // Oscillate within a small arc segment with directional motion
    const baseAngle = Math.PI / 2; // Start from straight down (bottom position)
    const oscillation = Math.sin(this.time * this.frequency) * this.arcRange * this.oscillationDirection;
    this.currentAngle = baseAngle + oscillation;

    this.bottomPoint.x = this.circleCenter.x + Math.cos(this.currentAngle) * this.radius;
    this.bottomPoint.y = this.circleCenter.y + Math.sin(this.currentAngle) * this.radius;
    this.time++;
  }

  public getTopPoint(): Point {
    return { ...this.topPoint };
  }

  public render(ctx: CanvasRenderingContext2D, showArc: boolean = false): void {
    // Conditionally draw the arc segment path that the bottom point travels
    if (showArc) {
      const baseAngle = Math.PI / 2; // Bottom position
      const startAngle = baseAngle - this.arcRange;
      const endAngle = baseAngle + this.arcRange;
      this.drawArc(ctx, this.circleCenter, this.radius, startAngle, endAngle, "#cccccc", 1);
    }

    // Draw the curved line between points
    this.drawCurvedLine(ctx, this.topPoint, this.bottomPoint);
  }

  private drawCurvedLine(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
    color: string = "#000000",
    width: number = 6,
  ): void {
    // Calculate curvature based on current position in arc
    const baseAngle = Math.PI / 2; // Bottom position (straight line)
    const angleOffset = Math.abs(this.currentAngle - baseAngle);
    const curvatureIntensity = angleOffset / this.arcRange; // 0 to 1
    const curvatureAmount = curvatureIntensity * this.maxCurvature;

    // Calculate midpoint between the two points
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Calculate perpendicular direction for curvature offset
    const lineAngle = Math.atan2(to.y - from.y, to.x - from.x);
    const perpAngle = lineAngle + Math.PI / 2;

    // Determine curve direction based on which side of arc we're on
    const curveDirection = this.currentAngle > baseAngle ? -1 : 1;

    // Calculate control point for quadratic curve
    const controlX = midX + Math.cos(perpAngle) * curvatureAmount * curveDirection;
    const controlY = midY + Math.sin(perpAngle) * curvatureAmount * curveDirection;

    // Draw the curved line with round caps
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
    ctx.stroke();
  }

  private drawArc(
    ctx: CanvasRenderingContext2D,
    center: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: string = "#555555",
    width: number = 2,
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, endAngle);
    ctx.stroke();
  }
}

class LegSystem {
  private leftLeg: Leg;
  private rightLeg: Leg;

  constructor(centerX: number, centerY: number, leftLegDirection: number = 1, rightLegDirection: number = -1) {
    const lineLength = 200;

    const leftLegTop = { x: centerX - lineLength / 2, y: centerY };
    const rightLegTop = { x: centerX + lineLength / 2, y: centerY };

    // Create legs from the calculated positions with configurable oscillation directions
    this.leftLeg = new Leg(leftLegTop, 150, 0, leftLegDirection);
    this.rightLeg = new Leg(rightLegTop, 150, 0, rightLegDirection);
  }

  public update(): void {
    this.leftLeg.update();
    this.rightLeg.update();
  }

  public render(ctx: CanvasRenderingContext2D, showArc: boolean = false): void {
    // Render both legs (no central line)
    this.leftLeg.render(ctx, showArc);
    this.rightLeg.render(ctx, showArc);
  }

  public getLeftLegTop(): Point {
    return this.leftLeg.getTopPoint();
  }

  public getRightLegTop(): Point {
    return this.rightLeg.getTopPoint();
  }
}

class MultiLegController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private legSystems: LegSystem[] = [];
  private showArc: boolean = true;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;

  constructor() {
    this.canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error("Canvas element not found");
    }

    this.ctx = this.canvas.getContext("2d")!;
    if (!this.ctx) {
      throw new Error("Canvas context not available");
    }

    // Create leg systems for a multi-segmented creature
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Rear leg system: left leg moves right->left, right leg moves left->right (normal walking)
    const system1 = new LegSystem(centerX, centerY, 1, -1);

    // Front leg system: offset top and right, with opposite leg starting positions
    // left leg moves left->right, right leg moves right->left (opposite walking)
    const system2 = new LegSystem(centerX + 50, centerY - 50, -1, 1);

    this.legSystems.push(system1, system2);

    this.setupControls();
    this.startAnimation();
  }

  private setupControls(): void {
    const toggleBtn = document.getElementById("toggleArcBtn") as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.showArc = !this.showArc;
      });
    }

    const recordBtn = document.getElementById("recordBtn") as HTMLButtonElement;
    if (recordBtn) {
      recordBtn.addEventListener("click", () => {
        if (this.isRecording) {
          this.stopRecording();
        } else {
          this.startRecording();
        }
      });
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Fill with white background for video recording
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async startRecording(): Promise<void> {
    try {
      // Get canvas stream
      const stream = this.canvas.captureStream(30); // 30 FPS

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
      });

      // Reset recorded chunks
      this.recordedChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.downloadVideo();
      };

      // Start recording
      this.mediaRecorder.start();
      this.isRecording = true;

      // Update button state
      const recordBtn = document.getElementById("recordBtn") as HTMLButtonElement;
      if (recordBtn) {
        recordBtn.textContent = "Stop Recording";
        recordBtn.classList.add("recording");
      }

      console.log("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please ensure your browser supports video recording.");
    }
  }

  private stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Update button state
      const recordBtn = document.getElementById("recordBtn") as HTMLButtonElement;
      if (recordBtn) {
        recordBtn.textContent = "Start Recording";
        recordBtn.classList.remove("recording");
      }

      console.log("Recording stopped.");
    }
  }

  private downloadVideo(): void {
    if (this.recordedChunks.length > 0) {
      // Create blob from recorded chunks
      const blob = new Blob(this.recordedChunks, { type: "video/webm" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creature-animation-${Date.now()}.webm`;

      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      URL.revokeObjectURL(url);
      this.recordedChunks = [];

      console.log("Video downloaded successfully!");
    }
  }

  private update(): void {
    this.legSystems.forEach((system) => system.update());
  }

  private render(): void {
    this.clearCanvas();

    // Draw connecting lines between corresponding legs of different systems
    this.drawLegConnections();

    // Render all leg systems
    this.legSystems.forEach((system) => system.render(this.ctx, this.showArc));
  }

  private drawLegConnections(): void {
    if (this.legSystems.length >= 2) {
      const system1 = this.legSystems[0]; // rear system (lower)
      const system2 = this.legSystems[1]; // front system (upper)

      // Connect left legs together
      this.drawLine(system1.getLeftLegTop(), system2.getLeftLegTop(), "#666666", 4);

      // Connect right legs together
      this.drawLine(system1.getRightLegTop(), system2.getRightLegTop(), "#666666", 4);

      // Calculate center points of the leg connections
      const leftConnectionCenter = {
        x: (system1.getLeftLegTop().x + system2.getLeftLegTop().x) / 2,
        y: (system1.getLeftLegTop().y + system2.getLeftLegTop().y) / 2,
      };

      const rightConnectionCenter = {
        x: (system1.getRightLegTop().x + system2.getRightLegTop().x) / 2,
        y: (system1.getRightLegTop().y + system2.getRightLegTop().y) / 2,
      };

      // Connect the centers with a horizontal line
      this.drawLine(leftConnectionCenter, rightConnectionCenter, "#666666", 4);
    }
  }

  private drawLine(from: Point, to: Point, color: string = "#333333", width: number = 4): void {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  private animate(): void {
    this.update();
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  private startAnimation(): void {
    console.log("Meow! Starting connected multi-segment creature with video recording capability...");
    this.animate();
  }
}

// Initialize the multi-leg controller when the page loads
new MultiLegController();
