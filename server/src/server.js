require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { fetchRepoContents } = require('./utils/github');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('GitHub Repo to PDF Backend');
});

// Endpoint to fetch repository contents
app.post('/fetch-repo-contents', async (req, res) => {
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

    // List of known binary file extensions to skip
    const binaryExtensions = ['.pyc', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.exe', '.bin', '.zip', '.tar', '.gz', '.pdf'];

    // Files and directories to exclude
    const excludedFiles = ['license', '.gitignore', '.gitattributes', '.gitmodules'];
    const excludedDirs = ['venv', '.git', '__pycache__'];

    // Function to check if content is likely text
    function isLikelyText(content) {
        const nullByteCount = (content.match(/\0/g) || []).length;
        const nonAsciiCount = (content.match(/[^\x00-\x7F]/g) || []).length;
        return nullByteCount === 0 && nonAsciiCount / content.length < 0.1;
    }

    // Function to recursively fetch repo contents
    async function fetchContents(path = '') {
        const contents = await fetchRepoContents(owner, repo, path);
        const result = [];

        for (const item of contents) {
            if (item.type === 'dir') {
                // Skip excluded directories
                const dirName = item.name.toLowerCase();
                if (excludedDirs.includes(dirName)) {
                    console.log(`Skipping directory: ${item.path} (excluded directory)`);
                    continue;
                }

                // Recursively fetch contents of the directory
                const subContents = await fetchContents(item.path);
                result.push({
                    type: 'folder',
                    path: item.path,
                    contents: subContents
                });
            } else if (item.type === 'file') {
                // Skip files with binary extensions, no download URL, or excluded files
                const isBinaryExtension = binaryExtensions.some(ext => item.name.toLowerCase().endsWith(ext));
                const isExcludedFile = excludedFiles.some(excluded => item.name.toLowerCase() === excluded);
                if (isBinaryExtension || !item.download_url || isExcludedFile) {
                    console.log(`Skipping file: ${item.name} (${isBinaryExtension ? 'binary extension' : isExcludedFile ? 'excluded file' : 'no download URL'})`);
                    continue;
                }

                // Fetch file content
                try {
                    const fileResponse = await fetch(item.download_url);
                    if (!fileResponse.ok) {
                        throw new Error(`HTTP error ${fileResponse.status}`);
                    }

                    const contentType = fileResponse.headers.get('Content-Type') || '';
                    if (!contentType.includes('text') && !contentType.includes('json') && !contentType.includes('xml')) {
                        console.log(`Skipping file: ${item.name} (Content-Type: ${contentType} is not text)`);
                        continue;
                    }

                    const content = await fileResponse.text();
                    if (!isLikelyText(content)) {
                        console.log(`Skipping file: ${item.name} (content appears to be binary)`);
                        continue;
                    }

                    result.push({
                        type: 'file',
                        path: item.path,
                        content: content
                    });
                } catch (fetchError) {
                    console.error(`Failed to fetch file ${item.path}: ${fetchError.message}`);
                    continue;
                }
            }
        }

        return result;
    }

    try {
        const repoContents = await fetchContents();
        res.json({ owner, repo, contents: repoContents });
    } catch (error) {
        console.error('Error fetching repo contents:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});