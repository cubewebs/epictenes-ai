import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-voice-activity-indicator',
  templateUrl: './voice-activity-indicator.component.html',
  styleUrls: ['./voice-activity-indicator.component.scss']
})
export class VoiceActivityIndicatorComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() agentStatus: 'speaking' | 'listening' = 'listening';
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private angle = 0;
  private readonly canvasSize = 200;
  private readonly circleColor = '#ff9800'; // Orange
  private readonly kaleidoscopeSegments = 12;
  private readonly animationSpeed = 0.02; // Radians per frame

  constructor() { }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get 2D context');
      return;
    }
    this.ctx = context;
    this.updateVisuals();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['agentStatus']) {
      this.updateVisuals();
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  private updateVisuals(): void {
    if (!this.ctx) {
        // ngAfterViewInit might not have run yet if the component is initialized with ngIf or similar
        // Or if canvas context failed to initialize
        if (this.canvasRef?.nativeElement) {
             const canvas = this.canvasRef.nativeElement;
             canvas.width = this.canvasSize;
             canvas.height = this.canvasSize;
             const context = canvas.getContext('2d');
             if (!context) {
                console.error('Failed to get 2D context on updateVisuals');
                return;
             }
             this.ctx = context;
        } else {
            // Wait for ngAfterViewInit if canvasRef is not ready
            // This might happen if ngOnChanges is called before ngAfterViewInit
            // We will attempt to draw again after view init completes.
            return;
        }
    }
    this.stopAnimation();
    this.clearCanvas();

    if (this.agentStatus === 'speaking') {
      this.startKaleidoscopeAnimation();
    } else if (this.agentStatus === 'listening') {
      this.drawStaticCircle();
    }
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
  }

  private drawStaticCircle(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.canvasSize / 2, this.canvasSize / 2, this.canvasSize / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.circleColor;
    this.ctx.fill();
  }

  private startKaleidoscopeAnimation(): void {
    const animate = () => {
      this.drawKaleidoscopeFrame();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  private stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private drawKaleidoscopeFrame(): void {
    this.clearCanvas();
    const centerX = this.canvasSize / 2;
    const centerY = this.canvasSize / 2;
    const radius = this.canvasSize / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    for (let i = 0; i < this.kaleidoscopeSegments; i++) {
      this.ctx.rotate((Math.PI * 2 / this.kaleidoscopeSegments));
      this.drawSegment(radius);
    }

    this.ctx.restore();
    this.angle += this.animationSpeed;
  }

  private drawSegment(radius: number): void {
    // This is a simple segment drawing. Can be made more complex for a better kaleidoscope effect.
    const segmentAngle = Math.PI * 2 / this.kaleidoscopeSegments;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);

    // Create a gradient for more visual appeal
    const gradient = this.ctx.createRadialGradient(0,0, radius * 0.2, 0, 0, radius);
    gradient.addColorStop(0, `hsl(${this.angle * 50 % 360}, 100%, 70%)`);
    gradient.addColorStop(0.5, `hsl(${(this.angle * 50 + 60) % 360}, 100%, 60%)`);
    gradient.addColorStop(1, `hsl(${(this.angle * 50 + 120) % 360}, 100%, 50%)`);
    this.ctx.fillStyle = gradient;

    // Draw a more interesting shape for the segment
    const numPoints = 5 + Math.floor(Math.sin(this.angle * 2) * 2); // Vary number of points
    for (let j = 0; j <= numPoints; j++) {
        const currentSubAngle = (j / numPoints) * segmentAngle * 0.8 + this.angle * (j % 2 === 0 ? 1 : -1) * 0.1; // Add some variation
        const r = radius * (0.6 + Math.sin(this.angle + j * 0.5) * 0.4); // Varying radius
        const x = Math.cos(currentSubAngle) * r;
        const y = Math.sin(currentSubAngle) * r;
        if (j === 0) {
            this.ctx.moveTo(x, y);
        } else {
            this.ctx.lineTo(x, y);
        }
    }
    this.ctx.closePath();
    this.ctx.fill();


    // Add some lines for more detail
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1 + Math.sin(this.angle * 3);
    this.ctx.beginPath();
    this.ctx.moveTo(0,0);
    this.ctx.lineTo(Math.cos(this.angle * 0.5) * radius * 0.7, Math.sin(this.angle * 0.5) * radius * 0.7);
    this.ctx.stroke();
  }
} 