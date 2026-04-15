import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

interface PackageJson {
    version: string;
}

async function copyDir(src: string, dest: string): Promise<void> {

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

async function main() {

    // Build first
    console.log('🔨 Running vite build...');
    execSync('vite build', { cwd: ROOT, stdio: 'inherit' });

    // Get version from package.json
    const pkgPath = path.join(ROOT, 'package.json');
    const pkg: PackageJson = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    const version = pkg.version;

    const buildDir = path.join(ROOT, 'build', 'assets');

    // Define all three destinations
    const destinations = [
        path.join(ROOT, 'docs', 'assets', 'FragmentRenderer'),
        path.join(ROOT, '_distribution', version, 'assets'),
        path.join(ROOT, '_distribution', 'latest', 'assets')
    ];

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

    console.log(`\n✅ Complete! Version ${version} ready for commit.`);
    console.log('   Staging areas cleared and repopulated with new hashed assets.');
}

main().catch(err => {
    
    console.error('❌ Error:', err);
    process.exit(1);
});