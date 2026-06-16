/**
 * Serveur Express local pour tester les routes /api/* en développement.
 * Utilisation : node scripts/dev-api.js
 * En parallèle de : ng serve --proxy-config proxy.conf.json
 */
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const PORT = 4001;
const APP_URL = process.env.APP_URL || 'http://localhost:4200';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';

const app = express();

// GET /api/auth/steam → Redirige vers Steam OpenID
app.get('/api/auth/steam', (req, res) => {
  const callbackUrl = `${APP_URL}/api/auth/steam-callback`;
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': callbackUrl,
    'openid.realm': APP_URL,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  res.redirect(302, `https://steamcommunity.com/openid/login?${params.toString()}`);
});

// GET /api/auth/steam-callback → Vérification + connexion Supabase
app.get('/api/auth/steam-callback', async (req, res) => {
  const verifyParams = new URLSearchParams(req.query);
  verifyParams.set('openid.mode', 'check_authentication');

  let isValid = false;
  try {
    const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });
    const text = await verifyResponse.text();
    isValid = text.includes('is_valid:true');
  } catch {
    return res.redirect(302, `${APP_URL}/connexion?error=steam_verify_failed`);
  }

  if (!isValid) return res.redirect(302, `${APP_URL}/connexion?error=steam_auth_invalid`);

  const claimedId = req.query['openid.claimed_id'];
  const steamId = typeof claimedId === 'string' ? claimedId.split('/').pop() : null;
  if (!steamId || !/^\d{17}$/.test(steamId)) {
    return res.redirect(302, `${APP_URL}/connexion?error=steam_id_invalid`);
  }

  let username = `steam_${steamId}`;
  let avatarUrl = '';
  if (STEAM_API_KEY) {
    try {
      const r = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`);
      const d = await r.json();
      const player = d?.response?.players?.[0];
      if (player) {
        const sanitized = player.personaname.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
        if (sanitized.length >= 2) username = sanitized;
        avatarUrl = player.avatarfull || '';
      }
    } catch { /* proceed with default */ }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `${steamId}@steam.squadplay`;
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { steam_id: steamId, username, avatar_url: avatarUrl, provider: 'steam' },
  });

  if (createError) {
    const alreadyExists = createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('duplicate');
    if (!alreadyExists) {
      const { error: retryError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { steam_id: steamId, username: `steam_${steamId}`, avatar_url: avatarUrl, provider: 'steam' },
      });
      if (retryError && !retryError.message.toLowerCase().includes('already')) {
        return res.redirect(302, `${APP_URL}/connexion?error=user_creation_failed`);
      }
    }
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: APP_URL },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return res.redirect(302, `${APP_URL}/connexion?error=link_generation_failed`);
  }

  res.redirect(302, linkData.properties.action_link);
});

app.listen(PORT, () => console.log(`[dev-api] API locale sur http://localhost:${PORT}`));
