import React, { useState } from "react";
import axios from "axios";

const RepoViewer = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [files, setFiles] = useState([]);

    const fetchRepoFiles = async () => {
        if (!repoUrl) return alert("Enter a GitHub repository URL!");

        try {
            const response = await axios.get(`http://localhost:5000/api/repo?url=${repoUrl}`);
            setFiles(response.data);
        } catch (error) {
            console.error("Error fetching repo:", error);
            alert("Failed to fetch repo contents.");
        }
    };

    return (
        <div className="repo-viewer">
            <input
                type="text"
                placeholder="Enter GitHub Repo URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
            />
            <button onClick={fetchRepoFiles}>Load Files</button>

            <div className="file-list">
                {files.length > 0 && <h2>Python Files:</h2>}
                {files.map((file) => (
                    <div key={file.path} className="file-item">
                        <h3>{file.name}</h3>
                        <a href={file.download_url} target="_blank" rel="noopener noreferrer">
                            View Code
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RepoViewer;