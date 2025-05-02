# GitHub Repository Viewer

A web application to explore and visualize the contents of any public GitHub repository. Users can fetch repository contents, view file structures, select files to display their code with syntax highlighting, and save the selected files as a PDF. The application features a clean, light-themed UI with a subtle gradient background, making it easy to navigate and use.

## Features

- **Fetch Repository Contents**: Enter a GitHub repository URL to fetch its file structure and contents.
- **File Structure Navigation**: Browse the repository's folder and file hierarchy with an interactive tree view.
- **File Selection**: Select multiple files to view their contents with syntax highlighting and line numbers.
- **Syntax Highlighting**: Supports multiple programming languages using the `react-syntax-highlighter` library.
- **Theme Selection**: Choose from different syntax highlighting themes (e.g., Dark Darcula, Light VS Code).
- **Search Functionality**: Search for files within the repository by name.
- **Save as PDF**: Export selected files as a PDF, including file names and code with syntax highlighting.
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices.

## How It’s Built

The GitHub Repository Viewer is a full-stack web application built with the following technologies:

### Frontend
- **React**: A JavaScript library for building the user interface.
- **Vite**: A fast build tool and development server for the frontend.
- **React Syntax Highlighter**: For rendering code with syntax highlighting and line numbers.
- **jsPDF & html2canvas**: For generating PDFs from the displayed file contents.
- **CSS**: Custom styles for a clean, light-themed UI with a subtle gradient background.

### Backend
- **Node.js & Express**: A lightweight backend server to handle API requests.
- **Axios**: For making HTTP requests to the GitHub API.
- **CORS**: To enable cross-origin requests between the frontend and backend.

### External APIs
- **GitHub API**: To fetch repository contents and file data.

The application follows a client-server architecture:
- The frontend (React app) runs on `http://localhost:5173` by default.
- The backend (Express server) runs on `http://localhost:3000` and acts as a proxy to fetch data from the GitHub API, avoiding CORS issues.

## Dependencies

### Frontend Dependencies
- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `react-syntax-highlighter`: ^15.5.0 (for syntax highlighting)
- `jspdf`: ^2.5.1 (for PDF generation)
- `html2canvas`: ^1.4.1 (for converting DOM elements to canvas for PDF)
- `@vitejs/plugin-react`: ^4.0.0 (Vite plugin for React)
- `vite`: ^4.3.9 (build tool)

### Backend Dependencies
- `express`: ^4.18.2 (web framework)
- `axios`: ^1.6.0 (HTTP client)
- `cors`: ^2.8.5 (to enable CORS)
- `dotenv`: ^16.0.3 (for environment variables)

### Development Dependencies
- `eslint`: ^8.38.0 (for linting)
- `eslint-plugin-react`: ^7.32.2 (React-specific linting rules)
- `eslint-plugin-react-hooks`: ^4.6.0 (linting for React hooks)
- `eslint-plugin-react-refresh`: ^0.4.0 (for React Refresh support in Vite)

## Prerequisites

Before setting up the project, ensure you have the following installed:
- **Node.js** (v16 or higher): Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**: To clone the repository
- A GitHub account (optional, but useful for testing with your own repositories)

## Installation

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/tarunganesh2004/Github-Repo-Viewer.git
cd Github-Repo-Viewer
```

### 2. Set Up the Backend
1. Navigate to the backend directory:
   ```bash
   cd server
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your GitHub API token (optional but recommended to avoid rate limits):
   ```env
   GITHUB_TOKEN=your-github-token
   ```
   To generate a GitHub token:
   - Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic).
   - Generate a new token with the `repo` scope.
   - Copy the token and add it to the `.env` file.
4. Start the backend server:
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:3000`.

### 3. Set Up the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## Usage

1. **Open the Application**:
   - Open your browser and go to `http://localhost:5173`.

2. **Fetch a Repository**:
   - Enter a public GitHub repository URL (e.g., `https://github.com/tarunganesh2004/SDOT`).
   - Click the "Get Files" button to fetch the repository contents.
   - You’ll see the repository name and its file structure on the left side.

3. **Navigate the File Structure**:
   - Expand folders by clicking on them to view nested files and folders.
   - Use the search bar to filter files by name.

4. **Select Files**:
   - Click on files to select them. Selected files will appear on the right side with their contents displayed.
   - The file contents are shown with syntax highlighting and line numbers, based on the file’s extension (e.g., `.java`, `.py`, `.js`).

5. **Change Syntax Highlighting Theme**:
   - Use the theme dropdown to select a different syntax highlighting theme (e.g., Dark Darcula, Light VS Code).

6. **Select All Files**:
   - Click the "Select All Files" button to select all files in the repository at once.

7. **Save as PDF**:
   - After selecting files, click the "Save as PDF" button.
   - Enter a name for the PDF file when prompted.
   - The PDF will be generated and downloaded, containing the file names and their contents with syntax highlighting.

8. **Clear Selection**:
   - Click the "Clear Selection" button to deselect all files.

## Project Structure

```
Github-Repo-Viewer/
├── client/                 # Frontend (React app)
│   ├── public/             # Static assets
│   ├── src/                # React source code
│   │   ├── App.jsx         # Main React component
│   │   ├── styles.css      # CSS styles
│   │   └── ...             # Other components and files
│   ├── package.json        # Frontend dependencies and scripts
│   └── vite.config.js      # Vite configuration
├── server/                 # Backend (Express server)
│   ├── index.js            # Main server file
│   ├── package.json        # Backend dependencies and scripts
│   └── .env                # Environment variables (not tracked in git)
├── README.md               # This file
└── .gitignore              # Git ignore file
```

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes.
4. Commit your changes (`git commit -m "Add your feature"`).
5. Push to your branch (`git push origin feature/your-feature`).
6. Open a pull request on GitHub.

Please ensure your code follows the existing style and includes appropriate comments.


## Acknowledgments

- Thanks to the creators of `react-syntax-highlighter` for providing an excellent syntax highlighting library.
- Inspired by the need for a simple tool to visualize and export GitHub repository contents.

## Contact

For any questions or suggestions, feel free to reach out:
- **Author**: Tarun Ganesh
- **GitHub**: [tarunganesh2004](https://github.com/tarunganesh2004)
- **Email**: enstarunganesh@gmail.com

Happy coding! 🚀