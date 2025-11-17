# Contributing Guide

## دليل المساهمة

Thank you for your interest in contributing to this project! This guide will help you get started.

شكرًا لاهتمامك بالمساهمة في هذا المشروع! سيساعدك هذا الدليل على البدء.

## Table of Contents / جدول المحتويات

1. [How to Contribute / كيفية المساهمة](#how-to-contribute)
2. [Code Style / أسلوب الكود](#code-style)
3. [Pull Request Standards / معايير قبول الـPR](#pull-request-standards)
4. [Development Environment Setup / خطوات إعداد بيئة التطوير](#development-environment-setup)

---

## How to Contribute / كيفية المساهمة

### Types of Contributions / أنواع المساهمات

We welcome various types of contributions:

نرحب بأنواع مختلفة من المساهمات:

- **🐛 Bug Reports** - Report issues you encounter / الإبلاغ عن المشاكل التي تواجهها
- **✨ Feature Requests** - Suggest new features / اقتراح ميزات جديدة
- **📝 Documentation** - Improve or translate docs / تحسين أو ترجمة الوثائق
- **💻 Code Contributions** - Fix bugs or add features / إصلاح الأخطاء أو إضافة ميزات
- **🎨 UI/UX Improvements** - Enhance user interface / تحسين واجهة المستخدم
- **🧪 Testing** - Write or improve tests / كتابة أو تحسين الاختبارات

### Getting Started / البدء

1. **Fork the Repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally
   
   ```bash
   git clone https://github.com/YOUR-USERNAME/project-name.git
   cd project-name
   ```

2. **Create a Branch**
   - Create a new branch for your contribution
   - Use descriptive names
   
   ```bash
   git checkout -b feature/add-voice-messages
   git checkout -b fix/message-deletion-bug
   git checkout -b docs/arabic-translation
   ```

3. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the code style guidelines
   - Add tests if applicable
   
   اكتب كودًا نظيفًا وموثقًا جيدًا، واتبع إرشادات أسلوب الكود

4. **Test Your Changes**
   - Run tests locally
   - Ensure all tests pass
   - Test manually if needed
   
   ```bash
   npm test
   ```

5. **Commit Your Changes**
   - Write clear commit messages
   - Follow commit message conventions
   
   ```bash
   git add .
   git commit -m "feat: add voice message recording feature"
   ```

6. **Push and Create PR**
   - Push to your fork
   - Create a Pull Request
   
   ```bash
   git push origin feature/add-voice-messages
   ```

### Commit Message Convention / اصطلاح رسائل الالتزام

Follow the Conventional Commits specification:

اتبع مواصفات الالتزامات التقليدية:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature / ميزة جديدة
- `fix`: Bug fix / إصلاح خطأ
- `docs`: Documentation / وثائق
- `style`: Code style changes / تغييرات أسلوب الكود
- `refactor`: Code refactoring / إعادة هيكلة الكود
- `test`: Adding tests / إضافة اختبارات
- `chore`: Maintenance / صيانة

**Examples:**
```bash
feat(chat): add message reactions
fix(auth): resolve login token expiration
docs(readme): add Arabic installation guide
style(frontend): format code with prettier
refactor(backend): optimize database queries
test(message): add unit tests for send endpoint
```

---

## Code Style / أسلوب الكود

### General Principles / المبادئ العامة

- **Write clean, readable code** / اكتب كودًا نظيفًا وقابلًا للقراءة
- **Keep functions small and focused** / اجعل الوظائف صغيرة ومركزة
- **Use meaningful variable names** / استخدم أسماء متغيرات ذات معنى
- **Follow DRY (Don't Repeat Yourself)** / اتبع مبدأ عدم التكرار
- **Comment complex logic** / علق على المنطق المعقد

### TypeScript Standards

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
}

const getUserProfile = async (userId: string): Promise<UserProfile> => {
  const profile = await db.query`
    SELECT id, username, display_name
    FROM users
    WHERE id = ${userId}
  `.one();
  
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name,
  };
};

// ❌ Bad
const getUser = async (id: any) => {
  const u = await db.query`SELECT * FROM users WHERE id = ${id}`.one();
  return u;
};
```

### Formatting / التنسيق

- **Indentation**: 2 spaces / مسافتان
- **Line length**: Maximum 100 characters / الحد الأقصى 100 حرف
- **Semicolons**: Required / مطلوبة
- **Quotes**: Double quotes for strings / علامات اقتباس مزدوجة

### File Structure / هيكل الملف

**Backend Services:**
```
backend/
  service-name/
    encore.service.ts      # Service definition
    create.ts              # Create endpoint
    list.ts                # List endpoint
    update.ts              # Update endpoint
    delete.ts              # Delete endpoint
    types.ts               # Shared types (optional)
```

**Frontend Components:**
```
frontend/
  components/
    ComponentName.tsx      # Component file
  pages/
    PageName.tsx          # Page component
  lib/
    utils.ts              # Utility functions
```

### Naming Conventions / اصطلاحات التسمية

- **Files**: `kebab-case.ts` or `PascalCase.tsx`
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces/Types**: `PascalCase`

```typescript
// Files
message-list.ts
ChatView.tsx

// Components
const MessageBubble = () => { /* ... */ };

// Functions
const sendMessage = async () => { /* ... */ };

// Constants
const MAX_MESSAGE_LENGTH = 5000;

// Types
interface MessageData {
  content: string;
  senderId: string;
}
```

### Backend Code Style

```typescript
// API Endpoint Structure
import { api } from "encore.dev/api";

interface CreateMessageRequest {
  chatId: string;
  content: string;
  replyToId?: string;
}

interface CreateMessageResponse {
  id: string;
  createdAt: Date;
}

export const create = api(
  { method: "POST", path: "/messages", expose: true, auth: true },
  async (req: CreateMessageRequest): Promise<CreateMessageResponse> => {
    // Input validation
    if (!req.content.trim()) {
      throw new Error("Message content cannot be empty");
    }
    
    // Business logic
    const message = await db.query`
      INSERT INTO messages (chat_id, content, sender_id, reply_to_id)
      VALUES (${req.chatId}, ${req.content}, ${auth.userId}, ${req.replyToId})
      RETURNING id, created_at
    `.one();
    
    // Return response
    return {
      id: message.id,
      createdAt: message.created_at,
    };
  }
);
```

### Frontend Code Style

```typescript
// Component Structure
import { useState, useEffect } from "react";
import backend from "~backend/client";
import type { Message } from "~backend/message/types";

interface MessageListProps {
  chatId: string;
}

export const MessageList = ({ chatId }: MessageListProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadMessages();
  }, [chatId]);
  
  const loadMessages = async () => {
    try {
      const data = await backend.message.list({ chatId });
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
};
```

---

## Pull Request Standards / معايير قبول الـPR

### Before Submitting / قبل التقديم

- [ ] Code follows style guidelines / الكود يتبع إرشادات الأسلوب
- [ ] Tests added/updated / تمت إضافة/تحديث الاختبارات
- [ ] All tests pass / جميع الاختبارات تنجح
- [ ] Documentation updated / تم تحديث الوثائق
- [ ] No console.log or debugging code / لا يوجد console.log أو كود تصحيح
- [ ] Commit messages follow convention / رسائل الالتزام تتبع الاصطلاح

### PR Title Format / تنسيق عنوان الـPR

```
<type>: <description>

Examples:
feat: add message reactions feature
fix: resolve authentication timeout issue
docs: add Arabic README translation
```

### PR Description Template / قالب وصف الـPR

```markdown
## Description / الوصف
Brief description of what this PR does

## Type of Change / نوع التغيير
- [ ] Bug fix / إصلاح خطأ
- [ ] New feature / ميزة جديدة
- [ ] Breaking change / تغيير جذري
- [ ] Documentation update / تحديث وثائق

## Testing / الاختبار
How has this been tested?

## Screenshots / لقطات الشاشة
If applicable, add screenshots

## Checklist / قائمة التحقق
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass
```

### Review Process / عملية المراجعة

1. **Automated Checks** - CI/CD must pass / يجب أن تنجح الفحوصات الآلية
2. **Code Review** - At least one approval required / مطلوب موافقة واحدة على الأقل
3. **Testing** - Manual testing if needed / الاختبار اليدوي إذا لزم الأمر
4. **Merge** - Squash and merge preferred / الدمج والضغط مفضل

### Response to Feedback / الرد على الملاحظات

- Address all review comments / معالجة جميع تعليقات المراجعة
- Be open to suggestions / كن منفتحًا على الاقتراحات
- Ask questions if unclear / اطرح أسئلة إذا لم يكن واضحًا
- Update PR based on feedback / قم بتحديث الـPR بناءً على الملاحظات

---

## Development Environment Setup / خطوات إعداد بيئة التطوير

### Prerequisites / المتطلبات الأساسية

Before you begin, ensure you have:

قبل أن تبدأ، تأكد من أن لديك:

- **Node.js** (v18 or higher) / الإصدار 18 أو أعلى
- **npm** or **yarn** package manager
- **Git** version control
- **Encore CLI** - [Installation Guide](https://encore.dev/docs/install)

### Step 1: Install Encore CLI

```bash
# macOS/Linux
curl -L https://encore.dev/install.sh | bash

# Windows (PowerShell)
iwr https://encore.dev/install.ps1 | iex
```

Verify installation:
```bash
encore version
```

### Step 2: Clone the Repository

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/project-name.git
cd project-name

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/project-name.git
```

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### Step 4: Set Up Environment

```bash
# Copy environment example (if exists)
cp .env.example .env

# Edit .env with your settings
# Add necessary API keys and secrets
```

### Step 5: Database Setup

```bash
# Encore automatically handles database migrations
# No manual setup required

# To reset database (if needed)
encore db reset
```

### Step 6: Run the Application

```bash
# Run in development mode
encore run

# This starts:
# - Backend API server
# - Frontend dev server
# - Database (PostgreSQL)
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Encore Dashboard: `http://localhost:9400`

### Step 7: Verify Setup

```bash
# Run tests
npm test

# Run linter
npm run lint

# Check TypeScript
npm run type-check
```

### Development Workflow / سير عمل التطوير

```bash
# 1. Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Make changes and test
encore run
npm test

# 4. Commit changes
git add .
git commit -m "feat: add new feature"

# 5. Push to your fork
git push origin feature/my-new-feature

# 6. Create Pull Request on GitHub
```

### Useful Commands / أوامر مفيدة

```bash
# Run backend only
cd backend && encore run

# Run frontend only
cd frontend && npm run dev

# View logs
encore logs

# Database shell
encore db shell

# Run migrations
encore db migrate

# Generate API client
encore gen client

# Run tests with coverage
npm test -- --coverage

# Format code
npm run format

# Lint and fix
npm run lint -- --fix
```

### Troubleshooting / استكشاف الأخطاء

**Port already in use:**
```bash
# Find and kill process
lsof -ti:4000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**Database connection issues:**
```bash
# Reset database
encore db reset

# Check database status
encore db status
```

**Module not found errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build failures:**
```bash
# Clean build artifacts
rm -rf dist .encore

# Rebuild
encore run
```

### IDE Setup / إعداد بيئة التطوير المتكاملة

**VS Code Recommended Extensions:**
- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- Encore

**Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Getting Help / الحصول على المساعدة

- 📖 Read the [Documentation](./README.md)
- 💬 Join discussions on GitHub
- 🐛 Report bugs via GitHub Issues
- 📧 Contact maintainers (see CODE_OF_CONDUCT.md)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

من خلال المساهمة، فإنك توافق على أن مساهماتك سيتم ترخيصها بموجب نفس ترخيص المشروع.

---

**Thank you for contributing! / شكرًا لمساهمتك!** 🎉
