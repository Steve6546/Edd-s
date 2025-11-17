# WhatsApp Clone - Real-time Chat Application

A modern, full-featured WhatsApp clone built with **Encore.ts** and **React**. This application provides real-time messaging, voice/video calls, status updates, group chats, and much more.

## ✨ Features

### 🔐 Authentication & User Management
- User registration and authentication
- Profile setup with avatar upload
- Username availability check
- Profile cooldown system

### 💬 Messaging
- Real-time one-on-one messaging
- Group chats with admin controls
- Message reactions and replies
- Voice notes recording and playback
- File and media attachments
- Message editing and deletion
- Read receipts and delivery status
- Message pinning
- Typing indicators

### 📞 Voice & Video Calls
- One-on-one voice calls
- Video calling with WebRTC
- Call signaling and management
- Call notifications
- Active call UI with controls

### 📱 Status Updates
- Create and view status updates
- 24-hour auto-expiring stories
- Status viewers tracking
- Media support (images, videos)

### 👥 Social Features
- Friend requests system
- Friends list management
- User search
- Online/offline presence
- Last seen tracking

### 🔔 Notifications
- Real-time push notifications
- Notification streams
- Mark as read functionality
- Notification history

### 👨‍👩‍👧‍👦 Group Chat Features
- Create group chats
- Add/remove participants
- Admin role management
- Group settings (who can send messages, edit info)
- Group member list
- Leave group functionality

### 🎨 UI/UX
- Modern, responsive design
- Dark mode support
- Skeleton loading states
- Image viewer with zoom
- Voice note waveform visualization
- Performance monitoring dashboard
- Auto-reconnection on network issues
- Error boundaries

## 🛠️ Tech Stack

### Backend
- **Encore.ts** - TypeScript backend framework
- **PostgreSQL** - Database
- **Object Storage** - File storage
- **Pub/Sub** - Real-time messaging
- **WebSocket Streams** - Live updates

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons
- **TanStack Query** - Data fetching

## 📋 Prerequisites

- **Node.js** 18+ 
- **Encore CLI** - [Install Encore](https://encore.dev/docs/install)
- **PostgreSQL** (automatically provided by Encore)

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install dependencies
```bash
# Encore automatically installs dependencies
# No manual npm install needed
```

### 3. Configure secrets
Open the Leap sidebar and navigate to **Settings** to configure the following secrets:
- Database credentials (auto-configured by Encore)
- Any external API keys if needed

### 4. Run the application
```bash
encore run
```

The application will be available at:
- **Frontend**: https://proj-d4di27482vjqr515gls0.lp.dev
- **Backend API**: https://proj-d4di27482vjqr515gls0.api.lp.dev

## 📁 Project Structure

```
.
├── backend/                    # Backend services
│   ├── auth/                  # Authentication service
│   ├── call/                  # Voice/video calling
│   ├── chat/                  # Chat management
│   ├── message/               # Message handling
│   ├── user/                  # User management
│   ├── friend/                # Friend system
│   ├── status/                # Status updates
│   ├── notification/          # Notifications
│   ├── presence/              # Online status
│   ├── db/                    # Database setup
│   │   └── migrations/        # SQL migrations
│   └── common/                # Shared utilities
│
├── frontend/                   # Frontend application
│   ├── components/            # React components
│   │   └── ui/               # shadcn/ui components
│   ├── pages/                # Page components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities
│   └── App.tsx               # Main app component
│
└── .github/                   # GitHub templates
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

## 🔑 Core Services

### Authentication Service (`backend/auth/`)
Handles user authentication and session management.

### Chat Service (`backend/chat/`)
- Create one-on-one and group chats
- Manage chat participants
- Pin messages
- Mute conversations

### Message Service (`backend/message/`)
- Send/receive messages
- Edit and delete messages
- Upload attachments
- Real-time message streaming

### Call Service (`backend/call/`)
- Initiate voice/video calls
- WebRTC signaling
- Call state management

### User Service (`backend/user/`)
- Profile management
- Avatar uploads
- User search
- Profile setup

### Friend Service (`backend/friend/`)
- Send/accept/reject friend requests
- List friends
- Manage friend relationships

### Status Service (`backend/status/`)
- Create status updates
- View statuses
- Track viewers
- Auto-cleanup after 24 hours

### Presence Service (`backend/presence/`)
- Online/offline status
- Typing indicators
- Last seen tracking

### Notification Service (`backend/notification/`)
- Push notifications
- Notification management
- Real-time notification streams

## 💡 Usage Examples

### Sending a Message
```typescript
import backend from '~backend/client';

const message = await backend.message.send({
  chatId: 'chat-123',
  content: 'Hello, World!',
  messageType: 'text'
});
```

### Creating a Group Chat
```typescript
import backend from '~backend/client';

const group = await backend.chat.createGroup({
  name: 'My Group',
  participantIds: ['user1', 'user2', 'user3']
});
```

### Initiating a Call
```typescript
import backend from '~backend/client';

const call = await backend.call.initiate({
  receiverId: 'user-456',
  callType: 'video'
});
```

### Uploading an Avatar
```typescript
import backend from '~backend/client';

const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
const result = await backend.user.uploadAvatar({ file });
```

## 🧪 Testing

Run tests using:
```bash
# Backend tests
npm test

# Frontend tests
cd frontend && npm test
```

## 🔒 Security

- All API endpoints require authentication
- Passwords are hashed using bcrypt
- File uploads are validated and scanned
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping
- CORS configuration for production

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap

### Planned Features
- [ ] End-to-end encryption
- [ ] Voice message transcription
- [ ] Message search functionality
- [ ] Archive chats
- [ ] Starred messages
- [ ] Chat export
- [ ] Multiple device support
- [ ] Message scheduling
- [ ] Polls and surveys
- [ ] Location sharing
- [ ] Contact sharing
- [ ] Payment integration
- [ ] Desktop application (Electron)
- [ ] Mobile apps (React Native)
- [ ] Admin dashboard
- [ ] Analytics and insights
- [ ] Custom emoji and stickers
- [ ] Theme customization
- [ ] Language localization

### Performance Improvements
- [ ] Message pagination optimization
- [ ] Image lazy loading
- [ ] Video streaming optimization
- [ ] Offline support with service workers
- [ ] Caching strategies
- [ ] CDN integration for media

### Developer Experience
- [ ] API documentation with Swagger
- [ ] Storybook for components
- [ ] E2E testing with Playwright
- [ ] CI/CD pipeline
- [ ] Docker containerization
- [ ] Kubernetes deployment configs

## 📞 Support

For questions and support:
- Open an issue on GitHub
- Contact the maintainers
- Check the [documentation](https://encore.dev/docs)

## 🙏 Acknowledgments

- Built with [Encore.ts](https://encore.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by WhatsApp

---

**Made with ❤️ using Encore.ts and React**
