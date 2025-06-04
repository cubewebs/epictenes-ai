import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // For *ngIf, [ngClass], async pipe
import { ElevenlabsService } from '../../core/services/elevenlabs.service';
import { Subscription } from 'rxjs';
import { VoiceActivityIndicatorComponent } from '../../components/voice-activity-indicator/voice-activity-indicator.component';

@Component({
  selector: 'app-voice-chat',
  standalone: true,
  imports: [CommonModule, VoiceActivityIndicatorComponent],
  templateUrl: './voice-chat.component.html',
  styleUrls: ['./voice-chat.component.scss']
})
export class VoiceChatComponent implements OnInit, OnDestroy {
  connectionStatus: string = 'Disconnected';
  agentStatus: string = 'listening';
  isConversationActive: boolean = false;
  errorMessage: string | null = null;

  private conversation: any; // Variable to hold the conversation object from the service
  private subscriptions = new Subscription();

  constructor(public elevenlabsService: ElevenlabsService) {}

  public get indicatorStatus(): 'speaking' | 'listening' {
    if (this.agentStatus === 'speaking') {
      return 'speaking';
    }
    return 'listening'; // Default to listening for other states like 'inactive', etc.
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.elevenlabsService.connectionStatus$.subscribe((status: string) => {
        this.connectionStatus = status;
        this.isConversationActive = status === 'Connected';
        if (status !== 'Connected') {
            this.isConversationActive = false;
        }
        const startButton = document.getElementById('startButton') as HTMLButtonElement;
        const stopButton = document.getElementById('stopButton') as HTMLButtonElement;
        const connectionStatusSpan = document.getElementById('connectionStatus');

        if (connectionStatusSpan) connectionStatusSpan.textContent = status;

        if (status === 'Connected') {
          if (startButton) startButton.disabled = true;
          if (stopButton) stopButton.disabled = false;
        } else {
          if (startButton) startButton.disabled = false;
          if (stopButton) stopButton.disabled = true;
        }

        if (status === 'Error' || status === 'Mic Permission Denied' || status === 'Configuration Error' || status === 'Start Error' || status === 'Network Error') {
            this.agentStatus = 'inactive';
        }
      })
    );

    this.subscriptions.add(
      this.elevenlabsService.agentStatus$.subscribe((status: string) => {
        this.agentStatus = status;
        const agentStatusSpan = document.getElementById('agentStatus');
        if (agentStatusSpan) agentStatusSpan.textContent = status;
      })
    );

    this.subscriptions.add(
      this.elevenlabsService.error$.subscribe((error: any) => {
        this.errorMessage = error?.message || 'An unknown error occurred with ElevenLabs.';
        console.error('VoiceChatComponent received error:', error);
      })
    );
  }

  async startConversation(): Promise<void> {
    this.errorMessage = null;
    await this.elevenlabsService.startConversation();
  }

  async stopConversation(): Promise<void> {
    await this.elevenlabsService.stopConversation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.elevenlabsService.stopConversation();
  }
} 