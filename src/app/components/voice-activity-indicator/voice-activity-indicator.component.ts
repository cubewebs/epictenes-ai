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
  private readonly animationSpeed = 0.02; // Radians per frame

  private themeColors = {
    primary: '',
    secondary: '',
    tertiary: ''
  };

  constructor(private el: ElementRef) { }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.el.nativeElement.querySelector('.indicator-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get 2D context');
      return;
    }
    this.ctx = context;
    this.loadThemeColors();
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

  private loadThemeColors(): void {
    const style = getComputedStyle(this.el.nativeElement);
    this.themeColors.primary = style.getPropertyValue('--primary-color').trim();
    this.themeColors.secondary = style.getPropertyValue('--secondary-color').trim();
    this.themeColors.tertiary = style.getPropertyValue('--tertiary-color').trim();
  }

  private updateVisuals(): void {
    if (!this.ctx) {
        if (this.canvasRef?.nativeElement) {
             const canvas = this.canvasRef.nativeElement;
             const container = this.el.nativeElement.querySelector('.indicator-container');
             canvas.width = container.clientWidth;
             canvas.height = container.clientHeight;
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
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  private drawStaticCircle(): void {
    this.ctx.beginPath();
    this.ctx.arc(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2, this.ctx.canvas.width / 2, 0, Math.PI * 2);
    this.ctx.fillStyle = this.themeColors.primary;
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
    const centerX = this.ctx.canvas.width / 2;
    const centerY = this.ctx.canvas.height / 2;
    const radius = Math.min(centerX, centerY);

    this.ctx.save();
    this.ctx.translate(centerX, centerY);

    for (let i = 0; i < 12; i++) {
      this.ctx.rotate((Math.PI * 2 / 12));
      this.drawSegment(radius);
    }

    this.ctx.restore();
    this.angle += this.animationSpeed;
  }

  private drawSegment(radius: number): void {
    const segmentAngle = Math.PI * 2 / 12; // Using a fixed number of segments for simplicity
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);

    const gradient = this.ctx.createRadialGradient(0,0, radius * 0.2, 0, 0, radius);
    gradient.addColorStop(0, this.themeColors.primary);
    gradient.addColorStop(0.5, this.themeColors.secondary);
    gradient.addColorStop(1, this.themeColors.tertiary);
    this.ctx.fillStyle = gradient;

    const numPoints = 5 + Math.floor(Math.sin(this.angle * 2) * 2);
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


    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1 + Math.sin(this.angle * 3);
    this.ctx.beginPath();
    this.ctx.moveTo(0,0);
    this.ctx.lineTo(Math.cos(this.angle * 0.5) * radius * 0.7, Math.sin(this.angle * 0.5) * radius * 0.7);
    this.ctx.stroke();
  }
} 