import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from '../types/database.types';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private platformId = inject(PLATFORM_ID);
  private _client: SupabaseClient<Database> | null = null;

  get client(): SupabaseClient<Database> {
    if (!this._client) {
      this._client = createClient<Database>(
        environment.supabase.url,
        environment.supabase.anonKey
      );
    }
    return this._client;
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  uploadAvatar(blob: Blob, extension: string) {
    const fileName = `${crypto.randomUUID()}.${extension}`;
    return this.client.storage.from('avatars').upload(fileName, blob, {
      contentType: `image/${extension}`,
      upsert: false
    }).then(({ data, error }) => {
      if (error || !data) return null;
      return this.client.storage.from('avatars').getPublicUrl(data.path).data.publicUrl;
    });
  }

  signUp(email: string, password: string, metadata: Record<string, unknown>) {
    return this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: environment.appUrl
      }
    });
  }
}
