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

// Download with redirect following
const downloadWithRedirect = (url, maxRedirects = 5) => {
  return new Promise((resolve, reject) => {
    const attemptDownload = (currentUrl, redirectCount) => {
      if (redirectCount > maxRedirects) {
        reject(new Error('Too many redirects'));
        return;
      }

      get(currentUrl, (response) => {
        const { statusCode, headers } = response;

        // Handle redirects
        if (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) {
          const redirectUrl = headers.location;
          if (!redirectUrl) {
            reject(new Error('Redirect without location header'));
            return;
          }

          console.log(`Following redirect to: ${redirectUrl}`);
          attemptDownload(redirectUrl, redirectCount + 1);
          return;
        }

        // Handle success
        if (statusCode === 200) {
          resolve(response);
          return;
        }

        // Handle error
        reject(new Error(`HTTP ${statusCode}`));
      }).on('error', reject);
    };

    attemptDownload(url, 0);
  });
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

    return new Promise(async (resolve, reject) => {
      try {
        const file = createWriteStream(zipPath);
        const response = await downloadWithRedirect(url);

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('✅ PocketBase downloaded successfully');
          resolve(zipPath);
        });

        file.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    console.error('❌ Failed to download PocketBase:', error.message);
    console.log('ℹ️  You can manually download PocketBase from:');
    console.log('   https://pocketbase.io/docs/');
    console.log('   and extract it to ./pocketbase/');
    throw error;
  }
};

const extractPocketBase = async (zipPath) => {
  console.log('Extracting PocketBase...');

  // Try using built-in unzip command first
  try {
    const { execSync } = await import('child_process');

    if (process.platform === 'win32') {
      execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${POCKETBASE_DIR}' -Force"`, { stdio: 'inherit' });
    } else {
      execSync(`unzip -o "${zipPath}" -d "${POCKETBASE_DIR}"`, { stdio: 'inherit' });
    }

    // Make executable (Unix systems)
    if (process.platform !== 'win32') {
      const pbPath = join(POCKETBASE_DIR, 'pocketbase');
      chmodSync(pbPath, 0o755);
    }

    console.log('✅ PocketBase extracted successfully');
    console.log(`📁 Location: ${POCKETBASE_DIR}`);
    return;
  } catch (error) {
    console.log('⚠️  System unzip not available, trying adm-zip...');
  }

  // Fall back to adm-zip
  try {
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(zipPath);

    zip.extractAllTo(POCKETBASE_DIR, true);

    // Make executable (Unix systems)
    if (process.platform !== 'win32') {
      const pbPath = join(POCKETBASE_DIR, 'pocketbase');
      chmodSync(pbPath, 0o755);
    }

    console.log('✅ PocketBase extracted successfully');
    console.log(`📁 Location: ${POCKETBASE_DIR}`);
  } catch (error) {
    console.warn('⚠️  Could not extract automatically.');
    console.log(`   Please manually extract ${zipPath} to ${POCKETBASE_DIR}`);
    throw error;
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
    console.log(`   cd pocketbase`);
    console.log(`   ./${pbExecutable} serve`);
    return;
  }

  try {
    const zipPath = await downloadPocketBase();
    await extractPocketBase(zipPath);

    console.log('\n✅ Installation complete!');
    console.log('\nTo start PocketBase:');
    console.log(`   cd pocketbase`);
    console.log(`   ./${pbExecutable} serve`);
    console.log('\nPocketBase admin UI will be available at:');
    console.log('   http://127.0.0.1:8090/_/');
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    console.log('\n📝 Manual installation:');
    console.log('   1. Download PocketBase from https://pocketbase.io/docs/');
    console.log('   2. Extract to ./pocketbase/');
    console.log('   3. Run: cd pocketbase && ./pocketbase serve');
    process.exit(1);
  }
})();
