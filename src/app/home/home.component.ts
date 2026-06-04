import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
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
    { name: 'Valorant', genre: 'FPS Tactique', players: '12.4k', image: '🎯' },
    { name: 'League of Legends', genre: 'MOBA', players: '18.2k', image: '⚔️' },
    { name: 'Fortnite', genre: 'Battle Royale', players: '9.8k', image: '🏗️' },
    { name: 'CS2', genre: 'FPS', players: '15.1k', image: '💣' },
    { name: 'Rocket League', genre: 'Sport', players: '7.3k', image: '🚀' },
    { name: 'Apex Legends', genre: 'Battle Royale', players: '11.6k', image: '🦾' }
  ];

  steps = [
    { number: '01', title: 'Crée ton profil', description: 'Indique tes jeux favoris, ton niveau et tes disponibilités.' },
    { number: '02', title: 'Trouve ta session', description: 'Parcours les sessions disponibles ou crée la tienne en quelques clics.' },
    { number: '03', title: 'Joue ensemble', description: 'Rejoins tes nouveaux coéquipiers et profite de l\'expérience gaming ultime.' }
  ];
}
