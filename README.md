# File Hosting & Video Streaming Platform

A modern web service for uploading, hosting, and streaming video files. Users can upload their own videos, stream content with efficient playback, and manage their media securely. The platform is designed for both content creators and viewers, providing a seamless and robust experience.

---

## 🚀 Features

- Secure user authentication (registration & login)
- Video upload with file validation (using Multer)
- Efficient video streaming with Range support (HTML5 video)
- Automatic thumbnail generation from uploaded videos (FFmpeg)
- User dashboard for managing uploaded videos
- Search and sort: search by title, sort by date/likes
- Role-based access: admin panel for content and user management

---

## 🎯 Project Requirements & Analysis

### Functional Requirements

1. **User Registration & Authentication**
   - Users must be able to register and log in securely.
   - JWT-based authentication for session management.
2. **Video Upload**
   - Users can upload video files.
   - Uploaded files are validated for type and size.
   - Thumbnails are generated automatically using FFmpeg.
3. **Video Streaming**
   - Videos are streamed with support for HTTP Range requests for smooth playback and seeking.
   - Public or restricted access to videos (configurable).
4. **Content Management**
   - Users can view, delete, and manage their own videos.
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

- **Backend:** Node.js, Express.js
- **File Upload:** Multer
- **Video Processing:** FFmpeg
- **Authentication:** JSON Web Token (JWT)
- **Database:** PostgreSQL

---

## 👥 User Roles

- **Visitor:** Can view public videos
- **User:** Can upload, manage, and interact with videos
- **Admin:** Can manage all content and users