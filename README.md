# 💬 WhatsApp Clone

A full-featured real-time messaging application built with **Encore.ts** and **React**, featuring end-to-end encrypted messaging, voice/video calls, status updates, and group chat functionality.

## ✨ Features

### 🔐 Authentication & User Management
- User registration with email/password
- Profile setup with username and display name
- Avatar upload support
- Username availability checking
- Profile cooldown management

### 💬 Real-time Messaging
- One-on-one chat
- Group chat with admin controls
- Message reactions
- Message replies (threading)
- Message editing and deletion
- Read receipts
- Typing indicators
- Message attachments (images, videos, documents)
- Voice notes
- Message pinning
- Message statistics

### 👥 Social Features
- Friend request system
- User search
- Online/offline presence
- Custom user status
- 24-hour status updates with view tracking

### 📞 Voice & Video Calls
- One-on-one voice calls
- One-on-one video calls
- WebRTC-based real-time communication
- Call notifications
- Call accept/reject/end

### 🔔 Real-time Notifications
- Push notifications for messages
- Friend request notifications
- Call notifications
- Real-time notification stream

### 🎨 UI/UX
- Modern, responsive design
- Dark mode support
- Skeleton loaders
- Image viewer
- Video player
- Smooth animations
- Mobile-friendly interface

## 🏗️ Tech Stack

### Backend
- **Encore.ts** - Backend framework with built-in infrastructure
- **PostgreSQL** - Database
- **Pub/Sub** - Real-time messaging
- **Object Storage** - File uploads (avatars, attachments)
- **WebSocket Streams** - Real-time data streaming

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons
- **TanStack Query** - Data fetching
- **WebRTC** - Voice/video calls

## 📋 Prerequisites

- **Node.js** 18+ 
- **Encore CLI** - [Install Encore](https://encore.dev/docs/install)
- **PostgreSQL** (managed by Encore)

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd whatsapp-clone
```

2. **Install Encore CLI** (if not already installed)
```bash
curl -L https://encore.dev/install.sh | bash
```

3. **Run the application**
```bash
encore run
```

Encore will automatically:
- Install all dependencies (backend & frontend)
- Set up the PostgreSQL database
- Run database migrations
- Start the backend API
- Start the frontend dev server

4. **Access the application**
- Frontend: http://localhost:4000
- Backend API: http://localhost:4000/api
- Encore Dev Dashboard: http://localhost:9400

## 📁 Project Structure

```
/
├── backend/                  # Backend services
│   ├── auth/                # Authentication service
│   ├── user/                # User management
│   ├── friend/              # Friend request system
│   ├── chat/                # Chat management
│   ├── message/             # Message handling
│   ├── call/                # Voice/video calls
│   ├── status/              # Status updates
│   ├── notification/        # Notifications
│   ├── presence/            # Online/offline status
│   ├── db/                  # Database setup & migrations
│   └── common/              # Shared utilities
│
├── frontend/                # Frontend application
│   ├── components/          # Reusable components
│   ├── pages/               # Page components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utilities
│   └── App.tsx              # Main app component
│
├── .github/                 # GitHub templates
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
│
├── README.md                # Project documentation
├── CONTRIBUTING.md          # Contribution guidelines
├── CODE_OF_CONDUCT.md       # Community guidelines
├── SECURITY.md              # Security policy
└── LICENSE                  # License file
```

## 🎯 API Overview

### Services

- **auth** - User authentication and authorization
- **user** - Profile management, search, avatars
- **friend** - Friend requests and connections
- **chat** - Chat creation and management
- **message** - Sending, editing, deleting messages
- **call** - WebRTC signaling and call management
- **status** - 24-hour status updates
- **notification** - Real-time notifications
- **presence** - Online status and typing indicators

### Real-time Streams

- **message.stream** - Real-time message updates
- **notification.stream** - Real-time notifications
- **presence.stream** - Online status updates
- **call.stream** - Call signaling

## 💡 Usage Examples

### Create a Chat
```typescript
import backend from '~backend/client';

const chat = await backend.chat.create({
  participantId: 'user-id'
});
```

### Send a Message
```typescript
const message = await backend.message.send({
  chatId: 'chat-id',
  content: 'Hello!',
  type: 'text'
});
```

### Start a Call
```typescript
const call = await backend.call.initiate({
  receiverId: 'user-id',
  type: 'video'
});
```

### Subscribe to Messages
```typescript
const stream = await backend.message.stream();
for await (const msg of stream) {
  console.log('New message:', msg);
}
```

## 🔧 Environment Configuration

Encore handles all infrastructure automatically. For production deployments, configure secrets in the Encore Cloud dashboard:

- Database connection (automatic)
- Object storage (automatic)
- Custom API keys (if needed)

## 🧪 Testing

```bash
encore test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## 🚢 Deployment

Deploy to Encore Cloud:

```bash
git push encore main
```

Encore automatically:
- Builds the application
- Provisions infrastructure
- Runs migrations
- Deploys frontend and backend

## 🗺️ Roadmap

### Planned Features
- [ ] End-to-end encryption
- [ ] Group voice/video calls
- [ ] Message forwarding
- [ ] Channel/broadcast support
- [ ] Media gallery
- [ ] Message search
- [ ] Chat backup/export
- [ ] Desktop notifications
- [ ] PWA support
- [ ] Multi-device sync
- [ ] Stickers and GIFs
- [ ] Location sharing
- [ ] Contact sharing
- [ ] Poll creation
- [ ] Disappearing messages

### Performance Improvements
- [ ] Message pagination optimization
- [ ] Image lazy loading
- [ ] Service worker caching
- [ ] Database query optimization
- [ ] CDN integration

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

Please report security vulnerabilities to our security team. See [SECURITY.md](SECURITY.md) for details.

## 📞 Support

- [Documentation](https://encore.dev/docs)
- [Discord Community](https://encore.dev/discord)
- [GitHub Issues](../../issues)

## 🙏 Acknowledgments

- Built with [Encore.ts](https://encore.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

Made with ❤️ using Encore.ts
