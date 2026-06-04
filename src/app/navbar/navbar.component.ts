import { Component, inject, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  private auth = inject(AuthService);

  user: User | null = null;
  menuOpen = false;

  ngOnInit() {
    this.auth.user$.subscribe(u => {
      this.user = u;
      this.menuOpen = false;
    });
  }

  get pseudo(): string {
    return this.user?.user_metadata?.['pseudo'] ?? this.user?.email?.split('@')[0] ?? 'Mon compte';
  }

  get avatar(): string {
    return this.user?.user_metadata?.['avatar_url'] ?? '';
  }

  get initials(): string {
    const p = this.pseudo;
    return p.slice(0, 2).toUpperCase();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.menuOpen = false;
    }
  }

  async signOut() {
    await this.auth.signOut();
    this.menuOpen = false;
  }
}
