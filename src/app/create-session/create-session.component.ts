import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SessionService } from '../core/services/session.service';
import { Game, PlayerLevel, AgeRange, Language } from '../core/types/database.types';
import { NavbarComponent } from '../navbar/navbar.component';
import { GAMES_LIST } from '../core/data/games.data';

const FALLBACK_GAMES: Game[] = GAMES_LIST.map(g => ({
  id: g.id, name: g.label, emoji: g.icon, category: g.category, created_at: ''
}));

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './create-session.component.html',
  styleUrl: './create-session.component.scss'
})
export class CreateSessionComponent implements OnInit {
  games: Game[] = [];
  selectedGame: Game | null = null;

  levels: PlayerLevel[] = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
  ageRanges: AgeRange[] = ['13-17 ans', '18-25 ans', '26-35 ans', '35+ ans'];
  languages: Language[] = ['Français', 'English', 'Español', 'Deutsch', 'Português'];

  selectedLanguages = new Set<Language>();

  form: FormGroup;
  submitted = false;
  saving    = false;
  errorMsg  = '';

  constructor(
    private auth: AuthService,
    private sessionSvc: SessionService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      description:      ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
      level_required:   ['', [Validators.required]],
      age_range:        ['', [Validators.required]],
      discord_required: [false],
      discord_invite:   [''],
      players_max:      [4, [Validators.required, Validators.min(2), Validators.max(10)]],
    });

    this.form.get('discord_required')!.valueChanges.subscribe((required: boolean) => {
      const ctrl = this.form.get('discord_invite')!;
      if (required) {
        ctrl.setValidators([Validators.required, Validators.minLength(2)]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity();
    });
  }

  ngOnInit() {
    if (!this.auth.currentUser) { this.router.navigate(['/connexion']); return; }
    this.sessionSvc.getGames().subscribe(g => {
      this.games = g.length > 0 ? g : FALLBACK_GAMES;
    });
  }

  selectGame(game: Game) { this.selectedGame = game; }

  toggleLanguage(lang: Language) {
    this.selectedLanguages.has(lang)
      ? this.selectedLanguages.delete(lang)
      : this.selectedLanguages.add(lang);
  }

  get descLength(): number { return this.form.value.description?.length ?? 0; }
  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMsg  = '';

    if (!this.selectedGame)                { this.errorMsg = 'Choisis un jeu pour continuer.'; return; }
    if (this.selectedLanguages.size === 0) { this.errorMsg = 'Sélectionne au moins une langue.'; return; }

    if (this.form.invalid) {
      const c = this.form.controls;
      if (c['description'].errors)         this.errorMsg = 'La description doit faire au moins 10 caractères.';
      else if (c['level_required'].errors)  this.errorMsg = 'Sélectionne un niveau requis.';
      else if (c['age_range'].errors)       this.errorMsg = 'Sélectionne une tranche d\'âge.';
      else if (c['discord_invite'].errors)  this.errorMsg = 'Saisis le code de ton serveur Discord.';
      else                                  this.errorMsg = 'Vérifie que tous les champs sont bien remplis.';
      return;
    }

    if (!this.auth.currentUser) {
      this.errorMsg = 'Tu dois être connecté pour créer une session.';
      return;
    }

    this.saving = true;
    const v    = this.form.value;
    const user = this.auth.currentUser;

    this.sessionSvc.createSession({
      game_id:          this.selectedGame.id,
      description:      v.description,
      level_required:   v.level_required,
      age_range:        v.age_range,
      languages:        Array.from(this.selectedLanguages) as Language[],
      discord_required: v.discord_required,
      discord_invite:   v.discord_required ? `https://discord.gg/${v.discord_invite.trim()}` : null,
      players_max:      Number(v.players_max),
    }, user.id).subscribe(session => {
      this.saving = false;
      if (session) {
        this.router.navigate(['/recherche']);
      } else {
        this.errorMsg = 'Erreur lors de la création — vérifie les règles RLS dans Supabase.';
      }
    });
  }

  levelColor(level: string): string {
    const map: Record<string, string> = {
      'Débutant': 'green', 'Intermédiaire': 'blue', 'Confirmé': 'purple', 'Expert': 'gold'
    };
    return map[level] ?? 'default';
  }
}
