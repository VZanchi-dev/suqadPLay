import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SessionService } from '../core/services/session.service';
import { Game, GameCategory } from '../core/types/database.types';

const CATEGORY_ICONS: Record<string, string> = {
  'FPS': '🎯', 'MOBA': '⚔️', 'Stratégie': '🏰', 'Battle Royale': '🏗️',
  'RPG': '🧙', 'Sport': '🏆', 'MMO': '🐉', 'Simulation': '🌍'
};

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss'
})
export class GamesComponent implements OnInit {
  private sessionService = inject(SessionService);

  readonly CATEGORIES: GameCategory[] = ['FPS', 'MOBA', 'Stratégie', 'Battle Royale', 'RPG', 'Sport', 'MMO', 'Simulation'];

  allGames = signal<Game[]>([]);
  loading = signal(true);
  selectedCategory = signal<GameCategory | null>(null);
  search = signal('');

  filteredGames = computed(() => {
    let games = this.allGames();
    const cat = this.selectedCategory();
    const q = this.search().toLowerCase().trim();
    if (cat) games = games.filter(g => g.category === cat);
    if (q)   games = games.filter(g => g.name.toLowerCase().includes(q));
    return games;
  });

  ngOnInit() {
    this.sessionService.getGames().subscribe(games => {
      this.allGames.set(games);
      this.loading.set(false);
    });
  }

  categoryIcon(cat: string): string {
    return CATEGORY_ICONS[cat] ?? '🎮';
  }

  selectCategory(cat: GameCategory) {
    this.selectedCategory.set(this.selectedCategory() === cat ? null : cat);
  }

  updateSearch(value: string) {
    this.search.set(value);
  }
}
