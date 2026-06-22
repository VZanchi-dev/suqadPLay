module.exports = function handler(req, res) {
  const appUrl = process.env.APP_URL;
  if (!appUrl) return res.status(500).json({ error: 'APP_URL non configuré' });
  const callbackUrl = `${appUrl}/api/auth/steam-callback`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': callbackUrl,
    'openid.realm': appUrl,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  res.redirect(302, `https://steamcommunity.com/openid/login?${params.toString()}`);
};
