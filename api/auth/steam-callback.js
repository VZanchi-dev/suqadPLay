const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  const appUrl = process.env.APP_URL || 'https://suqad-p-lay-c879.vercel.app';
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const steamApiKey = process.env.STEAM_API_KEY || '';

  // 1. Verify authenticity with Steam's check_authentication endpoint
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
    return res.redirect(302, `${appUrl}/connexion?error=steam_verify_failed`);
  }

  if (!isValid) {
    return res.redirect(302, `${appUrl}/connexion?error=steam_auth_invalid`);
  }

  // 2. Extract SteamID64 from claimed_id (format: https://steamcommunity.com/openid/id/{steamId})
  const claimedId = req.query['openid.claimed_id'];
  const steamId = typeof claimedId === 'string' ? claimedId.split('/').pop() : null;

  if (!steamId || !/^\d{17}$/.test(steamId)) {
    return res.redirect(302, `${appUrl}/connexion?error=steam_id_invalid`);
  }

  // 3. Fetch Steam profile (display name + avatar)
  let username = `steam_${steamId}`;
  let avatarUrl = '';

  if (steamApiKey) {
    try {
      const profileResponse = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
      );
      const profileData = await profileResponse.json();
      const player = profileData?.response?.players?.[0];
      if (player) {
        const sanitized = player.personaname.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
        if (sanitized.length >= 2) username = sanitized;
        avatarUrl = player.avatarfull || '';
      }
    } catch { /* proceed with default username */ }
  }

  // 4. Create Supabase user (idempotent — safe to retry if already exists)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = `${steamId}@steam.squadplay`;

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { steam_id: steamId, username, avatar_url: avatarUrl, provider: 'steam' },
  });

  if (createError) {
    console.error('[steam-callback] createUser error:', createError.message);

    const alreadyExists =
      createError.message.toLowerCase().includes('already') ||
      createError.message.toLowerCase().includes('duplicate');

    if (!alreadyExists) {
      const { error: retryError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { steam_id: steamId, username: `steam_${steamId}`, avatar_url: avatarUrl, provider: 'steam' },
      });
      if (retryError && !retryError.message.toLowerCase().includes('already')) {
        console.error('[steam-callback] retry createUser error:', retryError.message);
        const msg = encodeURIComponent(retryError.message);
        return res.redirect(302, `${appUrl}/connexion?error=user_creation_failed&detail=${msg}`);
      }
    }
  }

  // 5. Generate a one-time magic link for this email and redirect the user to it
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: appUrl },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return res.redirect(302, `${appUrl}/connexion?error=link_generation_failed`);
  }

  res.redirect(302, linkData.properties.action_link);
};
