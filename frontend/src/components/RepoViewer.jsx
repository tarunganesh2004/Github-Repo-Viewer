import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";

const RepoViewer = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [files, setFiles] = useState([]);
    const [fileContents, setFileContents] = useState({});
    const [isContentReady, setIsContentReady] = useState(false); // ✅ Track when content is ready

    const contentRef = useRef(null); // ✅ Correctly reference the printable content

    useEffect(() => {
        console.log("Content Ref Assigned:", contentRef.current);
    }, [files]); // ✅ Ensure ref is updated when files change

    const fetchRepoFiles = async () => {
        if (!repoUrl) return alert("Enter a GitHub repository URL!");

        try {
            setIsContentReady(false); // ✅ Reset before loading new data

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

            setTimeout(() => setIsContentReady(true), 500); // ✅ Delay setting content ready
        } catch (error) {
            console.error("Error fetching repo:", error);
            alert("Failed to fetch repo contents.");
        }
    };

    const handlePrint = useReactToPrint({
        content: () => (isContentReady ? contentRef.current : null), // ✅ Only print if content is ready
        documentTitle: "GitHub Repo Code",
        onBeforePrint: () => console.log("Preparing PDF..."),
        onAfterPrint: () => console.log("PDF saved successfully!"),
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
            <button onClick={handlePrint} disabled={!isContentReady} className="pdf-button">
                Save as PDF
            </button>

            {/* ✅ Wrap printable content inside a div and attach ref */}
            <div ref={contentRef}>
                <div className="file-list">
                    {files.length > 0 && <h2>Python Files:</h2>}
                    {files.map((file) => (
                        <div key={file.path} className="file-item">
                            <h3>{file.name}</h3>
                            <pre className="code-block">{fileContents[file.name] || "Loading..."}</pre>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RepoViewer;
