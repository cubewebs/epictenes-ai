import { Injectable } from '@angular/core';
import { Conversation } from '@elevenlabs/client';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment'; // Assuming you have environment files

@Injectable({
  providedIn: 'root'
})
export class ElevenlabsService {
  private conversation: any; // Using 'any' for now, replace with Conversation type if available and suitable
  private elevenLabsApiKey = environment.elevenLabsApiKey; // Replace with your actual environment variable
  private elevenLabsAgentId = environment.elevenLabsAgentId; // Replace with your actual environment variable

  public connectionStatus$ = new BehaviorSubject<string>('Disconnected');
  public agentStatus$ = new BehaviorSubject<string>('listening');
  public error$ = new Subject<any>();
  public userTranscript$ = new Subject<string>(); // New: For user's spoken text
  public agentResponse$ = new Subject<string>(); // New: For AI's text response

  constructor() {
    if (!this.elevenLabsApiKey) {
      console.error('ElevenLabs API key is not set in environment variables.');
      this.error$.next({ message: 'ElevenLabs API key is not set.' });
      this.connectionStatus$.next('Configuration Error');
    }
    if (!this.elevenLabsAgentId) {
      console.error('ElevenLabs Agent ID is not set in environment variables.');
      this.error$.next({ message: 'ElevenLabs Agent ID is not set.' });
      this.connectionStatus$.next('Configuration Error');
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.error$.next({ message: 'Microphone permission denied.' });
      this.connectionStatus$.next('Mic Permission Denied');
      return false;
    }
  }

  async startConversation(): Promise<void> {
    if (!this.elevenLabsApiKey || !this.elevenLabsAgentId) {
      this.connectionStatus$.next('Configuration Error');
      console.error('API key or Agent ID is missing. Cannot start conversation.');
      return;
    }

    const hasMicPermission = await this.requestMicrophonePermission();
    if (!hasMicPermission) {
      return;
    }

    this.connectionStatus$.next('Connecting...');
    try {
      this.conversation = await Conversation.startSession({
        agentId: this.elevenLabsAgentId,
        onConnect: () => {
          this.connectionStatus$.next('Connected');
          console.log('ElevenLabs Conversation Connected');

          // Attach event listeners if the conversation object supports it
          if (this.conversation && typeof this.conversation.on === 'function') {
            this.conversation.on('user_transcript', async (event: any) => { // Added async
              if (event && event.user_transcription_event && event.user_transcription_event.user_transcript) {
                const transcript = event.user_transcription_event.user_transcript;
                console.log('User Transcript:', transcript);
                this.userTranscript$.next(transcript);

                // **NEW: Attempt to send the transcript back as a user message to trigger LLM processing**
                try {
                  if (typeof this.conversation.sendText === 'function') {
                    console.log('Sending transcript to agent via sendText():', transcript);
                    await this.conversation.sendText(transcript);
                  } else if (typeof this.conversation.sendEvent === 'function') { 
                    // Fallback if sendText is not available, try generic sendEvent
                    console.log('Sending transcript to agent via sendEvent() as user_message:', transcript);
                    await this.conversation.sendEvent({ type: 'user_message', text: transcript });
                  } else {
                    console.warn('No method found on conversation object (sendText or sendEvent) to send transcript back to server as user_message.');
                  }
                } catch (sendError) {
                  console.error('Error sending user transcript back to server:', sendError);
                  this.error$.next({ message: 'Error sending transcript to AI', details: sendError });
                }
              }
            });

            this.conversation.on('agent_response', (event: any) => { // Based on docs: agent_response
              if (event && event.agent_response_event && event.agent_response_event.agent_response) {
                console.log('Agent Response:', event.agent_response_event.agent_response);
                this.agentResponse$.next(event.agent_response_event.agent_response);
              }
            });

            // The 'audio' event contains base64 audio for playback.
            // The SDK likely handles this automatically for voice output.
            // If manual handling or display of text associated with audio is needed,
            // the 'agent_response' should be used for text.

          } else {
            console.warn('this.conversation.on is not a function. Cannot subscribe to transcript/response events directly. Check SDK for alternative event handling or ensure it is an EventEmitter.');
            // Alternative: Callbacks might be passed into startSession like in Python
            // e.g., callback_user_transcript: (transcript) => { this.userTranscript$.next(transcript); }
            // This would require changing the startSession call structure.
          }
        },
        onDisconnect: () => {
          this.connectionStatus$.next('Disconnected');
          this.agentStatus$.next('listening');
          console.log('ElevenLabs Conversation Disconnected');
        },
        onError: (error: any) => {
          console.error('ElevenLabs Conversation Error:', error);
          this.error$.next(error);
          this.connectionStatus$.next('Error');
        },
        onModeChange: (mode: { mode: string }) => { 
          this.agentStatus$.next(mode.mode === 'speaking' ? 'speaking' : 'listening');
          console.log('ElevenLabs Agent Mode:', mode.mode);
        },
        // Potential alternative for JS SDK if 'on' method is not available on conversation object directly:
        // callbacks: { // This is hypothetical, based on common SDK patterns
        //   onUserTranscript: (event: any) => {
        //     if (event && event.user_transcription_event && event.user_transcription_event.user_transcript) {
        //       this.userTranscript$.next(event.user_transcription_event.user_transcript);
        //     }
        //   },
        //   onAgentResponse: (event: any) => {
        //     if (event && event.agent_response_event && event.agent_response_event.agent_response) {
        //       this.agentResponse$.next(event.agent_response_event.agent_response);
        //     }
        //   }
        // }
      });
    } catch (error: any) {
      console.error('Failed to start ElevenLabs conversation session:', error);
      this.error$.next(error);
      this.connectionStatus$.next('Start Error');
    }
  }

  // Method to explicitly send text if supported and needed (e.g., for a chat input field)
  // The primary interaction is voice, but this could be for typed messages.
  async sendUserInputText(text: string): Promise<void> {
    if (!this.conversation) {
      console.error('Conversation not active. Cannot send text message.');
      this.error$.next({ message: 'Conversation not active. Cannot send text message.' });
      return;
    }
    try {
      if (typeof this.conversation.sendText === 'function') {
        console.log('Sending user typed text to agent via sendText():', text);
        await this.conversation.sendText(text);
      } else if (typeof this.conversation.sendEvent === 'function') {
        console.log('Sending user typed text to agent via sendEvent() as user_message:', text);
        await this.conversation.sendEvent({ type: 'user_message', text: text });
      } else {
        console.warn('No explicit method like sendText or sendEvent found on conversation object for sending user text input.');
        this.error$.next({ message: 'SDK function to send text not found.'});
      }
    } catch (error) {
      console.error('Error sending user text input to AI:', error);
      this.error$.next(error);
    }
  }

  async stopConversation(): Promise<void> {
    this.connectionStatus$.next('Disconnecting...');
    if (this.conversation) {
      try {
        // Also, if event listeners were attached, they might need to be explicitly removed.
        // e.g., if this.conversation.off is a function
        if (typeof this.conversation.off === 'function') {
            this.conversation.off('user_transcript');
            this.conversation.off('agent_response');
        }
        await this.conversation.endSession();
        this.conversation = null;
      } catch (error) {
        console.error('Error stopping ElevenLabs conversation:', error);
        this.error$.next(error);
        this.connectionStatus$.next('Error'); 
      }
    } else {
      this.connectionStatus$.next('Disconnected');
    }
  }

  // You might want to add methods to send text or control the conversation further if needed.
} 