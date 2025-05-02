import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [repoLink, setRepoLink] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Processing...');

    try {
      const response = await axios.post('http://localhost:3000/generate-pdf', { repoLink }, {
        responseType: 'blob', // Important for handling binary data (PDF)
      });

      // Create a URL for the PDF blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'repo.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus('PDF generated successfully!');
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">GitHub Repo to PDF</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={repoLink}
            onChange={(e) => setRepoLink(e.target.value)}
            placeholder="Enter GitHub repo link"
            className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded-lg text-white ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {loading ? 'Generating...' : 'Generate PDF'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">{status}</p>
      </div>
    </div>
  );
}

export default App;