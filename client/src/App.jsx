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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New state for loading
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
    setSearchQuery('');
    setIsLoading(true); // Start loading

    if (!repoUrl) {
      setError('Please enter a GitHub repository URL.');
      setIsLoading(false);
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
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Function to select all files
  const handleSelectAllFiles = () => {
    if (!repoData) return;

    const allFiles = [];
    const collectFiles = (contents) => {
      contents.forEach((item) => {
        if (item.type === 'file') {
          allFiles.push(item);
        } else if (item.type === 'folder') {
          collectFiles(item.contents);
        }
      });
    };

    collectFiles(repoData.contents);
    setSelectedFiles(allFiles);
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

    setIsLoading(true); // Start loading
    const fileName = prompt('Enter a name for the PDF File: ');
    if (!fileName) {
      setIsLoading(false);
      return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10; // Margin in mm
    const contentWidth = pageWidth - 2 * margin;
    const usablePageHeight = pageHeight - 2 * margin; // Usable height per page

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

      // Ensure the element is fully rendered by temporarily setting its height
      const originalHeight = fileElement.style.height;
      fileElement.style.height = 'auto';
      fileElement.style.overflow = 'visible';

      // Capture the full content of the file element
      const canvas = await html2canvas(fileElement, {
        scale: 2,
        useCORS: true,
        scrollY: 0, // Ensure we start from the top
        height: fileElement.scrollHeight, // Capture the full height
      });
      const imgData = canvas.toDataURL('image/jpeg');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // Restore the element's original styles
      fileElement.style.height = originalHeight;
      fileElement.style.overflow = 'auto';

      // Split the content across multiple pages if necessary
      let remainingHeight = imgHeight;
      let positionInImage = 0;

      while (remainingHeight > 0) {
        const heightToRender = Math.min(remainingHeight, usablePageHeight);
        const clipHeight = (heightToRender / imgHeight) * canvas.height;

        // Create a temporary canvas to clip the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = clipHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0,
          positionInImage * (canvas.height / imgHeight),
          canvas.width,
          clipHeight,
          0,
          0,
          canvas.width,
          clipHeight
        );
        const clippedImgData = tempCanvas.toDataURL('image/jpeg');

        // Add the clipped image to the PDF
        pdf.addImage(clippedImgData, 'PNG', margin, margin, contentWidth, heightToRender);

        remainingHeight -= heightToRender;
        positionInImage += heightToRender;

        if (remainingHeight > 0) {
          pdf.addPage(); // Add a new page for the remaining content
        }
      }

      // Add a new page for the next file if there are more files
      if (i < fileElements.length - 1) {
        pdf.addPage();
      }

      // Restore the display of all file elements
      for (let j = 0; j < fileElements.length; j++) {
        fileElements[j].style.display = 'block';
      }
    }

    pdf.save(`${fileName}.pdf`);
    setIsLoading(false); // Stop loading
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
      'txt': 'plaintext',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sh': 'bash',
      'sql': 'sql',
    };
    return languageMap[extension] || 'plaintext';
  };

  // Function to get the icon for a file based on its extension
  const getFileIcon = (filePath) => {
    const extension = filePath.split('.').pop().toLowerCase();
    const iconMap = {
      'py': '🐍',
      'java': '☕',
      'js': '📜',
      'json': '📋',
      'html': '🌐',
      'css': '🎨',
      'txt': '📄',
      'md': '📝',
      'cpp': '💻',
      'c': '💻',
      'cs': '💻',
      'xml': '📄',
      'yaml': '📋',
      'yml': '📋',
      'sh': '🐚',
      'sql': '🗃️',
    };
    return iconMap[extension] || '📄'; // Default icon for unknown extensions
  };

  // Function to check if a file or folder matches the search query
  const matchesSearchQuery = (item, query) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    if (item.type === 'file') {
      return item.path.toLowerCase().includes(lowerQuery);
    }
    // For folders, check if the folder name matches or if any children match
    return (
      item.path.toLowerCase().includes(lowerQuery) ||
      (item.contents && item.contents.some((child) => matchesSearchQuery(child, query)))
    );
  };

  // Function to highlight matching text in the file name
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return (
      <>
        {before}
        <span className="highlight">{match}</span>
        {after}
      </>
    );
  };

  // Function to render repository structure with search filtering
  const renderStructure = (contents, indentLevel = 0) => {
    // Filter contents based on search query
    const filteredContents = contents.filter((item) =>
      matchesSearchQuery(item, searchQuery)
    );

    if (filteredContents.length === 0) {
      return <p>No files match your search.</p>;
    }

    return filteredContents.map((item, index) => (
      <div key={index}>
        {item.type === 'folder' ? (
          <div>
            <div
              className="folder-item"
              onClick={() => toggleFolder(item.path)}
              style={{ marginLeft: `${indentLevel * 20}px` }}
            >
              <span className={`arrow ${openFolders[item.path] ? 'open' : ''}`}>
                ▶
              </span>
              📁 {highlightMatch(item.path.split('/').pop(), searchQuery)}
            </div>
            {(openFolders[item.path] || searchQuery) && (
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
            <span className="file-icon">{getFileIcon(item.path)}</span>
            File: {highlightMatch(item.path, searchQuery)}
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
        <button className="get-files" onClick={handleGetFiles} disabled={isLoading}>
          {isLoading ? <span className="spinner"></span> : 'Get Files'}
        </button>
        {repoData && (
          <button className="select-all" onClick={handleSelectAllFiles}>
            Select All Files
          </button>
        )}
        {selectedFiles.length > 0 && (
          <>
            <button className="save-pdf" onClick={handleSaveAsPDF} disabled={isLoading}>
              {isLoading ? <span className="spinner"></span> : 'Save as PDF'}
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
              <input
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
              />
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
                      showLineNumbers={true}
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