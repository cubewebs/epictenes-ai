import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase/supabase.service';
import { UserProfile } from '../../../auth/interfaces/auth.interface';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  currentUser: User | null = null;
  private userSubscription: Subscription | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      first_name: [{ value: '', disabled: true }, Validators.required],
      last_name: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      username: [{ value: null, disabled: true }],
      avatar_url: [{ value: null, disabled: true }],
      website: [{ value: null, disabled: true }],
      terms: [{ value: false, disabled: true }],
      dob: [{ value: null, disabled: true }],
      phone: [{ value: null, disabled: true }],
      weight: [{ value: null, disabled: true }],
      height: [{ value: null, disabled: true }],
      role: [{ value: null, disabled: true }],
    });

    this.userSubscription = this.supabaseService.currentUser$.subscribe(userState => {
      if (userState && typeof userState === 'object' && 'id' in userState && !(userState instanceof Error)) {
        this.currentUser = userState;
        console.log('Current user ID:', this.currentUser.id);
        this.profileForm.patchValue({ email: this.currentUser.email });
        this.fetchUserProfile(this.currentUser.id);
      } else {
        this.currentUser = null;
        console.log('No user logged in or user state is not a valid User object.');
        this.profileForm.reset();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async fetchUserProfile(userId: string): Promise<void> {
    this.isLoading = true;
    console.log(`Attempting to fetch profile for user ID: ${userId}`);
    const { data, error } = await this.supabaseService.getUserProfile(userId);
    this.isLoading = false;

    if (error) {
      console.error('Error fetching user profile:', error);
    } else if (data) {
      console.log('User profile fetched successfully:', data);
      this.profileForm.patchValue({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        username: data.username,
        avatar_url: data.avatar_url,
        website: data.website,
        terms: data.terms,
        dob: data.dob,
        phone: data.phone,
        weight: data.weight,
        height: data.height,
        role: data.role,
      });
    } else {
      console.log('No profile data found for user ID:', userId);
    }
  }

  navigateToEditProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  async saveProfile(): Promise<void> {
    console.warn('Save button clicked in read-only profile view.');
    if (this.profileForm.invalid || !this.currentUser?.id) {
       console.warn('Form is invalid or user is not logged in. Cannot save profile.');
       return;
    }

    this.isLoading = true;
    const profileData: Partial<UserProfile> = {
      first_name: this.profileForm.value.first_name,
      last_name: this.profileForm.value.last_name,
    };

    console.log('Attempting to save profile data from read-only view:', profileData);

    const { data, error } = await this.supabaseService.updateUserProfile(this.currentUser.id, profileData);
    this.isLoading = false;

    if (error) {
      console.error('Error updating user profile:', error);
    } else if (data) {
      console.log('User profile updated successfully:', data);
    } else {
       console.log('Update successful but no data returned for user ID:', this.currentUser.id);
    }
  }
}
