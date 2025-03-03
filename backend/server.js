// @ts-nocheck
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/repo", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Repository URL is required" });

    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });

    const [_, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/`;

    try {
        const response = await axios.get(apiUrl);
        const pythonFiles = response.data.filter(file => file.name.endsWith(".py"));
        res.json(pythonFiles);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch repository contents" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));