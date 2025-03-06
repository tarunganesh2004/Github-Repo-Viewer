import React, { useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const RepoViewer = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [files, setFiles] = useState([]);
    const [fileContents, setFileContents] = useState({});
    const contentRef = useRef(null);

    const fetchRepoFiles = async () => {
        if (!repoUrl) return alert("Enter a GitHub repository URL!");

        try {
            const response = await axios.get(`http://localhost:5000/api/repo?url=${repoUrl}`);
            setFiles(response.data);

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

    const saveAsPDF = async () => {
        if (!contentRef.current) {
            alert("Nothing to print!");
            return;
        }

        const pdf = new jsPDF("p", "mm", "a4");
        const content = contentRef.current;

        // Capture the content as a canvas
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");

        // Calculate dimensions for multi-page PDF
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width; // Scale height to maintain aspect ratio
        let position = 0;

        // Add pages dynamically
        while (position < imgHeight) {
            pdf.addImage(imgData, "PNG", 0, position * -1, imgWidth, imgHeight);
            position += 297; // A4 height in mm
            if (position < imgHeight) pdf.addPage();
        }

        pdf.save("github_repo.pdf");
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
            <button onClick={saveAsPDF} className="pdf-button">Save as PDF</button>

            {/* ✅ Printable content wrapped inside a div */}
            <div ref={contentRef} className="file-list">
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
