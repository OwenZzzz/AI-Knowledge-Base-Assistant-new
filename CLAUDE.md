# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Knowledge Base Assistant (AI知识库助手) - An Electron-based application for managing knowledge bases using the PARA methodology. The application provides a dual-interface system with both Electron desktop app and web server modes.

## Development Commands

```bash
# Install dependencies
npm install

# Run Electron app in development mode
npm run dev

# Run Electron app normally
npm start

# Build Electron app for distribution
npm run build

# Build without publishing
npm run dist

# Run standalone web server (no Electron)
node server.js
```

## Architecture

### Core Components

1. **main.js** - Electron main process entry point
   - Creates BrowserWindow with Node.js integration enabled
   - Handles IPC communication for file system operations
   - File operations: read-directory, read-file, write-file

2. **server.js** - Standalone HTTP server (port 3000)
   - Serves static files and API endpoints
   - API routes: /api/read-directory, /api/read-file, /api/write-file, /api/append-file
   - Serves different interfaces: enhanced.html (default), web.html (/basic), project-manager.html (/projects)

3. **HTML Interfaces**:
   - **enhanced.html** - Main enhanced interface (default)
   - **web.html** - Basic web interface
   - **project-manager.html** - Project management interface
   - **index.html** - Original Electron interface

### Key Technical Details

- **Electron Configuration**: Node.js integration enabled, context isolation disabled
- **File System Access**: Direct file system operations through Node.js APIs
- **CORS**: Enabled for all origins in server mode
- **Build System**: electron-builder for cross-platform distribution
- **No Testing Framework**: No test scripts or testing framework configured

### File Structure

The application operates on local file systems with these operations:
- Directory reading and navigation
- Markdown file viewing and editing
- File content writing and appending
- Real-time file system interaction

## Important Notes

- This is a Chinese-language application (界面和注释主要为中文)
- No linting or code formatting tools are configured
- No automated testing is set up
- File operations are performed directly on the host file system without sandboxing