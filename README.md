# PanChat Client

A modern, real-time chat application built with **Angular 21** and powered by **SignalR** for seamless messaging. PanChat provides a responsive, feature-rich messaging experience with support for file attachments, dark mode, and JWT-based authentication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Services](#key-services)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)

## ✨ Features

- **Real-time Messaging**: Instant message delivery using Microsoft SignalR
- **File Attachments**: Support for multiple file formats including:
  - Documents (DOCX)
  - Images (HEIC, PNG, JPG, etc.)
  - PDFs
- **User Authentication**: Secure JWT token-based authentication
- **Theme Support**: Toggle between light and dark modes
- **Responsive Design**: Mobile-friendly UI
- **Toast Notifications**: User-friendly feedback system

## 🛠 Tech Stack

- **Frontend Framework**: [Angular 21](https://angular.io/)
- **Real-time Communication**: [@microsoft/signalr](https://github.com/SignalR/SignalR)
- **TypeScript**: 5.9.3

### Optional Dependencies

- **PDF Viewer**: pdfjs-dist (PDF document preview)
- **Document Preview**: docx-preview (Word document rendering)
- **Image Conversion**: heic-to (HEIC to standard image format)
- **JWT Parsing**: jwt-decode (Token decoding)

## 🔧 Key Services

### AuthService

Handles user authentication, JWT token management, and login/logout functionality.

### SignalRService

Manages real-time WebSocket connections using Microsoft SignalR.

**Methods**:

- `buildConnection()` - Initialize hub connection
- `startConnection()` - Connect to SignalR hub
- `stopConnection()` - Disconnect from hub
- `on(methodName, handler)` - Listen for server events
- `invoke(methodName, ...args)` - Call server methods

### MessageService

Handles chat message retrieval, sending, and caching.

### AttachmentActionsService

Manages file upload and attachment operations.

### ThemeService

Toggles between light and dark themes, persisting user preference.

### ToastService

Displays notification messages to users.

## 🔌 API Integration

The application communicates with the backend through:

- **HTTP Requests**: RESTful API calls for authentication and data retrieval
- **SignalR WebSocket**: Real-time messaging and notifications

### Required Backend Endpoints

- `POST /api/auth/login` - User authentication
- `GET /api/messages` - Fetch message history
- `POST /api/messages` - Send new message
- `POST /api/attachments/upload` - Upload file attachment
- `WS /hub` - SignalR hub connection
