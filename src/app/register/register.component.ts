import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../core/services/supabase.service';
import { GAMES_LIST } from '../core/data/games.data';

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

  games = GAMES_LIST;

  selectedGames = new Set<string>();

  avatarFile: File | null = null;
  avatarPreview: string = '';
  avatarError: string = '';

  private readonly MAX_SIZE = 2 * 1024 * 1024;
  private readonly AVATAR_PX = 200;

  constructor(private fb: FormBuilder, private supabase: SupabaseService) {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      pseudo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      age: ['', [Validators.required, Validators.min(13), Validators.max(99)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordMatchValidator });
  }

  get f() { return this.form.controls; }

  get passwordMismatch(): boolean {
    return this.submitted && !!this.form.errors?.['passwordMismatch'] && !this.f['confirmPassword'].errors?.['required'];
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.avatarError = '';
    this.avatarFile = null;
    this.avatarPreview = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.avatarError = 'Seules les images sont acceptées (JPG, PNG, WebP).';
      return;
    }

    if (file.size > this.MAX_SIZE) {
      this.avatarError = `L'image ne doit pas dépasser 2 Mo.`;
      return;
    }

    this.avatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.avatarPreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  private resizeImage(dataUrl: string, ext: string): Promise<{ blob: Blob; resizedDataUrl: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = this.AVATAR_PX;
        canvas.height = this.AVATAR_PX;
        const ctx = canvas.getContext('2d')!;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, this.AVATAR_PX, this.AVATAR_PX);
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        const resizedDataUrl = canvas.toDataURL(mime, 0.8);
        canvas.toBlob((blob) => resolve({ blob: blob!, resizedDataUrl }), mime, 0.8);
      };
      img.src = dataUrl;
    });
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

    const { nom, prenom, pseudo, age, email, password } = this.form.value;

    let avatarUrl: string | null = null;
    if (this.avatarFile && this.avatarPreview) {
      const ext = this.avatarFile.type === 'image/png' ? 'png' : 'jpeg';
      const { blob, resizedDataUrl } = await this.resizeImage(this.avatarPreview, ext);
      avatarUrl = await this.supabase.uploadAvatar(blob, ext) ?? resizedDataUrl;
    }

    const { error } = await this.supabase.signUp(email, password, {
      nom,
      prenom,
      pseudo,
      age: Number(age),
      avatar_url: avatarUrl,
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
