import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SessionService } from '../core/services/session.service';
import { Game, PlayerLevel, AgeRange, Language } from '../core/types/database.types';
import { NavbarComponent } from '../navbar/navbar.component';

const FALLBACK_GAMES: Game[] = [
  { id: 'lol',       name: 'League of Legends',          emoji: '⚔️', category: 'MOBA',         created_at: '' },
  { id: 'valorant',  name: 'Valorant',                   emoji: '🔫', category: 'FPS',          created_at: '' },
  { id: 'fortnite',  name: 'Fortnite',                   emoji: '🏗️', category: 'Battle Royale', created_at: '' },
  { id: 'csgo',      name: 'CS2',                        emoji: '💣', category: 'FPS',          created_at: '' },
  { id: 'overwatch', name: 'Overwatch 2',                emoji: '🦸', category: 'FPS',          created_at: '' },
  { id: 'apex',      name: 'Apex Legends',               emoji: '🎯', category: 'Battle Royale', created_at: '' },
  { id: 'wow',       name: 'World of Warcraft',          emoji: '🐉', category: 'MMO',          created_at: '' },
  { id: 'minecraft', name: 'Minecraft',                  emoji: '⛏️', category: 'Simulation',   created_at: '' },
  { id: 'pcm2025',   name: 'Pro Cyclist Manager 2025',   emoji: '🚴', category: 'Sport',        created_at: '' },
  { id: 'pcm2026',   name: 'Pro Cyclist Manager 2026',   emoji: '🚴', category: 'Sport',        created_at: '' },
  { id: 'homm',      name: 'Heroes of Might & Magic: Olden Era', emoji: '🏰', category: 'Stratégie', created_at: '' },
];

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './create-session.component.html',
  styleUrl: './create-session.component.scss'
})
export class CreateSessionComponent implements OnInit {
  private auth    = inject(AuthService);
  private sessions = inject(SessionService);
  private fb      = inject(FormBuilder);
  private router  = inject(Router);

  games: Game[] = [];
  selectedGame: Game | null = null;

  levels: PlayerLevel[]  = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
  ageRanges: AgeRange[]  = ['13-17 ans', '18-25 ans', '26-35 ans', '35+ ans'];
  languages: Language[]  = ['Français', 'English', 'Español', 'Deutsch', 'Português'];

  selectedLanguages = new Set<Language>();

  form!: FormGroup;
  submitted = false;
  saving    = false;
  errorMsg  = '';

  ngOnInit() {
    if (!this.auth.currentUser) { this.router.navigate(['/']); return; }

    this.sessions.getGames().subscribe(g => {
      this.games = g.length > 0 ? g : FALLBACK_GAMES;
    });

    this.form = this.fb.group({
      description:      ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
      level_required:   ['', [Validators.required]],
      age_range:        ['', [Validators.required]],
      discord_required: [false],
      discord_invite:   [''],
      players_max:      [4, [Validators.required, Validators.min(2), Validators.max(10)]],
    });

    // Rend le lien obligatoire si Discord est requis
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

  selectGame(game: Game) {
    this.selectedGame = game;
  }

  toggleLanguage(lang: Language) {
    this.selectedLanguages.has(lang)
      ? this.selectedLanguages.delete(lang)
      : this.selectedLanguages.add(lang);
  }

  get descLength(): number { return this.form.value.description?.length ?? 0; }
  get f() { return this.form.controls; }

  async onSubmit() {
    this.submitted = true;
    this.errorMsg  = '';

    if (!this.selectedGame) { this.errorMsg = 'Choisis un jeu.'; return; }
    if (this.selectedLanguages.size === 0) { this.errorMsg = 'Sélectionne au moins une langue.'; return; }
    if (this.form.invalid) return;

    this.saving = true;
    const user = this.auth.currentUser!;
    const v = this.form.value;

    this.sessions.createSession({
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
        this.errorMsg = 'Une erreur est survenue. Réessaie.';
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
