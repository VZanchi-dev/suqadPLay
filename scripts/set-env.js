const fs   = require('fs');
const path = require('path');

const url     = process.env.SUPABASE_URL      || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
// VERCEL_URL est fourni automatiquement par Vercel (sans https://)
const appUrl  = process.env.APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

if (!url || !anonKey) {
  console.warn('[set-env] ATTENTION : SUPABASE_URL ou SUPABASE_ANON_KEY manquant — vérifie les variables Vercel.');
}
if (!appUrl) {
  console.warn('[set-env] ATTENTION : APP_URL manquant — ajoute-le dans les variables Vercel.');
}

const dev = `export const environment = {
  production: false,
  appUrl: 'http://localhost:4200',
  supabase: {
    url: '${url}',
    anonKey: '${anonKey}'
  }
};
`;

const prod = `export const environment = {
  production: true,
  appUrl: '${appUrl}',
  supabase: {
    url: '${url}',
    anonKey: '${anonKey}'
  }
};
`;

const dir = path.join(__dirname, '..', 'src', 'environments');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'environment.ts'), dev);
fs.writeFileSync(path.join(dir, 'environment.prod.ts'), prod);

console.log('[set-env] Fichiers environment générés.');
