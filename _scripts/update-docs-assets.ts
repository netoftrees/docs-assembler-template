import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

interface AssetFile {

    baseName: string;      // "guide", "index", "stepHook"
    hashedName: string;    // "guide.CwKy2Lnb.js"
    fullPath: string;
}

async function getBuiltAssets(buildDir: string): Promise<AssetFile[]> {

    const assets: AssetFile[] = [];

    const entries = await fs.readdir(
        buildDir,
        { withFileTypes: true }
    );

    for (const entry of entries) {

        if (entry.isFile()) {

            // Match vite filenames: name.hash.js or name-hash.js
            // Hash can be base64url style: letters, numbers, underscore, hyphen
            const match = entry.name.match(/^([^.]+)\.([a-zA-Z0-9_-]+)\.(js|css)$/);

            if (match) {

                assets.push({
                    baseName: match[1],           // "guide"
                    hashedName: entry.name,        // "guide.CwKy2Lnb.js"
                    fullPath: path.join(buildDir, entry.name)
                });
            }
            else if (entry.name.endsWith('.js')
                || entry.name.endsWith('.css')
            ) {
                // Handle non-hashed files
                const base = entry.name.replace(
                    /\.(js|css)$/,
                    ''
                );

                assets.push({
                    baseName: base,
                    hashedName: entry.name,
                    fullPath: path.join(buildDir, entry.name)
                });
            }
        }
    }
    return assets;
}

async function updateReferences(
    assets: AssetFile[],
    searchDirs: string[]
): Promise<void> {

    // Build patterns to match ANY hash for each base name
    // Matches: guide.ANYHASH.js or guide.js (no hash)
    const patterns: Array<{ regex: RegExp; replacement: string }> = [];

    for (const asset of assets) {

        const ext = path.extname(asset.hashedName); // .js or .css

        // Escape extension for regex (\.js or \.css)
        const escapedExt = ext.replace('.', '\\.');

        // Match basename followed by optional hash (alphanumeric, underscore, hyphen)
        // Examples: guide.js, guide.abc123.js, guide.DVMc3K2w.js
        const regex = new RegExp(
            `(${asset.baseName})(?:\\.[a-zA-Z0-9_-]+)?(${escapedExt})`,
            'g'
        );

        patterns.push({
            regex,
            replacement: asset.hashedName
        });
    }

    console.log('   Replacements to apply:');

    for (const asset of assets) {

        console.log(`      ${asset.baseName}.* -> ${asset.hashedName}`);
    }

    // Search and replace in _includes and _layouts
    for (const dir of searchDirs) {

        const dirPath = path.join(
            ROOT,
            dir
        );

        const exists = await fs
            .access(dirPath)
            .then(() => true)
            .catch(() => false);

        if (!exists) {
            continue;
        }

        const entries = await fs.readdir(
            dirPath,
            {
                recursive: true,
                withFileTypes: true
            }
        );

        for (const entry of entries) {

            if (!entry.isFile()) {
                continue;
            }

            if (/\.(html|md|liquid|njk|hbs|yml|yaml)$/.test(entry.name)) {

                const filePath = path.join(
                    entry.parentPath || dirPath,
                    entry.name
                );

                let content = await fs.readFile(
                    filePath,
                    'utf8'
                );

                let modified = false;

                for (const { regex, replacement } of patterns) {

                    // Test first, then replace (avoids unnecessary writes)
                    // But we must reset lastIndex if we use the same regex object twice
                    const hasMatch = regex.test(content);

                    if (hasMatch) {

                        regex.lastIndex = 0; // Reset before replace

                        content = content.replace(
                            regex,
                            replacement
                        );

                        modified = true;
                    }

                    regex.lastIndex = 0; // Reset for next iteration
                }

                if (modified) {

                    await fs.writeFile(
                        filePath,
                        content,
                        'utf8'
                    );

                    console.log(`   ✓ Updated ${path.relative(ROOT, filePath)}`);
                }
            }
        }
    }
}

async function main() {

    const buildDir = path.join(
        ROOT,
        'build',
        'assets'
    );

    const targetDir = path.join(
        ROOT,
        'docs',
        'assets',
        'FragmentRenderer'
    );

    // Check build exists
    const exists = await fs
        .access(buildDir)
        .then(() => true)
        .catch(() => false);

    if (!exists) {

        console.error('❌ Build directory not found. Run "yarn build" first.');
        process.exit(1);
    }

    console.log('📋 Scanning built assets...');
    const assets = await getBuiltAssets(buildDir);

    if (assets.length === 0) {

        console.error('❌ No hashed assets found in build/assets/');
        process.exit(1);
    }

    console.log(`   Found ${assets.length} assets`);

    // Clear and recreate target directory
    console.log(`\n📦 Copying to docs/assets/FragmentRenderer/...`);

    await fs.rm(
        targetDir,
        {
            recursive: true,
            force: true
        }
    );

    await fs.mkdir(
        targetDir,
        { recursive: true }
    );

    for (const asset of assets) {

        const targetPath = path.join(
            targetDir, 
            asset.hashedName
        );

        await fs.copyFile(
            asset.fullPath, 
            targetPath
        );

        console.log(`   ✓ ${asset.hashedName}`);
    }

    // Update references in Jekyll files
    console.log(`\n🔄 Updating references in _includes and _layouts...`);

    await updateReferences(
        assets, 
        [
            'docs/_includes', 
            'docs/_layouts'
        ]
    );

    console.log('\n✅ Docs assets updated!');
    console.log('   You can now run "yarn serve" to test locally.');
}

main().catch(err => {
    
    console.error('❌ Error:', err);
    process.exit(1);
});