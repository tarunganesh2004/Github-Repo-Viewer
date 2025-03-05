import React, { useState } from "react";
import axios from "axios";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const RepoViewer = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [files, setFiles] = useState([]);
    const [fileContents, setFileContents] = useState({});

    const contentRef = useRef();

    const fetchRepoFiles = async () => {
        if (!repoUrl) return alert("Enter a GitHub repository URL!");

        try {
            const response = await axios.get(`http://localhost:5000/api/repo?url=${repoUrl}`);
            setFiles(response.data);

            // Fetch file contents for each Python file
            const contentPromises = response.data.map(async (file) => {
                const contentRes = await axios.get(file.download_url);
                return { [file.name]: contentRes.data };
            });

            const contents = await Promise.all(contentPromises);
            const mergedContents = Object.assign({}, ...contents);
            setFileContents(mergedContents);
        } catch (error) {
            console.error("Error fetching repo:", error);
            alert("Failed to fetch repo contents.");
        }
    };

    const handlePrint = useReactToPrint({
        content: () => contentRef.current,
    });

    return (
        <div className="repo-viewer">
            <input
                type="text"
                placeholder="Enter GitHub Repo URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
            />
            <button onClick={fetchRepoFiles}>Load Files</button>
            <button onClick={handlePrint} className="pdf-button">Save as PDF</button>

            <div className="file-list" ref={contentRef}>
                {files.length > 0 && <h2>Python Files:</h2>}
                {files.map((file) => (
                    <div key={file.path} className="file-item">
                        <h3>{file.name}</h3>
                        <pre className="code-block">{fileContents[file.name] || "Loading..."}</pre>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RepoViewer;