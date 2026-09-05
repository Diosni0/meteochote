import { copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// Create dist/server directory
const distServerDir = join(rootDir, 'dist', 'server');
mkdirSync(distServerDir, { recursive: true });

// Copy server files to dist
try {
  copyFileSync(
    join(rootDir, 'server', 'index.js'),
    join(distServerDir, 'index.js')
  );
  console.log('Server files copied to dist/server/');
} catch (error) {
  console.error('Error copying server files:', error.message);
  process.exit(1);
}
