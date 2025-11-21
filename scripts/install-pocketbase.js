/**
 * PocketBase Installation Script
 * Downloads and sets up PocketBase for local development
 */

import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'fs';
import { get } from 'https';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POCKETBASE_VERSION = '0.20.3';
const POCKETBASE_DIR = join(__dirname, '..', 'pocketbase');

// Determine platform
const getPlatform = () => {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'darwin_arm64' : 'darwin_amd64';
  } else if (platform === 'linux') {
    return arch === 'arm64' ? 'linux_arm64' : 'linux_amd64';
  } else if (platform === 'win32') {
    return 'windows_amd64';
  }

  throw new Error(`Unsupported platform: ${platform} ${arch}`);
};

const downloadPocketBase = async () => {
  try {
    const platform = getPlatform();
    const url = `https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${platform}.zip`;

    console.log(`Downloading PocketBase ${POCKETBASE_VERSION} for ${platform}...`);
    console.log(`URL: ${url}`);

    // Create pocketbase directory if it doesn't exist
    if (!existsSync(POCKETBASE_DIR)) {
      mkdirSync(POCKETBASE_DIR, { recursive: true });
    }

    const zipPath = join(POCKETBASE_DIR, 'pocketbase.zip');

    return new Promise((resolve, reject) => {
      const file = createWriteStream(zipPath);

      get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('✅ PocketBase downloaded successfully');
          resolve(zipPath);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error('❌ Failed to download PocketBase:', error.message);
    console.log('ℹ️  You can manually download PocketBase from:');
    console.log('   https://pocketbase.io/docs/');
    console.log('   and extract it to ./pocketbase/');
  }
};

const extractPocketBase = async (zipPath) => {
  try {
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(zipPath);

    console.log('Extracting PocketBase...');
    zip.extractAllTo(POCKETBASE_DIR, true);

    // Make executable (Unix systems)
    if (process.platform !== 'win32') {
      const pbPath = join(POCKETBASE_DIR, 'pocketbase');
      chmodSync(pbPath, 0o755);
    }

    console.log('✅ PocketBase extracted successfully');
    console.log(`📁 Location: ${POCKETBASE_DIR}`);
  } catch (error) {
    console.warn('⚠️  Could not extract automatically. Please extract manually.');
    console.log('   adm-zip package not available - this is optional');
  }
};

// Main
(async () => {
  console.log('🚀 Setting up PocketBase...\n');

  // Check if already installed
  const pbExecutable = process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase';
  const pbPath = join(POCKETBASE_DIR, pbExecutable);

  if (existsSync(pbPath)) {
    console.log('✅ PocketBase already installed at:', pbPath);
    console.log('\nTo start PocketBase:');
    console.log(`   cd ${POCKETBASE_DIR}`);
    console.log(`   ./${pbExecutable} serve`);
    return;
  }

  try {
    const zipPath = await downloadPocketBase();
    await extractPocketBase(zipPath);

    console.log('\n✅ Installation complete!');
    console.log('\nTo start PocketBase:');
    console.log(`   cd ${POCKETBASE_DIR}`);
    console.log(`   ./${pbExecutable} serve`);
    console.log('\nPocketBase admin UI will be available at:');
    console.log('   http://127.0.0.1:8090/_/');
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
  }
})();
