import { config } from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: resolve(__dirname, '..', '.env') });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Start tsx with the server file
const tsx = spawn('npx', ['tsx', 'watch', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: resolve(__dirname, '..'),
  env: process.env
});

tsx.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

tsx.on('exit', (code) => {
  process.exit(code || 0);
});


