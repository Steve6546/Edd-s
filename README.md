# Chat Application

A full-stack real-time chat application built with Encore.ts and React, featuring voice/video calls, group chats, status updates, and more.

## Features

### Core Features
- **Real-time Messaging**: Send and receive messages instantly with WebSocket support
- **Group Chats**: Create and manage group conversations with admin controls
- **Voice & Video Calls**: One-on-one voice and video calling with WebRTC
- **Status Updates**: Share temporary status updates (similar to WhatsApp Stories)
- **Friend System**: Send and manage friend requests
- **User Presence**: See who's online and typing indicators
- **Message Features**:
  - Text messages with rich formatting
  - Voice notes recording and playback
  - File attachments (images, videos, documents)
  - Message reactions (emojis)
  - Edit and delete messages
  - Pin important messages
  - Message read receipts

### Advanced Features
- **User Authentication**: Secure signup and login
- **Profile Management**: Custom avatars, usernames, and bios
- **Search**: Find users and messages
- **Notifications**: Real-time push notifications
- **Message Statistics**: View message counts and engagement
- **Mute Conversations**: Silence notifications for specific chats
- **Group Admin Controls**: Add/remove members, update settings

## Tech Stack

### Backend
- **Encore.ts**: TypeScript backend framework
- **PostgreSQL**: Database for persistent storage
- **WebSocket Streams**: Real-time communication
- **Object Storage**: For file uploads (avatars, attachments)
- **Pub/Sub**: Event-driven architecture for notifications

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Tailwind CSS v4**: Utility-first styling
- **shadcn/ui**: Component library
- **WebRTC**: Peer-to-peer calling
- **React Query**: Server state management

## Prerequisites

- **Node.js**: v18 or higher
- **Encore CLI**: Install from [encore.dev](https://encore.dev)
- **PostgreSQL**: For local development (automatically provisioned by Encore)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
# Dependencies are automatically installed by Encore
encore run
```

3. The application will start automatically:
- Frontend: https://proj-d4di27482vjqr515gls0.lp.dev
- Backend API: https://proj-d4di27482vjqr515gls0.api.lp.dev

## Project Structure

```
.
├── backend/                  # Backend services
│   ├── auth/                # Authentication service
│   ├── call/                # Voice/video calling
│   ├── chat/                # Chat management
│   ├── message/             # Message handling
│   ├── status/              # Status updates
│   ├── user/                # User profiles
│   ├── friend/              # Friend requests
│   ├── presence/            # Online status
│   ├── notification/        # Notifications
│   ├── db/                  # Database setup
│   │   └── migrations/      # SQL migrations
│   └── common/              # Shared utilities
│
├── frontend/                # React frontend
│   ├── components/          # Reusable components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   └── lib/                # Utilities
│
└── .github/                # GitHub templates
    ├── ISSUE_TEMPLATE/     # Issue templates
    └── PULL_REQUEST_TEMPLATE.md
```

## Development

### Running Locally

```bash
encore run
```

This command:
- Starts the backend services
- Provisions a local PostgreSQL database
- Runs database migrations
- Starts the frontend dev server
- Opens the application in your browser

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production

```bash
# Encore handles deployment automatically
encore deploy
```

## Usage Examples

### Sending a Message

```typescript
import backend from '~backend/client';

const message = await backend.message.send({
  chatId: 'chat_123',
  content: 'Hello, World!',
  type: 'text'
});
```

### Creating a Group Chat

```typescript
const group = await backend.chat.createGroup({
  name: 'Team Chat',
  description: 'Our team discussions',
  participantIds: ['user1', 'user2', 'user3']
});
```

### Initiating a Call

```typescript
const call = await backend.call.initiate({
  receiverId: 'user_456',
  callType: 'video'
});
```

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users`: User accounts and profiles
- `chats`: Chat conversations (direct and group)
- `messages`: Chat messages
- `friend_requests`: Friend relationships
- `status_updates`: Temporary status posts
- `calls`: Call history and metadata
- `notifications`: User notifications

## API Documentation

All API endpoints are automatically documented by Encore. Access the API explorer at:
```
https://app.encore.dev/<your-app-id>
```

## Security

- All API endpoints use authentication
- Passwords are hashed using bcrypt
- WebSocket connections are authenticated
- File uploads are validated and sanitized
- SQL injection protection through parameterized queries
- XSS protection through React's built-in sanitization

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

This project follows a Code of Conduct. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Roadmap

### Planned Features
- [ ] End-to-end encryption
- [ ] Message search functionality
- [ ] Rich text editor for messages
- [ ] Custom emoji reactions
- [ ] Voice/video group calls
- [ ] Screen sharing
- [ ] Message threading/replies
- [ ] Scheduled messages
- [ ] Chat backup and export
- [ ] Dark/light theme toggle
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

### Performance Improvements
- [ ] Message pagination optimization
- [ ] Image lazy loading
- [ ] Service worker for offline support
- [ ] CDN integration for media files
- [ ] Database query optimization
- [ ] Redis caching layer

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:
1. Check existing [Issues](https://github.com/<your-repo>/issues)
2. Create a new issue using the appropriate template
3. Join our community discussions

## Acknowledgments

- Built with [Encore.ts](https://encore.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

Made with ❤️ using Encore.ts
