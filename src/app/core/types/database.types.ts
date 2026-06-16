export type GameCategory = 'FPS' | 'MOBA' | 'Stratégie' | 'Battle Royale' | 'RPG' | 'Sport' | 'MMO' | 'Simulation';
export type PlayerLevel = 'Débutant' | 'Intermédiaire' | 'Confirmé' | 'Expert';
export type AgeRange = '13-17 ans' | '18-25 ans' | '26-35 ans' | '35+ ans';
export type Language = 'Français' | 'English' | 'Español' | 'Deutsch' | 'Português';

export interface Game {
  id: string;
  name: string;
  emoji: string;
  category: GameCategory;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url: string | null;
  level: PlayerLevel;
  age_range: AgeRange;
  languages: Language[];
  discord_username: string | null;
  bio: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  host_id: string;
  game_id: string;
  description: string;
  level_required: PlayerLevel;
  age_range: AgeRange;
  languages: Language[];
  discord_required: boolean;
  discord_invite: string | null;
  teamspeak_ip: string | null;
  players_max: number;
  status: 'open' | 'full' | 'closed';
  created_at: string;
  // Joined from foreign keys
  game?: Game;
  host?: Profile;
  players_count?: number;
}

export interface Comment {
  id: string;
  session_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface SessionFilters {
  search: string;
  ageRanges: AgeRange[];
  categories: GameCategory[];
  levels: PlayerLevel[];
  languages: Language[];
  discordOnly: boolean;
}

export interface Database {
  public: {
    Tables: {
      games: {
        Row: Game;
        Insert: Omit<Game, 'id' | 'created_at'>;
        Update: Partial<Omit<Game, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'game' | 'host' | 'players_count'>;
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
      session_players: {
        Row: { session_id: string; player_id: string; joined_at: string };
        Insert: { session_id: string; player_id: string };
        Update: never;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'author'>;
        Update: never;
      };
    };
  };
}
