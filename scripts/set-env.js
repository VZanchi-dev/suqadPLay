const fs   = require('fs');
const path = require('path');

const url     = process.env.SUPABASE_URL      || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';

if (!url || !anonKey) {
  console.warn('[set-env] SUPABASE_URL ou SUPABASE_ANON_KEY manquant — vérifie les variables Vercel.');
}

const dev = `export const environment = {
  production: false,
  supabase: {
    url: '${url}',
    anonKey: '${anonKey}'
  }
};
`;

const prod = `export const environment = {
  production: true,
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
