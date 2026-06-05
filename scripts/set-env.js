const fs   = require('fs');
const path = require('path');

const url     = process.env.SUPABASE_URL      || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const appUrl  = process.env.APP_URL           || 'https://suqad-p-lay-c879.vercel.app';

if (!url || !anonKey) {
  console.warn('[set-env] SUPABASE_URL ou SUPABASE_ANON_KEY manquant — vérifie les variables Vercel.');
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
