// @ts-nocheck
import { useState } from 'react';
import './styles.css';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoData, setRepoData] = useState(null);
  const [error, setError] = useState(null);

  // Function to fetch repository contents
  const handleGetFiles = async () => {
    setError(null);
    setRepoData(null);

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

  // Function to save displayed content as PDF
  const handleSaveAsPDF = async () => {
    if (!repoData) return;

    try {
      const response = await fetch('http://localhost:3000/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: repoData.owner,
          repo: repoData.repo,
          contents: repoData.contents,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${repoData.repo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate PDF.');
      }
    } catch (err) {
      setError('Error generating PDF. Please try again.');
    }
  };

  // Function to render repository contents
  const renderContents = (contents, indentLevel = 0) => {
    return contents.map((item, index) => (
      <div key={index} style={{ marginLeft: `${indentLevel * 20}px` }}>
        {item.type === 'folder' ? (
          <div>
            <h3>Folder: {item.path}</h3>
            {renderContents(item.contents, indentLevel + 1)}
          </div>
        ) : (
          <div>
            <h4>File: {item.path}</h4>
            <pre>{item.content}</pre>
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
        {repoData && (
          <button className="save-pdf" onClick={handleSaveAsPDF}>
            Save as PDF
          </button>
        )}
      </div>

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
          {repoData.contents.length > 0 ? (
            renderContents(repoData.contents)
          ) : (
            <p>No files found in the repository.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;