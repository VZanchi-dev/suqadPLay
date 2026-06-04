import { Injectable, inject } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Session, SessionFilters } from '../types/database.types';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private supabase = inject(SupabaseService);

  getSessions(filters: SessionFilters): Observable<Session[]> {
    // Ne pas appeler Supabase côté serveur (SSR)
    if (!this.supabase.isBrowser) return of([]);

    let query = this.supabase.client
      .from('sessions')
      .select(`
        *,
        game:games(*),
        host:profiles!host_id(*)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (filters.ageRanges.length > 0) {
      query = query.in('age_range', filters.ageRanges);
    }

    if (filters.levels.length > 0) {
      query = query.in('level_required', filters.levels);
    }

    if (filters.discordOnly) {
      query = query.eq('discord_required', true);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        console.log('[Supabase] data:', data, 'error:', error);
        if (error) throw error;

        let sessions = (data as Session[]) ?? [];

        // Filtres côté client (catégorie, langue, recherche textuelle)
        if (filters.search) {
          const q = filters.search.toLowerCase();
          sessions = sessions.filter(s =>
            s.game?.name.toLowerCase().includes(q) ||
            s.host?.username.toLowerCase().includes(q)
          );
        }

        if (filters.categories.length > 0) {
          sessions = sessions.filter(s => s.game && filters.categories.includes(s.game.category));
        }

        if (filters.languages.length > 0) {
          sessions = sessions.filter(s =>
            filters.languages.some(l => s.languages.includes(l as any))
          );
        }

        return sessions;
      }),
      catchError(err => {
        console.error('Erreur getSessions:', err);
        return of([]);
      })
    );
  }

  joinSession(sessionId: string, playerId: string): Observable<boolean> {
    if (!this.supabase.isBrowser) return of(false);

    return from(
      this.supabase.client
        .from('session_players')
        .insert({ session_id: sessionId, player_id: playerId } as any)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      }),
      catchError(err => {
        console.error('Erreur joinSession:', err);
        return of(false);
      })
    );
  }
}
