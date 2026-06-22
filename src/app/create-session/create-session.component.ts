import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { SessionService } from '../core/services/session.service';
import { Game, PlayerLevel, AgeRange, Language, GameCategory } from '../core/types/database.types';
import { NavbarComponent } from '../navbar/navbar.component';
import { GAMES_LIST, GameEntry } from '../core/data/games.data';

const CATEGORY_EMOJI: Record<string, string> = {
  'FPS': '🔫', 'MOBA': '⚔️', 'Battle Royale': '🏗️', 'RPG': '🧙',
  'MMO': '🌐', 'Stratégie': '🏰', 'Sport': '🏆', 'Simulation': '🎮'
};

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
  templateUrl: './create-session.component.html',
  styleUrl: './create-session.component.scss'
})
export class CreateSessionComponent implements OnInit {
  selectedGame: Game | null = null;

  // Autocomplete
  gameSearchText = '';
  gameDropdownOpen = false;
  showCategoryPicker = false;
  customGameCategory: GameCategory | '' = '';

  levels: PlayerLevel[]  = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
  ageRanges: AgeRange[]  = ['13-17 ans', '18-25 ans', '26-35 ans', '35+ ans'];
  languages: Language[]  = ['Français', 'English', 'Español', 'Deutsch', 'Português'];
  categories: GameCategory[] = ['FPS', 'MOBA', 'Stratégie', 'Battle Royale', 'RPG', 'Sport', 'MMO', 'Simulation'];

  selectedLanguages = new Set<Language>();

  form: FormGroup;
  submitted = false;
  saving    = false;
  errorMsg  = '';

  constructor(
    private auth: AuthService,
    private sessionSvc: SessionService,
    private fb: FormBuilder,
    private router: Router,
    private elRef: ElementRef
  ) {
    this.form = this.fb.group({
      description:      ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
      level_required:   ['', [Validators.required]],
      age_range:        ['', [Validators.required]],
      discord_required: [false],
      discord_invite:   [''],
      teamspeak_ip:     [''],
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
  }

  // ─── Autocomplete ────────────────────────────────────────────────────────────

  get filteredGameSuggestions(): GameEntry[] {
    const q = this.gameSearchText.toLowerCase().trim();
    if (!q) return GAMES_LIST.slice(0, 8);
    return GAMES_LIST.filter(g => g.label.toLowerCase().includes(q)).slice(0, 10);
  }

  get isCustomGame(): boolean {
    const q = this.gameSearchText.trim();
    return q.length >= 2 && !GAMES_LIST.some(g => g.label.toLowerCase() === q.toLowerCase());
  }

  onGameInput(value: string) {
    this.gameSearchText = value;
    this.gameDropdownOpen = true;
    this.showCategoryPicker = false;
    this.customGameCategory = '';
  }

  openDropdown() {
    this.gameDropdownOpen = true;
  }

  selectGameSuggestion(entry: GameEntry) {
    this.gameSearchText = entry.label;
    this.gameDropdownOpen = false;
    this.showCategoryPicker = false;
    this.selectedGame = { id: '_pending_' + entry.id, name: entry.label, emoji: entry.icon, category: entry.category, created_at: '' };
  }

  showCustomCategoryPicker() {
    this.showCategoryPicker = true;
  }

  confirmCustomGame() {
    if (!this.customGameCategory) return;
    const name = this.gameSearchText.trim();
    this.selectedGame = {
      id: '_custom',
      name,
      emoji: CATEGORY_EMOJI[this.customGameCategory] ?? '🎮',
      category: this.customGameCategory as GameCategory,
      created_at: ''
    };
    this.gameDropdownOpen = false;
    this.showCategoryPicker = false;
  }

  clearGame() {
    this.selectedGame = null;
    this.gameSearchText = '';
    this.gameDropdownOpen = false;
    this.showCategoryPicker = false;
    this.customGameCategory = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.gameDropdownOpen = false;
    }
  }

  // ─── Formulaire ──────────────────────────────────────────────────────────────

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

    if (!this.selectedGame)                { this.errorMsg = 'Choisis un jeu pour continuer.'; return; }
    if (this.selectedLanguages.size === 0) { this.errorMsg = 'Sélectionne au moins une langue.'; return; }

    if (this.form.invalid) {
      const c = this.form.controls;
      if (c['description'].errors)        this.errorMsg = 'La description doit faire au moins 10 caractères.';
      else if (c['level_required'].errors) this.errorMsg = 'Sélectionne un niveau requis.';
      else if (c['age_range'].errors)      this.errorMsg = 'Sélectionne une tranche d\'âge.';
      else if (c['discord_invite'].errors) this.errorMsg = 'Saisis le code de ton serveur Discord.';
      else                                 this.errorMsg = 'Vérifie que tous les champs sont bien remplis.';
      return;
    }

    if (!this.auth.currentUser) { this.errorMsg = 'Tu dois être connecté pour créer une session.'; return; }

    const v = this.form.value;

    const discordCode = v.discord_invite?.trim() ?? '';
    if (v.discord_required && !/^[A-Za-z0-9_-]{2,32}$/.test(discordCode)) {
      this.errorMsg = 'Le code d\'invitation Discord est invalide (2-32 caractères alphanumériques).';
      return;
    }

    const tsIp = v.teamspeak_ip?.trim() ?? '';
    if (tsIp && !/^(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/.test(tsIp)) {
      this.errorMsg = 'L\'adresse TeamSpeak doit être une IP valide (ex : 192.168.1.1:9987).';
      return;
    }

    this.saving = true;

    // Résoudre le jeu → s'assurer qu'il existe en base
    const resolvedGame = await firstValueFrom(
      this.sessionSvc.getOrCreateGame(this.selectedGame.name, this.selectedGame.emoji, this.selectedGame.category)
    );

    if (!resolvedGame) {
      this.saving = false;
      this.errorMsg = 'Impossible de valider le jeu sélectionné. Réessaie.';
      return;
    }

    const user = this.auth.currentUser;

    this.sessionSvc.createSession({
      game_id:          resolvedGame.id,
      description:      v.description,
      level_required:   v.level_required,
      age_range:        v.age_range,
      languages:        Array.from(this.selectedLanguages) as Language[],
      discord_required: v.discord_required,
      discord_invite:   v.discord_required ? `https://discord.gg/${discordCode}` : null,
      teamspeak_ip:     tsIp || null,
      players_max:      Number(v.players_max),
    }, user.id).subscribe(({ session, error }) => {
      this.saving = false;
      if (session) {
        this.router.navigate(['/recherche']);
      } else {
        this.errorMsg = error ?? 'Erreur inconnue.';
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
