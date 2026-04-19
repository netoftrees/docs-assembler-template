import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream, createReadStream } from 'fs';
import { createHash } from 'crypto';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

type Strategy = 'overwrite' | 'skipIfExists' | 'cleanOverwrite' | 'merge' | 'addOnly';

interface SourceManifest {
    version: string;
    name: string;
    contents: Array<{
        source: string;
        dest: string;
        type: 'file' | 'directory';
        strategy?: Strategy;
        mergeType?: 'appendUnique' | 'jsonDeep' | 'lineByLine';
        description?: string;
    }>;
    routing: Record<string, string>;
}

interface InternalManifest {
    version: string;
    name: string;
    generatedAt: string;
    routing: Record<string, string>;
    files: Array<{
        path: string;
        strategy: Strategy;
        mergeType?: string;
        description?: string;
    }>;
}

interface ExternalManifest {
    version: string;
    name: string;
    generatedAt: string;
    zipName: string;
    zipSize: number;
    zipHash: string;
    fileCount: number;
}

async function copyDir(src: string, dest: string): Promise<void> {

    await fs.mkdir(
        dest,
        { recursive: true }
    );

    const entries = await fs.readdir(
        src,
        { withFileTypes: true }
    );

    for (const entry of entries) {

        const srcPath = path.join(
            src,
            entry.name
        );

        const destPath = path.join(
            dest,
            entry.name
        );

        if (entry.isDirectory()) {

            await copyDir(
                srcPath,
                destPath
            );
        }
        else {

            await fs.copyFile(
                srcPath,
                destPath
            );
        }
    }
}

async function* walkFiles(dir: string): AsyncGenerator<string> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkFiles(fullPath);
        } else {
            yield fullPath;
        }
    }
}

async function hashFile(filePath: string): Promise<string> {

    return new Promise((resolve, reject) => {

        const hash = createHash('sha256');
        const stream = createReadStream(filePath);

        stream.on(
            'error',
            reject
        );

        stream.on(
            'data',
            chunk => hash.update(chunk)
        );

        stream.on(
            'end',
            () => resolve(hash.digest('hex'))
        );
    });
}

async function createZip(
    sourceDir: string,
    outputPath: string
): Promise<void> {

    return new Promise((resolve, reject) => {

        const output = createWriteStream(outputPath);

        const archive = archiver(
            'zip',
            {
                zlib: { level: 9 }
            }
        );

        output.on(
            'close',
            () => resolve()
        );

        archive.on(
            'error',
            reject
        );

        archive.on(
            'warning', (err) => {

                if (err.code === 'ENOENT') {

                    console.warn('Archive warning:', err);
                }
                else {

                    throw err;
                }
            }
        );

        archive.pipe(output);

        archive.directory(
            sourceDir,
            false
        );

        archive.finalize();
    });
}

