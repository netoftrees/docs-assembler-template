import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

function run(cmd: string, cwd: string = ROOT): string {

    return execSync(
        cmd,
        {
            cwd,
            encoding: 'utf8',
            stdio: 'pipe'
        }
    ).trim();
}

async function main() {

    // Read version from package.json
    const pkgPath = path.join(
        ROOT,
        'package.json'
    );

    const pkgJson = await fs.readFile(
        pkgPath,
        'utf8'
    );

    const pkg = JSON.parse(pkgJson);
    const version = pkg.version;
    const tag = `v${version}`;

    console.log(`🚀 Releasing ${tag}...`);

    // Detect current branch
    let branch: string;

    try {

        branch = run('git rev-parse --abbrev-ref HEAD');
    }
    catch {

        console.error('❌ Not a git repository or no commits yet.');

        process.exit(1);
    }

    if (branch === 'HEAD') {

        console.error('❌ Detached HEAD state. Checkout a branch first.');

        process.exit(1);
    }

    // Check if tag already exists
    try {

        run(`git rev-parse ${tag}`);

        console.error(`❌ Tag ${tag} already exists.`);
        console.error('   Bump version in package.json if you want a new release.');

        process.exit(1);
    }
    catch {
        // Tag doesn't exist — good
    }

    // Check if _distribution/ has anything to commit
    const status = run('git status --porcelain _distribution/');

    if (!status) {

        console.log('⚠️  No changes in _distribution/ to commit.');
        console.log('   Did you run yarn build:package first?');

        process.exit(1);
    }

    // Stage only _distribution/ changes
    console.log('📦 Staging _distribution/...');

    run('git add -A');

    // Commit
    const commitMsg = `chore: release ${tag}`;

    console.log(`💾 Committing: ${commitMsg}...`);

    run(`git commit -m "${commitMsg}"`);

    // Create annotated tag
    console.log(`🏷️  Tagging ${tag}...`);

    run(`git tag -a ${tag} -m "${tag}"`);

    // Push
    console.log(`⬆️  Pushing ${branch} and ${tag}...`);

    run(`git push origin ${branch}`);
    run(`git push origin ${tag}`);

    console.log('\n✅ Released!');
    console.log(`   Version: ${version}`);
    console.log(`   Tag:     ${tag}`);
    console.log(`   Branch:  ${branch}`);
    console.log(`\n   jsDelivr URLs will be available in ~1 minute:`);
    console.log(`   https://cdn.jsdelivr.net/gh/netoftrees/docs-assembler-template@${tag}/_distribution/latest/manifest.json`);
}

main().catch(err => {

    console.error('\n❌ Release failed:', err);

    process.exit(1);
});