import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../core/services/supabase.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  form: FormGroup;
  submitted = false;
  loading = false;
  success = false;
  errorMessage = '';
  registeredEmail = '';

  showPassword = false;
  showConfirm = false;

  games = [
    { id: 'lol',       label: 'League of Legends',                icon: '⚔️' },
    { id: 'valorant',  label: 'Valorant',                         icon: '🔫' },
    { id: 'fortnite',  label: 'Fortnite',                         icon: '🏗️' },
    { id: 'minecraft', label: 'Minecraft',                        icon: '⛏️' },
    { id: 'csgo',      label: 'CS2',                              icon: '💣' },
    { id: 'overwatch', label: 'Overwatch 2',                      icon: '🦸' },
    { id: 'apex',      label: 'Apex Legends',                     icon: '🎯' },
    { id: 'wow',       label: 'World of Warcraft',                icon: '🐉' },
    { id: 'pcm2025',   label: 'Pro Cyclist Manager 2025',         icon: '🚴' },
    { id: 'pcm2026',   label: 'Pro Cyclist Manager 2026',         icon: '🚴' },
    { id: 'homm',      label: 'Heroes of Might & Magic: Olden Era', icon: '🏰' },
  ];

  selectedGames = new Set<string>();

  constructor(private fb: FormBuilder, private supabase: SupabaseService) {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      pseudo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      age: ['', [Validators.required, Validators.min(13), Validators.max(99)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      avatarUrl: [''],
    }, { validators: passwordMatchValidator });
  }

  get f() { return this.form.controls; }

  get passwordMismatch(): boolean {
    return this.submitted && !!this.form.errors?.['passwordMismatch'] && !this.f['confirmPassword'].errors?.['required'];
  }

  toggleGame(id: string) {
    if (this.selectedGames.has(id)) {
      this.selectedGames.delete(id);
    } else {
      this.selectedGames.add(id);
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.form.invalid) return;

    this.loading = true;

    const { nom, prenom, pseudo, age, email, password, avatarUrl } = this.form.value;

    const { error } = await this.supabase.signUp(email, password, {
      nom,
      prenom,
      pseudo,
      age: Number(age),
      avatar_url: avatarUrl || null,
      favorite_games: Array.from(this.selectedGames),
    });

    this.loading = false;

    if (error) {
      this.errorMessage = this.translateError(error.message);
      return;
    }

    this.registeredEmail = email;
    this.success = true;
  }

  private translateError(msg: string): string {
    if (msg.includes('already registered') || msg.includes('User already registered')) {
      return 'Cette adresse email est déjà utilisée.';
    }
    if (msg.includes('Password should be')) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    if (msg.includes('Invalid email')) {
      return 'Adresse email invalide.';
    }
    return 'Une erreur est survenue. Réessaie dans quelques instants.';
  }
}
