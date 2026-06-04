import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { GAMES_LIST } from '../core/data/games.data';
import { SupabaseService } from '../core/services/supabase.service';
import { PlayerLevel, AgeRange, Language } from '../core/types/database.types';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private auth   = inject(AuthService);
  private supa   = inject(SupabaseService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);

  user = this.auth.currentUser;
  editing = false;
  saving  = false;
  saved   = false;

  levels:    PlayerLevel[] = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
  ageRanges: AgeRange[]    = ['13-17 ans', '18-25 ans', '26-35 ans', '35+ ans'];
  languages: Language[]    = ['Français', 'English', 'Español', 'Deutsch', 'Português'];

  allGames = GAMES_LIST;

  selectedGames = new Set<string>();
  selectedLanguages = new Set<string>();

  form!: FormGroup;

  get meta() { return this.user?.user_metadata ?? {}; }

  ngOnInit() {
    if (!this.user) { this.router.navigate(['/']); return; }

    const favGames: string[] = this.meta['favorite_games'] ?? [];
    favGames.forEach(g => this.selectedGames.add(g));

    const langs: string[] = this.meta['languages'] ?? [];
    langs.forEach(l => this.selectedLanguages.add(l));

    this.form = this.fb.group({
      pseudo:    [this.meta['pseudo']    ?? '', [Validators.required, Validators.minLength(3)]],
      nom:       [this.meta['nom']       ?? '', [Validators.required]],
      prenom:    [this.meta['prenom']    ?? '', [Validators.required]],
      age:       [this.meta['age']       ?? '', [Validators.required, Validators.min(13), Validators.max(99)]],
      avatarUrl: [this.meta['avatar_url'] ?? ''],
      bio:       [this.meta['bio']       ?? ''],
      level:     [this.meta['level']     ?? ''],
      ageRange:  [this.meta['age_range'] ?? ''],
      discord:   [this.meta['discord']   ?? ''],
    });
  }

  toggleGame(id: string) {
    this.selectedGames.has(id) ? this.selectedGames.delete(id) : this.selectedGames.add(id);
  }

  toggleLanguage(lang: string) {
    this.selectedLanguages.has(lang) ? this.selectedLanguages.delete(lang) : this.selectedLanguages.add(lang);
  }

  startEdit() { this.editing = true; this.saved = false; }
  cancelEdit() { this.editing = false; this.form.reset(this.buildFormValue()); }

  private buildFormValue() {
    return {
      pseudo:    this.meta['pseudo']    ?? '',
      nom:       this.meta['nom']       ?? '',
      prenom:    this.meta['prenom']    ?? '',
      age:       this.meta['age']       ?? '',
      avatarUrl: this.meta['avatar_url'] ?? '',
      bio:       this.meta['bio']       ?? '',
      level:     this.meta['level']     ?? '',
      ageRange:  this.meta['age_range'] ?? '',
      discord:   this.meta['discord']   ?? '',
    };
  }

  async saveProfile() {
    if (this.form.invalid) return;
    this.saving = true;

    const v = this.form.value;
    const { error } = await this.supa.client.auth.updateUser({
      data: {
        pseudo:         v.pseudo,
        nom:            v.nom,
        prenom:         v.prenom,
        age:            Number(v.age),
        avatar_url:     v.avatarUrl || null,
        bio:            v.bio || null,
        level:          v.level || null,
        age_range:      v.ageRange || null,
        discord:        v.discord || null,
        favorite_games: Array.from(this.selectedGames),
        languages:      Array.from(this.selectedLanguages),
      }
    });

    this.saving = false;

    if (!error) {
      this.user = this.auth.currentUser;
      this.editing = false;
      this.saved = true;
    }
  }

  get favoriteGameObjects() {
    return this.allGames.filter(g => (this.meta['favorite_games'] ?? []).includes(g.id));
  }

  get userLanguages(): string[] {
    return this.meta['languages'] ?? [];
  }
}
