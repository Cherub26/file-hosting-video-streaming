# File Hosting & Video Streaming Frontend

This is a React frontend for the file hosting and video streaming backend.

## Features
- User registration and login (JWT-based)
- File upload with public/private visibility
- My Files page to view and access uploaded files
- Public link for public files

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. The app will run on http://localhost:5173 (or your configured Vite port).

## API
- Expects the backend to be running and accessible at `/api` (proxy or CORS setup may be needed). 