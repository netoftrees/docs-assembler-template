import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

interface DistributionManifest {
  version: string;
  name: string;
  contents: Array<{
    source: string;
    dest: string;
    type: 'file' | 'directory';
  }>;
  routing: Record<string, string>;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function createZip(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', reject);
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') console.warn('Archive warning:', err);
      else throw err;
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function countFiles(dir: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(dir, { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) count++;
  }
  return count;
}

async function main() {
  // Read source manifest
  const STAGE_DIR = path.join(ROOT, '.staging');
  const DIST_DIR = path.join(ROOT, '_distribution');
  const manifestPath = path.join(DIST_DIR, 'distribution.json');
  const manifest: DistributionManifest = JSON.parse(
    await fs.readFile(manifestPath, 'utf8')
  );

  console.log(`📋 Read manifest: ${manifest.name} v${manifest.version}`);
  console.log(`   ${manifest.contents.length} items to package`);

  // Build first
  console.log('\n🔨 Running vite build...');
  execSync('vite build', { cwd: ROOT, stdio: 'inherit' });

  // Get package version
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  const version = pkg.version;


  // Clean staging
  console.log('\n📦 Preparing staging area...');
  await fs.rm(STAGE_DIR, { recursive: true, force: true });
  await fs.mkdir(STAGE_DIR, { recursive: true });

  // Copy files according to manifest
  for (const item of manifest.contents) {
    const srcPath = path.join(ROOT, item.source);
    const destPath = path.join(STAGE_DIR, item.dest);
    
    const exists = await fs.access(srcPath).then(() => true).catch(() => false);
    if (!exists) {
      console.log(`   ⚠️  Skipping missing: ${item.source}`);
      continue;
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    
    if (item.type === 'directory') {
      await copyDir(srcPath, destPath);
      console.log(`   ✓ ${item.source}/ -> ${item.dest}/`);
    } else {
      await fs.copyFile(srcPath, destPath);
      console.log(`   ✓ ${item.source} -> ${item.dest}`);
    }
  }

  // Copy distribution.json into the zip (so extension can read it)
  const distributionInZip = path.join(STAGE_DIR, 'distribution.json');
  await fs.copyFile(manifestPath, distributionInZip);
  console.log(`   ✓ distribution.json -> distribution.json (packaged)`);

  // Create distribution directories
  const versionDir = path.join(DIST_DIR, version);
  const latestDir = path.join(DIST_DIR, 'latest');
  
  await fs.mkdir(versionDir, { recursive: true });
  await fs.mkdir(latestDir, { recursive: true });

  // Create zip
  const zipName = `${manifest.name}.zip`;
  const versionZip = path.join(versionDir, zipName);
  const latestZip = path.join(latestDir, zipName);
  const rootZip = path.join(DIST_DIR, `${manifest.name}-${version}.zip`);

  console.log('\n🗜️  Creating zip archives...');
  await createZip(STAGE_DIR, versionZip);
  
  await fs.copyFile(versionZip, latestZip);
  await fs.copyFile(versionZip, rootZip);

  // Generate output manifest (manifest.json) for extension
  const fileCount = await countFiles(STAGE_DIR);
  const zipStats = await fs.stat(latestZip);
  
  const outputManifest = {
    version,
    name: manifest.name,
    generatedAt: new Date().toISOString(),
    zipName,
    zipSize: zipStats.size,
    fileCount,
    routing: manifest.routing,
    contents: manifest.contents.map(c => ({
      path: c.dest,
      type: c.type
    }))
  };

  await fs.writeFile(
    path.join(versionDir, 'manifest.json'),
    JSON.stringify(outputManifest, null, 2)
  );
  await fs.writeFile(
    path.join(latestDir, 'manifest.json'),
    JSON.stringify(outputManifest, null, 2)
  );

  // Clean staging
  console.log('\n🧹 Cleaning up...');
  await fs.rm(STAGE_DIR, { recursive: true, force: true });

  console.log('\n✅ Complete!');
  console.log(`   Version: ${version}`);
  console.log(`   Files: ${fileCount} (including distribution.json)`);
  console.log(`   Size: ${(zipStats.size / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});