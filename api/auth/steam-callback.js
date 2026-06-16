const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const appUrl = process.env.APP_URL || 'https://suqad-p-lay-c879.vercel.app';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const steamApiKey = process.env.STEAM_API_KEY || '';

  // 1. Verify with Steam
  const verifyParams = new URLSearchParams(req.query);
  verifyParams.set('openid.mode', 'check_authentication');

  let isValid = false;
  try {
    const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });
    isValid = (await verifyResponse.text()).includes('is_valid:true');
  } catch {
    return res.redirect(302, `${appUrl}/connexion?error=steam_verify_failed`);
  }

  if (!isValid) return res.redirect(302, `${appUrl}/connexion?error=steam_auth_invalid`);

  // 2. Extract SteamID64
  const claimedId = req.query['openid.claimed_id'];
  const steamId = typeof claimedId === 'string' ? claimedId.split('/').pop() : null;
  if (!steamId || !/^\d{17}$/.test(steamId)) {
    return res.redirect(302, `${appUrl}/connexion?error=steam_id_invalid`);
  }

  // 3. Fetch Steam display name + avatar
  let username = `steam_${steamId}`;
  let avatarUrl = '';

  if (steamApiKey) {
    try {
      const r = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
      );
      const player = (await r.json())?.response?.players?.[0];
      if (player) {
        const sanitized = player.personaname.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
        if (sanitized.length >= 2) username = sanitized;
        avatarUrl = player.avatarfull || '';
      }
    } catch { /* proceed with default */ }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `${steamId}@steam.squadplay`;

  // 4. Create or find user — track the user ID either way
  let userId = null;

  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { steam_id: steamId, username, avatar_url: avatarUrl, provider: 'steam' },
  });

  if (!createError) {
    userId = createData.user.id;
  } else {
    const alreadyExists =
      createError.message.toLowerCase().includes('already') ||
      createError.message.toLowerCase().includes('duplicate');

    if (alreadyExists) {
      // User exists — find their ID
      const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = listData?.users?.find(u => u.email === email)?.id ?? null;
    } else {
      // Possibly a username conflict in trigger — retry with guaranteed-unique name
      const fallback = `steam_${steamId}`;
      const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { steam_id: steamId, username: fallback, avatar_url: avatarUrl, provider: 'steam' },
      });
      if (!retryError) {
        userId = retryData.user.id;
        username = fallback;
      } else if (retryError.message.toLowerCase().includes('already')) {
        const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = listData?.users?.find(u => u.email === email)?.id ?? null;
      } else {
        console.error('[steam-callback] retry error:', retryError.message);
        return res.redirect(302, `${appUrl}/connexion?error=user_creation_failed&detail=${encodeURIComponent(retryError.message)}`);
      }
    }
  }

  // 5. Always update profile with latest Steam info (fixes stale usernames)
  if (userId) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', userId);

    if (updateError) {
      // Username taken by another account — fallback to steamId-based name
      await supabase.from('profiles').update({ username: `steam_${steamId}` }).eq('id', userId);
    }
  }

  // 6. Generate magic link and redirect
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: appUrl },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[steam-callback] generateLink error:', linkError?.message);
    return res.redirect(302, `${appUrl}/connexion?error=link_generation_failed`);
  }

  res.redirect(302, linkData.properties.action_link);
};
