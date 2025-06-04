import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { VoiceChatComponent } from './voice-chat.component';
import { ElevenlabsService } from '../../core/services/elevenlabs.service';
import { of } from 'rxjs';

// Mock ElevenlabsService
class MockElevenlabsService {
  connectionStatus$ = of('Disconnected');
  agentStatus$ = of('listening');
  error$ = of(null);
  startConversation = jasmine.createSpy('startConversation').and.resolveTo();
  stopConversation = jasmine.createSpy('stopConversation').and.resolveTo();
}

describe('VoiceChatComponent', () => {
  let component: VoiceChatComponent;
  let fixture: ComponentFixture<VoiceChatComponent>;
  let elevenlabsService: MockElevenlabsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        VoiceChatComponent, // Import standalone component
        NoopAnimationsModule
      ],
      providers: [
        { provide: ElevenlabsService, useClass: MockElevenlabsService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoiceChatComponent);
    component = fixture.componentInstance;
    elevenlabsService = TestBed.inject(ElevenlabsService) as unknown as MockElevenlabsService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default statuses', () => {
    expect(component.connectionStatus).toBe('Disconnected');
    expect(component.agentStatus).toBe('listening');
    expect(component.isConversationActive).toBe(false);
    expect(component.errorMessage).toBeNull();
  });

  it('should call startConversation on button click', () => {
    const startButton = fixture.nativeElement.querySelector('.start-button');
    startButton.click();
    expect(elevenlabsService.startConversation).toHaveBeenCalled();
  });

  it('should call stopConversation on button click when active', async () => {
    // Simulate active conversation
    elevenlabsService.connectionStatus$ = of('Connected');
    component.ngOnInit(); // Re-initialize to pick up new observable value
    fixture.detectChanges();
    
    const stopButton = fixture.nativeElement.querySelector('.stop-button');
    stopButton.click(); // Click the stop button
    expect(elevenlabsService.stopConversation).toHaveBeenCalled();
  });

}); 