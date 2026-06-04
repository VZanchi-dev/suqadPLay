import { Component, computed, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';
import { SessionService } from '../core/services/session.service';
import { Session, AgeRange, GameCategory, PlayerLevel } from '../core/types/database.types';

// Mapping drapeaux ↔ valeurs BDD
const LANG_TO_DB: Record<string, string> = {
  '🇫🇷 Français': 'Français',
  '🇬🇧 English': 'English',
  '🇪🇸 Español': 'Español',
  '🇩🇪 Deutsch': 'Deutsch',
  '🇵🇹 Português': 'Português'
};

const LANG_TO_DISPLAY: Record<string, string> = {
  'Français': '🇫🇷 Français',
  'English': '🇬🇧 English',
  'Español': '🇪🇸 Español',
  'Deutsch': '🇩🇪 Deutsch',
  'Português': '🇵🇹 Português'
};

interface UiFilters {
  search: string;
  ageRanges: string[];
  categories: string[];
  levels: string[];
  languages: string[]; // avec drapeaux pour l'affichage
  discordOnly: boolean;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnDestroy {

  private sessionService = inject(SessionService);
  private sub: Subscription;

  readonly AGE_RANGES: AgeRange[] = ['13-17 ans', '18-25 ans', '26-35 ans', '35+ ans'];
  readonly CATEGORIES: GameCategory[] = ['FPS', 'MOBA', 'Stratégie', 'Battle Royale', 'RPG', 'Sport', 'MMO', 'Simulation'];
  readonly LEVELS: PlayerLevel[] = ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'];
  readonly LANGUAGES_DISPLAY = ['🇫🇷 Français', '🇬🇧 English', '🇪🇸 Español', '🇩🇪 Deutsch', '🇵🇹 Português'];

  filters = signal<UiFilters>({
    search: '',
    ageRanges: [],
    categories: [],
    levels: [],
    languages: [],
    discordOnly: false
  });

  sessions = signal<Session[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  activeFilterCount = computed(() => {
    const f = this.filters();
    return f.ageRanges.length + f.categories.length + f.levels.length + f.languages.length + (f.discordOnly ? 1 : 0);
  });

  constructor() {
    this.sub = toObservable(this.filters)
      .pipe(
        debounceTime(300),
        switchMap(f => {
          this.loading.set(true);
          this.error.set(null);
          return this.sessionService.getSessions({
            search: f.search,
            ageRanges: f.ageRanges as AgeRange[],
            categories: f.categories as GameCategory[],
            levels: f.levels as PlayerLevel[],
            languages: f.languages.map(l => LANG_TO_DB[l] as any),
            discordOnly: f.discordOnly
          });
        })
      )
      .subscribe({
        next: sessions => {
          this.sessions.set(sessions);
          this.loading.set(false);
        },
        error: err => {
          console.error(err);
          this.error.set('Impossible de charger les sessions. Vérifie ta connexion.');
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  toggleFilter(group: 'ageRanges' | 'categories' | 'levels' | 'languages', value: string) {
    this.filters.update(f => {
      const arr = [...f[group]];
      const idx = arr.indexOf(value);
      idx === -1 ? arr.push(value) : arr.splice(idx, 1);
      return { ...f, [group]: arr };
    });
  }

  isActive(group: 'ageRanges' | 'categories' | 'levels' | 'languages', value: string): boolean {
    return this.filters()[group].includes(value);
  }

  toggleDiscord() {
    this.filters.update(f => ({ ...f, discordOnly: !f.discordOnly }));
  }

  updateSearch(value: string) {
    this.filters.update(f => ({ ...f, search: value }));
  }

  resetFilters() {
    this.filters.set({ search: '', ageRanges: [], categories: [], levels: [], languages: [], discordOnly: false });
  }

  // ─── Helpers d'affichage ─────────────────────────────────────────────────────

  getLevelColor(level: string): string {
    const map: Record<string, string> = {
      'Débutant': 'green',
      'Intermédiaire': 'blue',
      'Confirmé': 'purple',
      'Expert': 'gold'
    };
    return map[level] ?? 'default';
  }

  displayLanguages(langs: string[]): string {
    return langs.map(l => LANG_TO_DISPLAY[l] ?? l).join(' · ');
  }

  formatTime(createdAt: string): string {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return 'à l\'instant';
    if (diff < 60) return `il y a ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }

  playersCount(session: Session): number {
    const raw = session.players_count as any;
    if (Array.isArray(raw)) return raw[0]?.count ?? 0;
    return raw ?? 0;
  }

  trackById(_: number, session: Session) {
    return session.id;
  }
}
