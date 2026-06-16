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
    const r = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });
    isValid = (await r.text()).includes('is_valid:true');
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

  // 3. Fetch Steam display name
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
    } catch { /* default username */ }
  }
  console.log(`[steam] steamId=${steamId} username=${username} apiKeySet=${!!steamApiKey}`);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `${steamId}@steam.squadplay`;

  // 4. Helper : find user by email via paginated listUsers
  async function findUserByEmail(email) {
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users) return null;
      const found = data.users.find(u => u.email === email);
      if (found) return found;
      if (!data.nextPage) return null;
      page = data.nextPage;
    }
  }

  // 5. Create or find user
  let userId = null;
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { steam_id: steamId, username, avatar_url: avatarUrl, provider: 'steam' },
  });

  if (!createError) {
    userId = createData.user.id;
    console.log(`[steam] new user created id=${userId}`);
  } else {
    const alreadyExists =
      createError.message.toLowerCase().includes('already') ||
      createError.message.toLowerCase().includes('duplicate');

    if (alreadyExists) {
      const found = await findUserByEmail(email);
      userId = found?.id ?? null;
      console.log(`[steam] existing user found id=${userId}`);
    } else {
      // Username conflict in trigger — retry with guaranteed-unique name
      const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { steam_id: steamId, username: `steam_${steamId}`, avatar_url: avatarUrl, provider: 'steam' },
      });
      if (!retryError) {
        userId = retryData.user.id;
        username = `steam_${steamId}`;
      } else {
        const found = await findUserByEmail(email);
        userId = found?.id ?? null;
        console.log(`[steam] retry fallback, found id=${userId}`);
      }
    }
  }

  // 6. Update profile with latest Steam username on every login
  if (userId) {
    const { error: upErr } = await supabase.from('profiles').update({ username }).eq('id', userId);
    if (upErr) {
      console.warn(`[steam] profile update failed (${upErr.message}), trying fallback`);
      const { error: upErr2 } = await supabase
        .from('profiles')
        .update({ username: `steam_${steamId}` })
        .eq('id', userId);
      if (upErr2) console.error(`[steam] fallback update also failed: ${upErr2.message}`);
    } else {
      console.log(`[steam] profile updated username=${username}`);
    }
  } else {
    console.error('[steam] userId is null — profile not updated');
  }

  // 7. Generate magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: appUrl },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[steam] generateLink error:', linkError?.message);
    return res.redirect(302, `${appUrl}/connexion?error=link_generation_failed`);
  }

  res.redirect(302, linkData.properties.action_link);
};
