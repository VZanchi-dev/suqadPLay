import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private supa       = inject(SupabaseService);
  private router     = inject(Router);
  private fb         = inject(FormBuilder);
  private route      = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  form: FormGroup;
  submitted    = false;
  loading      = false;
  errorMsg     = '';
  showPassword = false;

  constructor() {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.route.queryParams.subscribe(params => {
      if (params['error']) this.errorMsg = 'Connexion Steam échouée. Réessaie ou utilise email/mot de passe.';
    });
  }

  loginWithSteam() {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = '/api/auth/steam';
    }
  }

  get f() { return this.form.controls; }

  async onSubmit() {
    this.submitted = true;
    this.errorMsg  = '';
    if (this.form.invalid) return;

    this.loading = true;
    const { email, password } = this.form.value;

    const { error } = await this.supa.client.auth.signInWithPassword({ email, password });

    this.loading = false;

    if (error) {
      this.errorMsg = this.translateError(error.message);
      return;
    }

    this.router.navigate(['/']);
  }

  private translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if (msg.includes('Email not confirmed'))       return 'Confirme ton adresse email avant de te connecter.';
    if (msg.includes('Too many requests'))         return 'Trop de tentatives. Réessaie dans quelques minutes.';
    return 'Une erreur est survenue. Réessaie.';
  }
}
