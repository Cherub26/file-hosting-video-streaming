# File Hosting & Video Streaming Platform

A modern web service for uploading, hosting, and streaming video files. Users can upload their own videos, stream content with efficient playback, and manage their media securely. The platform is designed for both content creators and viewers, providing a seamless and robust experience.

---

## 🚀 Features

- Secure user authentication (registration & login)
- Video and file upload with type/size validation
- Public/private file visibility and sharing
- Efficient video streaming with Range support (HTML5 video)
- Automatic thumbnail generation from uploaded videos (FFmpeg)
- User dashboard to manage uploaded files
- Modern, responsive UI built with React & Tailwind CSS
- Role-based access: admin panel for content and user management

---

## 🎯 Project Requirements & Analysis

### Functional Requirements

1. **User Registration & Authentication**
   - Users can register and log in securely.
   - JWT-based authentication for session management.
2. **File & Video Upload**
   - Users can upload video and other files.
   - Uploaded files are validated for type and size.
   - Thumbnails are generated automatically for videos using FFmpeg.
   - Users can set files as public or private.
3. **Video Streaming**
   - Videos are streamed with support for HTTP Range requests for smooth playback and seeking.
   - Public or restricted access to videos (configurable).
4. **Content Management**
   - Users can view, delete, and manage their own files and videos.
   - Admins can manage all content and users.
5. **Search & Discovery**
   - Users can search videos by title.
   - Videos can be sorted by upload date or number of likes.

### Non-Functional Requirements

- **Performance:** Fast video streaming and responsive UI.
- **Security:** Secure file handling, authentication, and authorization.
- **Scalability:** Designed to handle multiple users and large files.
- **Maintainability:** Modular codebase with clear separation of concerns.
- **Usability:** Simple, modern, and intuitive user interface.

---

## 🛠️ Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, TypeScript
- **Backend:** Node.js, Express.js, TypeScript
- **File Upload:** Multer
- **Video Processing:** FFmpeg
- **Authentication:** JSON Web Token (JWT)
- **Database:** PostgreSQL (via Prisma ORM)
- **Cloud Storage:** Azure Blob Storage

---

## 👥 User Roles

- **Visitor:** Can view public files,videos
- **User:** Can upload, manage, and interact with their own files,videos
- **Admin:** Can manage all content and users

---

## 🧑‍💻 Getting Started

### Backend
1. `cd backend`
2. Install dependencies: `npm install`
3. Set up your `.env` file (see `.env.example`)
4. Run database migrations: `npx prisma migrate deploy`
5. Start the server: `npm run dev`

### Frontend
1. `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The app will run on http://localhost:5173 (or your configured Vite port)