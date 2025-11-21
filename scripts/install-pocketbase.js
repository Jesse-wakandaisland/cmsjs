/**
 * PocketBase Installation Script
 * Downloads and sets up PocketBase for local development using wget
 */

import { existsSync, chmodSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
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
    const zipPath = join(POCKETBASE_DIR, 'pocketbase.zip');

    console.log(`Downloading PocketBase ${POCKETBASE_VERSION} for ${platform}...`);
    console.log(`URL: ${url}\n`);

    // Use wget to download (follows redirects automatically)
    try {
      if (process.platform === 'win32') {
        // Windows: try curl (built-in on Windows 10+)
        execSync(`curl -L -o "${zipPath}" "${url}"`, { stdio: 'inherit' });
      } else {
        // Linux/Mac: use wget
        execSync(`wget -O "${zipPath}" "${url}"`, { stdio: 'inherit' });
      }
      console.log('✅ PocketBase downloaded successfully\n');
      return zipPath;
    } catch (error) {
      // Fallback to curl if wget not available
      console.log('wget not found, trying curl...\n');
      try {
        execSync(`curl -L -o "${zipPath}" "${url}"`, { stdio: 'inherit' });
        console.log('✅ PocketBase downloaded successfully\n');
        return zipPath;
      } catch (curlError) {
        throw new Error('Neither wget nor curl available. Please install wget or curl.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to download PocketBase:', error.message);
    console.log('\nℹ️  Manual installation:');
    console.log('   1. Download PocketBase from https://pocketbase.io/docs/');
    console.log('   2. Extract to ./pocketbase/');
    console.log('   3. Run: cd pocketbase && ./pocketbase serve\n');
    throw error;
  }
};

const extractPocketBase = async (zipPath) => {
  console.log('Extracting PocketBase...\n');

  try {
    if (process.platform === 'win32') {
      // Windows: use PowerShell
      execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${POCKETBASE_DIR}' -Force"`, { stdio: 'inherit' });
    } else {
      // Linux/Mac: use unzip
      execSync(`unzip -o "${zipPath}" -d "${POCKETBASE_DIR}"`, { stdio: 'inherit' });
    }

    // Make executable (Unix systems)
    if (process.platform !== 'win32') {
      const pbPath = join(POCKETBASE_DIR, 'pocketbase');
      chmodSync(pbPath, 0o755);
    }

    console.log('\n✅ PocketBase extracted successfully');
    console.log(`📁 Location: ${POCKETBASE_DIR}\n`);

    // Clean up zip file
    try {
      unlinkSync(zipPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  } catch (error) {
    console.error('❌ Failed to extract PocketBase:', error.message);
    console.log('\nℹ️  Please manually extract:');
    console.log(`   ${zipPath} to ${POCKETBASE_DIR}\n`);
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
    console.log('\n📋 To start PocketBase:');
    console.log('   npm run pocketbase');
    console.log('\n   Or manually:');
    console.log(`   cd pocketbase`);
    console.log(`   ./${pbExecutable} serve\n`);
    return;
  }

  try {
    const zipPath = await downloadPocketBase();
    await extractPocketBase(zipPath);

    console.log('✅ Installation complete!\n');
    console.log('📋 To start PocketBase:');
    console.log('   npm run pocketbase');
    console.log('\n   Or manually:');
    console.log(`   cd pocketbase`);
    console.log(`   ./${pbExecutable} serve\n`);
    console.log('🌐 PocketBase will be available at:');
    console.log('   Admin UI: http://127.0.0.1:8090/_/');
    console.log('   API:      http://127.0.0.1:8090/api/\n');
  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    console.log('\n📝 Manual installation:');
    console.log('   1. Download PocketBase from https://pocketbase.io/docs/');
    console.log('   2. Extract to ./pocketbase/');
    console.log('   3. Run: cd pocketbase && ./pocketbase serve\n');
    process.exit(1);
  }
})();
