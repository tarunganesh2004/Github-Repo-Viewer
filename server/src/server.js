require('dotenv').config();
const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');
const { fetchRepoContents } = require('./utils/github');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('GitHub Repo to PDF Backend');
});

app.post('/generate-pdf', async (req, res) => {
    const { repoLink } = req.body;

    // Extract owner and repo from the GitHub link
    const repoPath = repoLink.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoPath) {
        return res.status(400).json({ error: 'Invalid GitHub repo link. Please provide a valid repository URL (e.g., https://github.com/user/repo).' });
    }

    const [_, owner, repo] = repoPath;

    // Validate that the URL points to a repository, not a user profile
    if (!repo || repo.includes('.')) {
        return res.status(400).json({ error: 'The provided URL does not point to a repository. Please use a valid repo URL (e.g., https://github.com/user/repo).' });
    }

    // Initialize PDF document with margins
    const doc = new PDFDocument({ margin: 40 });
    let buffers = [];

    // Collect PDF data in buffers
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${repo}.pdf`);
        res.send(pdfData);
    });

    // Add a title to the PDF
    doc.fontSize(18).text(`Repository: ${owner}/${repo}`, { align: 'center' });
    doc.moveDown(2);

    // List of known binary file extensions to skip
    const binaryExtensions = ['.pyc', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.exe', '.bin', '.zip', '.tar', '.gz', '.pdf'];

    // Function to check if content is likely text
    function isLikelyText(content) {
        // Check for null bytes or excessive non-ASCII characters
        const nullByteCount = (content.match(/\0/g) || []).length;
        const nonAsciiCount = (content.match(/[^\x00-\x7F]/g) || []).length;
        return nullByteCount === 0 && nonAsciiCount / content.length < 0.1; // Less than 10% non-ASCII
    }

    // Function to recursively fetch and add repo contents to the PDF
    async function addRepoContentsToPDF(path = '') {
        try {
            const contents = await fetchRepoContents(owner, repo, path);

            for (const item of contents) {
                // Check if adding this item would exceed the page height
                const currentY = doc.y;
                const pageHeight = doc.page.height - doc.page.margins.bottom;

                if (item.type === 'dir') {
                    // Estimate space needed for folder name
                    if (currentY + 20 > pageHeight) {
                        doc.addPage();
                    }

                    // Add folder name to PDF
                    doc.fontSize(14).text(`Folder: ${item.path}`, { underline: true });
                    doc.moveDown(0.5);

                    // Recursively process the folder
                    await addRepoContentsToPDF(item.path);
                } else if (item.type === 'file') {
                    // Skip files with binary extensions or no download URL
                    const isBinaryExtension = binaryExtensions.some(ext => item.name.toLowerCase().endsWith(ext));
                    if (isBinaryExtension || !item.download_url) {
                        console.log(`Skipping file: ${item.name} (binary extension or no download URL)`);
                        continue;
                    }

                    // Fetch file content with error handling
                    try {
                        const fileResponse = await fetch(item.download_url);
                        if (!fileResponse.ok) {
                            throw new Error(`HTTP error ${fileResponse.status}`);
                        }

                        // Check the Content-Type header
                        const contentType = fileResponse.headers.get('Content-Type') || '';
                        if (!contentType.includes('text') && !contentType.includes('json') && !contentType.includes('xml')) {
                            console.log(`Skipping file: ${item.name} (Content-Type: ${contentType} is not text)`);
                            continue;
                        }

                        const content = await fileResponse.text();

                        // Validate that the content is likely text
                        if (!isLikelyText(content)) {
                            console.log(`Skipping file: ${item.name} (content appears to be binary)`);
                            continue;
                        }

                        // Estimate space needed for file content
                        const lines = content.split('\n');
                        const approxHeight = 20 + (lines.length * 12); // 20 for file name, 12 per line

                        if (currentY + approxHeight > pageHeight) {
                            doc.addPage();
                        }

                        // Add file name and content to PDF
                        doc.fontSize(12).text(`File: ${item.path}`, { underline: true });
                        doc.moveDown(0.5);

                        doc.fontSize(10);
                        for (const line of lines) {
                            doc.text(line.substring(0, 180)); // Truncate long lines
                        }
                        doc.moveDown(1); // Space between files
                    } catch (fetchError) {
                        console.error(`Failed to fetch file ${item.path}: ${fetchError.message}`);
                        continue; // Skip this file and proceed
                    }
                }
            }
        } catch (error) {
            throw new Error(`Error processing repo contents: ${error.message}`);
        }
    }

    try {
        await addRepoContentsToPDF();
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});