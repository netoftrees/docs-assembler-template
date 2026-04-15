import { promises as fs } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

// Configuration
const folderPath = 'root/_site'; // Path to Jekyll output
const templatePath = 'template.html'; // Path to HTML template in repo root
const treeSolveGuideSelector = '#treeSolveGuide'; // CSS selector for insertion


// Recursive function to get all HTML files in directory and subdirectories
async function getHtmlFiles(dir) {

    if (dir === 'root/_site/assets'
        || dir.endsWith('_frags')
    ) {
        return [];
    }

    const htmlFiles = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {

            // Recursively get HTML files from subdirectories
            const subFiles = await getHtmlFiles(fullPath);

            htmlFiles.push(...subFiles);
        }
        else {

            if (dir === 'root/_site') {
                continue;
            }

            if (entry.isFile()
                && (entry.name.endsWith('.html')
                    || entry.name.endsWith('.htm'))) {

                htmlFiles.push(fullPath);
            }
        }
    }

    return htmlFiles;
}

async function processHtmlFiles() {

    try {
        // Get all HTML files recursively
        const htmlFiles = await getHtmlFiles(folderPath);

        if (htmlFiles
            && htmlFiles.length > 0
        ) {
            // Read the HTML template
            let templateContent = await fs.readFile(templatePath, 'utf8');

            templateContent = templateContent.trim();

            if (!templateContent
                || templateContent.length === 0
            ) {
                console.error('Template file is empty or not found.');
                process.exit(1);
            }

            // Parse the template
            const dom = new JSDOM(templateContent);
            const document = dom.window.document;

            // Find the target <div> in the template
            const treeSolveGuideElement = document.querySelector(treeSolveGuideSelector);

            if (!treeSolveGuideElement) {

                console.warn(`No element matching ${treeSolveGuideSelector} found in template for ${file}. Skipping...`);
                process.exit(1);
            }

            // Process each HTML file
            for (const file of htmlFiles) {

                let fileContent = await fs.readFile(file, 'utf8');

                fileContent = fileContent.trim();

                // Skip empty files
                if (!fileContent
                    || fileContent.length === 0
                ) {
                    console.warn(`File ${file} is empty. Skipping...`);

                    continue;
                }

                if (!fileContent.startsWith('<!-- tsGuideRenderComment')) {

                    console.error(`File ${file} contents does not start with <!-- tsGuideRenderComment.`);

                    continue;
                }

                // Clear the target <div> to ensure it’s empty
                treeSolveGuideElement.innerHTML = '';

                if (!treeSolveGuideElement) {

                    console.warn(`No ${treeSolveGuideSelector} found in ${file}. Skipping...`);

                    continue;
                }

                // Clear the target <div> to ensure it’s empty
                treeSolveGuideElement.innerHTML = '';

                // Insert the snippet into the target <div>
                treeSolveGuideElement.insertAdjacentHTML('beforeend', fileContent);

                // Write modified HTML back
                await fs.writeFile(file, dom.serialize(), 'utf8');

                // console.log(`Modified ${file}`);
            }
        }

        console.log('HTML processing complete.');
    }
    catch (error) {

        console.error('Error processing files:', error);
        process.exit(1); // Exit with error code for Yarn
    }
}

await processHtmlFiles();
