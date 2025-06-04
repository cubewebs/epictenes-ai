import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase/supabase.service';
import { UserProfile } from '../../../auth/interfaces/auth.interface';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MainBtnComponent } from '../../../components/main-btn/main-btn.component';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainBtnComponent],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit, OnDestroy {
  profileEditForm!: FormGroup;
  currentUser: User | null = null;
  private userSubscription: Subscription | null = null;
  isLoading = false;
  isSaving = false; // Added for save button loading state

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize the form with all editable profile fields, terms is disabled
    this.profileEditForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      username: [null],
      avatar_url: [null],
      website: [null],
      terms: [{ value: false, disabled: true }], // Set terms as disabled
      dob: [null], // Date of Birth
      phone: [null],
      weight: [null],
      height: [null],
      role: [null],
      // Email and password are NOT included here as they are edited separately
    });

    // Subscribe to user changes to get the current user ID and fetch data
    this.userSubscription = this.supabaseService.currentUser$.subscribe(userState => {
      if (userState && typeof userState === 'object' && 'id' in userState && !(userState instanceof Error)) {
        this.currentUser = userState;
        console.log('Current user ID for editing:', this.currentUser.id);
        // Fetch profile data when user is available
        this.fetchUserProfile(this.currentUser.id);
      } else {
        this.currentUser = null;
        console.log('No user logged in for editing or user state is not a valid User object.');
        // Handle case where no user is logged in, e.g., redirect to login
        this.router.navigate(['/login']); // Example: Redirect to login
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async fetchUserProfile(userId: string): Promise<void> {
    this.isLoading = true;
    console.log(`Attempting to fetch profile for editing for user ID: ${userId}`);
    const { data, error } = await this.supabaseService.getUserProfile(userId);
    this.isLoading = false;

    if (error) {
      console.error('Error fetching user profile for editing:', error);
      // Handle error
    } else if (data) {
      console.log('User profile fetched successfully for editing:', data);
      // Patch the form with fetched data from the 'profiles' table
      this.profileEditForm.patchValue({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        username: data.username,
        avatar_url: data.avatar_url,
        website: data.website,
        terms: data.terms, // Still patch the value to display the current state
        dob: data.dob, // Ensure data type is compatible
        phone: data.phone,
        weight: data.weight,
        height: data.height,
        role: data.role,
      });
    } else {
      console.log('No profile data found for user ID:', userId);
      // Handle case where no profile exists yet - form will remain empty
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileEditForm.invalid || !this.currentUser?.id) {
      console.warn('Edit form is invalid or user is not logged in. Cannot save profile.');
      // Optionally display validation errors to the user
      this.profileEditForm.markAllAsTouched(); // Mark fields to show validation messages
      return;
    }

    this.isSaving = true; // Set saving state
    // Get only the enabled form values to avoid sending disabled 'terms'
    const profileData: Partial<UserProfile> = this.profileEditForm.getRawValue();
     // Remove terms from the object if you want to be absolutely sure it's not sent,
     // though getRawValue() includes it even if disabled. UpdateProfile should handle
     // ignoring fields not intended for update or RLS should prevent it.
     // delete profileData.terms;


    console.log('Attempting to save profile data:', profileData);

    const { data, error } = await this.supabaseService.updateUserProfile(this.currentUser.id, profileData);
    this.isSaving = false; // Reset saving state

    if (error) {
      console.error('Error updating user profile:', error);
      // Handle error, e.g., display an error message
    } else if (data) {
      console.log('User profile updated successfully:', data);
      // Optionally, display a success message and/or navigate back to profile view
      this.router.navigate(['/profile']); // Example: Navigate back to profile view
    } else {
       console.log('Update successful but no data returned for user ID:', this.currentUser.id);
       // Success, but no data payload - still navigate back
        this.router.navigate(['/profile']); // Example: Navigate back to profile view
    }
  }

  // Optional: Method to navigate back without saving
  cancelEdit(): void {
    this.router.navigate(['/profile']);
  }
}
