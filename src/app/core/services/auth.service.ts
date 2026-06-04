import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private supabase = inject(SupabaseService);

  private userSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Charge la session existante au démarrage
    this.supabase.client.auth.getUser().then(({ data }) => {
      this.userSubject.next(data.user);
    });

    // Écoute les changements de session (login, logout, token refresh)
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  signOut() {
    return this.supabase.client.auth.signOut();
  }
}
