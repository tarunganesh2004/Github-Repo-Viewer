// @ts-nocheck
import React, { useState, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula, atomDark, vs, solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism"; // Themes

const RepoViewer = () => {
    const [repoUrl, setRepoUrl] = useState("");
    const [files, setFiles] = useState([]);
    const [fileContents, setFileContents] = useState({});
    const [theme, setTheme] = useState(darcula); // ✅ Default theme
    const contentRef = useRef(null);

    // Available themes for selection
    const themes = {
        "Dark (Darcula)": darcula,
        "Dark (Atom Dark)": atomDark,
        "Light (VS Code)": vs,
        "Light (Solarized)": solarizedlight,
    };

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

        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL("image/jpeg");

        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 0;

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

            {/* ✅ Theme Selection Dropdown */}
            <label>Select Theme: </label>
            <select onChange={(e) => setTheme(themes[e.target.value])}>
                {Object.keys(themes).map((key) => (
                    <option key={key} value={key}>
                        {key}
                    </option>
                ))}
            </select>

            {/* ✅ Printable content wrapped inside a div */}
            <div ref={contentRef} className="file-list">
                {files.length > 0 && <h2>Python Files:</h2>}
                {files.map((file) => (
                    <div key={file.path} className="file-item">
                        <h3>{file.name}</h3>
                        <SyntaxHighlighter language="python" style={theme}>
                            {fileContents[file.name] || "Loading..."}
                        </SyntaxHighlighter>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RepoViewer;
