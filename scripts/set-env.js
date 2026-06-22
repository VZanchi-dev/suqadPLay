const fs   = require('fs');
const path = require('path');

const url     = process.env.SUPABASE_URL      || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const appUrl  = process.env.APP_URL           || '';

const missing = [
  !url      && 'SUPABASE_URL',
  !anonKey  && 'SUPABASE_ANON_KEY',
  !appUrl   && 'APP_URL',
].filter(Boolean);

if (missing.length > 0) {
  console.error(`[set-env] ERREUR : variables manquantes : ${missing.join(', ')}`);
  console.error('[set-env] Définis-les dans les variables d\'environnement Vercel avant de builder.');
  process.exit(1);
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
