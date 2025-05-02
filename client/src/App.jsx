// @ts-nocheck
import { useState, useRef } from 'react';
import './styles.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula, atomDark, vs, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(darcula);
  const [openFolders, setOpenFolders] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const contentRef = useRef(null);

  const themes = {
    'Dark (Darcula)': darcula,
    'Dark (Atom Dark)': atomDark,
    'Light (VS Code)': vs,
    'Light (Solarized)': solarizedlight,
  };

  // Function to fetch repository contents
  const handleGetFiles = async () => {
    setError(null);
    setRepoData(null);
    setSelectedFiles([]);
    setOpenFolders({});

    if (!repoUrl) {
      setError('Please enter a GitHub repository URL.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/fetch-repo-contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoLink: repoUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        setRepoData(data);
      } else {
        setError(data.error || 'Failed to fetch repository contents.');
      }
    } catch (err) {
      setError('Error connecting to the backend. Please ensure the server is running.');
    }
  };

  // Function to toggle folder open/close state
  const toggleFolder = (path) => {
    setOpenFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Function to handle file selection
  const handleFileSelect = (file) => {
    setSelectedFiles((prev) => {
      if (prev.some((f) => f.path === file.path)) {
        return prev.filter((f) => f.path !== file.path);
      }
      return [...prev, file];
    });
  };

  // Function to clear selected files
  const clearSelection = () => {
    setSelectedFiles([]);
  };

  // Function to save displayed content as PDF
  const handleSaveAsPDF = async () => {
    if (!contentRef.current || selectedFiles.length === 0) {
      setError('No files selected to print!');
      return;
    }

    const fileName = prompt('Enter a name for the PDF File: ');
    if (!fileName) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // Margin in mm
    const contentWidth = pageWidth - 2 * margin;
    let position = margin; // Start position on the page

    const fileElements = contentRef.current.querySelectorAll('.selected-file');

    for (let i = 0; i < fileElements.length; i++) {
      const fileElement = fileElements[i];

      // Temporarily hide all other file elements to capture only the current one
      for (let j = 0; j < fileElements.length; j++) {
        if (j !== i) {
          fileElements[j].style.display = 'none';
        }
      }
      fileElement.style.display = 'block';

      // Capture the file's content as an image
      const canvas = await html2canvas(fileElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // Check if the content fits on the current page
      if (position + imgHeight + margin > pageHeight) {
        pdf.addPage();
        position = margin; // Reset position for the new page
      }

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, imgHeight);
      position += imgHeight + margin; // Update position for the next file

      // Restore the display of all file elements
      for (let j = 0; j < fileElements.length; j++) {
        fileElements[j].style.display = 'block';
      }
    }

    pdf.save(`${fileName}.pdf`);
  };

  // Function to determine the language based on file extension
  const getLanguage = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    const languageMap = {
      'py': 'python',
      'md': 'markdown',
      'js': 'javascript',
      'json': 'json',
      'html': 'html',
      'css': 'css',
      'txt': 'plaintext'
    };
    return languageMap[extension] || 'plaintext';
  };

  // Function to render repository structure
  const renderStructure = (contents, indentLevel = 0) => {
    return contents.map((item, index) => (
      <div key={index}>
        {item.type === 'folder' ? (
          <div>
            <div
              className="folder-item"
              onClick={() => toggleFolder(item.path)}
              style={{ marginLeft: `${indentLevel * 20}px` }}
            >
              <span className={`arrow ${openFolders[item.path] ? 'open' : ''}`}>▶</span>
              📁 {item.path.split('/').pop()}
            </div>
            {openFolders[item.path] && (
              <div className="file-list">
                {renderStructure(item.contents, indentLevel + 1)}
              </div>
            )}
          </div>
        ) : (
          <div
            className="file-item"
            style={{ marginLeft: `${indentLevel * 20}px` }}
            onClick={() => handleFileSelect(item)}
          >
            File: {item.path}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="container">
      <h1>GitHub Repository Viewer</h1>
      <div className="input-container">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="Enter GitHub repo URL (e.g., https://github.com/user/repo)"
        />
        <button className="get-files" onClick={handleGetFiles}>
          Get Files
        </button>
        {selectedFiles.length > 0 && (
          <>
            <button className="save-pdf" onClick={handleSaveAsPDF}>
              Save as PDF
            </button>
            <button className="clear-selection" onClick={clearSelection}>
              Clear Selection
            </button>
          </>
        )}
      </div>

      {repoData && (
        <div className="theme-selector">
          <label>Select Theme: </label>
          <select onChange={(e) => setTheme(themes[e.target.value])}>
            {Object.keys(themes).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {repoData && (
        <div className="repo-content">
          <h2>
            Repository: {repoData.owner}/{repoData.repo}
          </h2>
          <div className="content-area">
            <div className="repo-structure">
              {repoData.contents.length > 0 ? (
                renderStructure(repoData.contents)
              ) : (
                <p>No files found in the repository.</p>
              )}
            </div>
            {selectedFiles.length > 0 && (
              <div className="selected-file-content" ref={contentRef}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="selected-file">
                    <h3>File: {file.path}</h3>
                    <SyntaxHighlighter
                      language={getLanguage(file.path)}
                      style={theme}
                      wrapLines={true}
                      customStyle={{ fontSize: '0.9rem', borderRadius: '5px' }}
                    >
                      {file.content || 'Loading...'}
                    </SyntaxHighlighter>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;