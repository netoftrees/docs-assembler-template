import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

interface PackageJson {
    version: string;
}

async function copyDir(
    src: string, 
    dest: string
): Promise<void> {

    const entries = await fs.readdir(src, { withFileTypes: true });

    await Promise.all(

        entries.map(

            async (entry) => {

                const srcPath = path.join(src, entry.name);
                const destPath = path.join(dest, entry.name);

                if (entry.isDirectory()) {

                    await fs.mkdir(destPath, { recursive: true });
                    await copyDir(srcPath, destPath);
                }
                else {
                    await fs.copyFile(srcPath, destPath);
                }
            }
        )
    );
}

async function createZip(
    sourceDir: string, 
    outputPath: string
): Promise<void> {

    return new Promise(
        
        (resolve, reject) => {

        const output = createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', reject);

        archive.on('warning', (err: any) => {

            if (err.code === 'ENOENT') {

                console.warn('Archive warning:', err);
            }
            else {

                throw err;
            }
        });

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function main() {

    // Build first
    console.log('🔨 Running vite build...');
    execSync('vite build', { cwd: ROOT, stdio: 'inherit' });

    // Get version from package.json
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg: PackageJson = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const version = pkg.version;

    const buildDir = path.join(ROOT, 'build', 'assets');

    // Define destinations
    const fragmentRendererDir = path.join(ROOT, 'docs', 'assets', 'FragmentRenderer');
    const versionDir = path.join(ROOT, '_distribution', version, 'assets');
    const latestDir = path.join(ROOT, '_distribution', 'latest', 'assets');

    const destinations = [fragmentRendererDir, versionDir, latestDir];

    // Process each destination
    for (const dest of destinations) {

        const relPath = path.relative(ROOT, dest);
        console.log(`\n📦 Packaging to ${relPath}...`);

        // Clear existing contents completely
        await fs.rm(dest, { recursive: true, force: true });

        // Create fresh directory
        await fs.mkdir(dest, { recursive: true });

        // Copy all build files (preserves Vite's hashed filenames)
        await copyDir(buildDir, dest);
        
        console.log(`   ✓ Copied build contents to ${relPath}`);
    }

    // Create zip archives
    console.log('\n📦 Creating zip archives...');
    
    const distDir = path.join(ROOT, '_distribution');
    const zipVersionPath = path.join(distDir, `docs-assembler-assets-${version}.zip`);
    const zipLatestPath = path.join(distDir, 'docs-assembler-assets-latest.zip');
    
    await createZip(buildDir, zipVersionPath);
    await createZip(buildDir, zipLatestPath);
    
    // Copy zips to versioned folders for CDN access
    await fs.copyFile(zipVersionPath, path.join(versionDir, '..', 'assets.zip'));
    await fs.copyFile(zipLatestPath, path.join(latestDir, '..', 'assets.zip'));

    // Generate manifest
    const manifest = {
        version,
        generatedAt: new Date().toISOString(),
        zipUrl: `https://cdn.jsdelivr.net/gh/netoftrees/docs-assembler-template@latest/_distribution/latest/assets.zip`,
        zipSize: (await fs.stat(zipLatestPath)).size,
        fileCount: (await fs.readdir(buildDir, { recursive: true })).filter(f => !f.includes('/')).length
    };

    await fs.writeFile(
        path.join(versionDir, '..', 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    await fs.writeFile(
        path.join(latestDir, '..', 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log(`\n✅ Complete! Version ${version} ready for commit.`);
    console.log(`   Zip: ${zipLatestPath} (${manifest.zipSize} bytes)`);
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});