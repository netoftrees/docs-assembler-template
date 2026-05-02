import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

interface AssetFile {
    baseName: string;
    hashedName: string;
    fullPath: string;
}

async function getBuiltAssets(buildDir: string): Promise<AssetFile[]> {

    const assets: AssetFile[] = [];

    const entries = await fs.readdir(
        buildDir, 
        { withFileTypes: true }
    );

    for (const entry of entries) {

        if (!entry.isFile()) {
            continue;
        }

        // Match Vite hashed filenames: name.hash.js/css
        // Hash uses base64url alphabet (A-Z, a-z, 0-9, _, -)
        const match = entry.name.match(/^([^.]+)\.([a-zA-Z0-9_-]+)\.(js|css)$/);

        if (match) {

            assets.push({
                baseName: match[1],
                hashedName: entry.name,
                fullPath: path.join(buildDir, entry.name)
            });
        } 
        
        else if (
            entry.name.endsWith('.js') 
            || entry.name.endsWith('.css'

            )) {
            assets.push({
                baseName: entry.name.replace(/\.(js|css)$/, ''),
                hashedName: entry.name,
                fullPath: path.join(buildDir, entry.name)
            });
        }
    }

    return assets;
}

async function updateReferences(
    assets: AssetFile[], 
    searchDirs: string[]
): Promise<void> {

    // Build patterns that match old hashed OR unhashed filenames
    const patterns = assets.map(asset => {

        const ext = path.extname(asset.hashedName);

        const escapedExt = ext.replace(
            '.', 
            '\\.'
        );

        const escapedBase = asset.baseName.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );

        // Match: baseName.<any-hash>.ext OR baseName.ext
        // Uses \b (word boundary) to avoid partial matches inside other names
        const regex = new RegExp(
            `\\b(${escapedBase})(?:\\.[a-zA-Z0-9_-]+)?(${escapedExt})\\b`,
            'g'
        );

        return { 
            regex, 
            replacement: asset.hashedName 
        };
    });

    console.log('   Replacements:');

    for (const asset of assets) {

        console.log(`      ${asset.baseName}.* → ${asset.hashedName}`);
    }

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
            if (!entry.isFile()) continue;
            if (!/\.(html|md|liquid|njk|yml|yaml)$/i.test(entry.name)) continue;

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

                // Reset lastIndex for global regex
                regex.lastIndex = 0;

                if (regex.test(content)) {

                    regex.lastIndex = 0;

                    content = content.replace(
                        regex, 
                        replacement
                    );

                    modified = true;
                }

                regex.lastIndex = 0;
            }

            if (modified) {

                await fs.writeFile(
                    filePath, 
                    content, 
                    'utf8'
                );

                console.log(`   ✓ ${path.relative(ROOT, filePath)}`);
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

    const exists = await fs
        .access(buildDir)
        .then(() => true)
        .catch(() => false);

    if (!exists) {

        console.error('❌ No build found. Run "yarn build" first.');

        process.exit(1);
    }

    console.log('📋 Scanning built assets...');

    const assets = await getBuiltAssets(buildDir);

    if (assets.length === 0) {

        console.error('❌ No assets found in build/assets/');

        process.exit(1);
    }

    console.log(`   Found ${assets.length}`);

    // Clean and copy
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

        await fs.copyFile(
            asset.fullPath,
            path.join(
                targetDir,
                asset.hashedName
            )
        );
    }

    console.log(`   ✓ ${assets.length} files copied`);

    // Update Jekyll references
    console.log(`\n🔄 Updating _includes and _layouts...`);

    await updateReferences(
        assets,
        [
            'docs/_includes',
            'docs/_layouts']
    );

    console.log('\n✅ Local docs assets updated!');
}

main().catch(err => {

    console.error('❌ Error:', err);

    process.exit(1);
});