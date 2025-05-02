async function getOctokit() {
    const { Octokit } = await import('@octokit/core');
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('GitHub token is not set. Please set GITHUB_TOKEN in your .env file.');
    }
    return new Octokit({ auth: token });
}

async function fetchRepoContents(owner, repo, path = '') {
    try {
        const octokit = await getOctokit();
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner,
            repo,
            path
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch repo contents: ${error.message}`);
    }
}

module.exports = { fetchRepoContents };