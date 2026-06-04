import { Injectable, inject } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Session, SessionFilters, Game, PlayerLevel, AgeRange, Language } from '../types/database.types';

export interface CreateSessionDto {
  game_id: string;
  description: string;
  level_required: PlayerLevel;
  age_range: AgeRange;
  languages: Language[];
  discord_required: boolean;
  discord_invite: string | null;
  players_max: number;
}

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

  getGames(): Observable<Game[]> {
    if (!this.supabase.isBrowser) return of([]);
    return from(
      this.supabase.client.from('games').select('*').order('name')
    ).pipe(
      map(({ data, error }) => { if (error) throw error; return (data as Game[]) ?? []; }),
      catchError(() => of([]))
    );
  }

  createSession(dto: CreateSessionDto, hostId: string): Observable<Session | null> {
    if (!this.supabase.isBrowser) return of(null);
    return from(
      this.supabase.client
        .from('sessions')
        .insert({ ...dto, host_id: hostId, status: 'open' } as any)
        .select('id, game_id, description, level_required, age_range, languages, discord_required, players_max, status, created_at, host_id')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[createSession] Supabase error:', error.message, error.details, error.hint);
          throw error;
        }
        return data as Session;
      }),
      catchError(err => {
        console.error('[createSession] caught:', err);
        return of(null);
      })
    );
  }

  closeSession(sessionId: string): Observable<boolean> {
    if (!this.supabase.isBrowser) return of(false);
    return from(
      this.supabase.client
        .from('sessions')
        .update({ status: 'closed' } as { status: 'open' | 'full' | 'closed' })
        .eq('id', sessionId)
    ).pipe(
      map(({ error }) => { if (error) throw error; return true; }),
      catchError(err => { console.error('Erreur closeSession:', err); return of(false); })
    );
  }

  getSessionCountByUser(userId: string): Observable<number> {
    if (!this.supabase.isBrowser) return of(0);
    return from(
      this.supabase.client
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('host_id', userId)
    ).pipe(
      map(({ count, error }) => { if (error) throw error; return count ?? 0; }),
      catchError(() => of(0))
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