async function main() {

    const distDir = path.join(
        ROOT,
        '_distribution'
    );

    const manifestPath = path.join(
        distDir,
        'distribution.json'
    );

    const mainfestJson = await fs.readFile(
        manifestPath,
        'utf8'
    );

    const manifest: SourceManifest = JSON.parse(mainfestJson);

    console.log(`📋 Source: ${manifest.name} v${manifest.version}`);

    console.log('\n🔨 Running vite build...');

    execSync(
        'vite build',
        {
            cwd: ROOT,
            stdio: 'inherit'
        }
    );

    const pkgPath = path.join(
        ROOT,
        'package.json'
    );

    const packageJson = await fs.readFile(
        pkgPath,
        'utf8'
    );

    const pkg = JSON.parse(packageJson);
    const version = pkg.version;

    const stageDir = path.join(
        ROOT,
        '.staging'
    );

    console.log('\n📦 Staging...');

    await fs.rm(
        stageDir,
        {
            recursive: true,
            force: true
        }
    );

    await fs.mkdir(
        stageDir,
        { recursive: true }
    );

    for (const item of manifest.contents) {

        const srcPath = path.join(
            ROOT,
            item.source
        );

        const destPath = path.join(
            stageDir,
            item.dest
        );

        const exists = await fs
            .access(srcPath)
            .then(() => true)
            .catch(() => false);

        if (!exists) {

            console.log(`   ⚠️  Missing: ${item.source}`);

            continue;
        }

        await fs.mkdir(
            path.dirname(destPath),
            { recursive: true }
        );

        if (item.type === 'directory') {

            await copyDir(
                srcPath,
                destPath
            );

            console.log(`   ✓ ${item.source}/ → ${item.dest}/`);
        }
        else {

            await fs.copyFile(
                srcPath,
                destPath
            );

            console.log(`   ✓ ${item.source} → ${item.dest}`);
        }
    }

    // Build internal manifest (NO per-file hashes)
    console.log('\n📝 Building manifest...');


    const internalManifest: InternalManifest = {
        version,
        name: manifest.name,
        generatedAt: new Date().toISOString(),
        routing: manifest.routing,
        files: []
    };

    let fileCount = 0;

    for (const item of manifest.contents) {

        const stagedPath = path.join(
            stageDir,
            item.dest
        );

        const exists = await fs
            .access(stagedPath)
            .then(() => true)
            .catch(() => false);

        if (!exists) {
            continue;
        }

        const strategy = item.strategy || 'overwrite';

        if (item.type === 'file') {

            internalManifest.files.push({
                path: item.dest.replace(/\\/g, '/'),
                strategy,
                mergeType: item.mergeType,
                description: item.description
            });

            fileCount++;
        }
        else {

            for await (const filePath of walkFiles(stagedPath)) {

                const relativePath = path.relative(
                    stageDir,
                    filePath
                ).replace(/\\/g, '/');

                internalManifest.files.push({
                    path: relativePath,
                    strategy,
                    mergeType: item.mergeType,
                    description: item.description
                });

                fileCount++;
            }
        }
    }

    await fs.writeFile(
        path.join(
            stageDir,
            'manifest.json'
        ),
        JSON.stringify(
            internalManifest,
            null,
            2
        )
    );

    console.log(`   ${fileCount} entries`);

    const versionDir = path.join(
        distDir,
        version
    );

    const latestDir = path.join(
        distDir,
        'latest'
    );

    // ─── Guard against overwriting version history ───
    const versionExists = await fs
        .access(versionDir)
        .then(() => true)
        .catch(() => false);

    if (versionExists) {

        console.error(`\n❌ Version folder already exists: _distribution/${version}`);
        console.error('   Version history cannot be overwritten.');
        console.error(`   Delete _distribution/${version} first if you want to rebuild this version.`);

        process.exit(1);
    }

    // ─────────────────────────────────────────────────

    await fs.mkdir(
        versionDir,
        { recursive: true }
    );

    await fs.mkdir(
        latestDir,
        { recursive: true }
    );

    const zipName = `${manifest.name}.zip`;

    const versionZip = path.join(
        versionDir,
        zipName
    );

    const latestZip = path.join(
        latestDir,
        zipName
    );

    console.log('\n🗜️  Zipping...');

    await createZip(
        stageDir,
        versionZip
    );

    await fs.copyFile(
        versionZip,
        latestZip
    );

    // Hash the final zip ONLY
    const zipBuffer = await fs.readFile(latestZip);

    const zipHash = createHash('sha256')
        .update(zipBuffer)
        .digest('hex');

    const externalManifest: ExternalManifest = {
        version,
        name: manifest.name,
        generatedAt: new Date().toISOString(),
        zipName,
        zipSize: zipBuffer.length,
        zipHash,
        fileCount
    };

    await fs.writeFile(
        path.join(
            versionDir, 'manifest.json'
        ),
        JSON.stringify(
            externalManifest,
            null,
            2
        )
    );

    await fs.writeFile(
        path.join(
            latestDir,
            'manifest.json'
        ),
        JSON.stringify(
            externalManifest,
            null,
            2
        )
    );

    await fs.rm(
        stageDir,
        {
            recursive: true,
            force: true
        }
    );

    console.log('\n✅ Done');
    console.log(`   Version: ${version}`);
    console.log(`   Files: ${fileCount}`);
    console.log(`   Zip: ${(zipBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`   Zip hash: ${zipHash}`);
}

main().catch(err => {

    console.error('\n❌ Error:', err);

    process.exit(1);
});