import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SessionService } from '../core/services/session.service';
import { Session } from '../core/types/database.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private sessionService = inject(SessionService);

  latestSessions = signal<Session[]>([]);

  features = [
    {
      icon: '🎮',
      title: 'Trouve des coéquipiers',
      description: 'Connecte-toi avec des joueurs qui ont le même niveau et les mêmes horaires que toi.'
    },
    {
      icon: '🗓️',
      title: 'Planifie des sessions',
      description: 'Crée ou rejoins des sessions de jeu planifiées pour ne plus jamais jouer seul.'
    },
    {
      icon: '🏆',
      title: 'Suis tes stats',
      description: 'Consulte tes performances et progresse avec ta team au fil des parties.'
    },
    {
      icon: '💬',
      title: 'Chat intégré',
      description: 'Communique avant, pendant et après les parties directement sur la plateforme.'
    }
  ];

  games = [
    { name: 'Valorant', genre: 'FPS Tactique', image: '🎯' },
    { name: 'League of Legends', genre: 'MOBA', image: '⚔️' },
    { name: 'Fortnite', genre: 'Battle Royale', image: '🏗️' },
    { name: 'CS2', genre: 'FPS', image: '💣' },
    { name: 'Rocket League', genre: 'Sport', image: '🚀' },
    { name: 'Apex Legends', genre: 'Battle Royale', image: '🦾' }
  ];

  steps = [
    { number: '01', title: 'Crée ton profil', description: 'Indique tes jeux favoris, ton niveau et tes disponibilités.' },
    { number: '02', title: 'Trouve ta session', description: 'Parcours les sessions disponibles ou crée la tienne en quelques clics.' },
    { number: '03', title: 'Joue ensemble', description: 'Rejoins tes nouveaux coéquipiers et profite de l\'expérience gaming ultime.' }
  ];

  ngOnInit() {
    this.sessionService.getSessions({
      search: '', ageRanges: [], categories: [], levels: [], languages: [], discordOnly: false
    }).subscribe(sessions => {
      this.latestSessions.set(sessions.slice(0, 2));
    });
  }

  levelColor(level: string): string {
    const map: Record<string, string> = {
      'Débutant': 'green', 'Intermédiaire': 'blue', 'Confirmé': 'purple', 'Expert': 'gold'
    };
    return map[level] ?? 'default';
  }

  formatTime(createdAt: string): string {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diff < 1) return 'à l\'instant';
    if (diff < 60) return `il y a ${diff} min`;
    const h = Math.floor(diff / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  }
}
