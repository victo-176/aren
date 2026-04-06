# ANON - Terminal Hacker Messaging System

A complete web application that looks and behaves like a hacker-style terminal interface. Features real-time messaging with accounts, ranks, tasks, and administrative control.

## 🎨 Features

### User Features
- **Hacker Terminal UI** - Pure black background with neon-green monospace text
- **Real-time Chat** - WebSocket-based instant messaging
- **Anonymity** - Users only see usernames, avatars, ranks, and points
- **User Profiles** - Track your rank, points, and achievements
- **Tasks System** - Complete tasks to earn points and level up
- **User Reports** - Report inappropriate behavior
- **Online Status** - See who's currently online
- **Typing Indicators** - See when others are typing
- **Commands** - `/dm username message`, `/report username`, `/help`

### Admin Features
- **Admin Login** - Secure admin-only access with password authentication
- **User Management** - View all users with full details
- **User Controls** - Change ranks, add points, suspend, or block users
- **Message Logs** - View and delete messages
- **Task Management** - Create and assign tasks
- **Report Management** - View and resolve user reports
- **Admin Logs** - Track all admin actions
- **System Monitor** - View real-time system status

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Socket.IO
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** bcryptjs for password hashing, rate limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or hosted)
- npm or yarn package manager

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone and navigate
git clone https://github.com/victo-176/aren.git
cd aren

# 2. Install backend
cd backend && npm install && cd ..

# 3. Start MongoDB (in separate terminal/window)
mongod

# 4. Start Node backend (in new terminal, from aren/backend)
npm run dev

# 5. Start frontend (in another new terminal, from aren/frontend)
python -m http.server 5500
# OR: npx http-server . -p 5500

# 6. Open browser
# Visit: http://localhost:5500
```

**First login:** Leave username blank, enter any password, click LOGIN

**Admin access:** Click "Admin?" → Enter your secret admin password (configured in .env)

## 📖 Detailed Guides

- **[SETUP.md](SETUP.md)** - Complete local setup with troubleshooting & development workflow
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy to Heroku, Railway, Render, or DigitalOcean

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/victo-176/aren.git
cd aren
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/aren
JWT_SECRET=your_secret_key_here
ADMIN_PASSWORD=your_secret_admin_password
CORS_ORIGIN=http://localhost:5500
CLIENT_URL=http://localhost:5500
```

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod
```

### 5. Start Backend Server

```bash
# From backend directory
npm run dev    # Using nodemon for development
```

Server will run on `http://localhost:3000`

### 6. Start Frontend

```bash
cd frontend
python -m http.server 5500
# OR: npx http-server . -p 5500
```

Access the app at `http://localhost:5500`

## 🔐 Security Features

### User Authentication
- JWT-based session management
- Bcrypt password hashing with salt (10 rounds)
- Secure password validation
- Session expiration (7 days default)

### Admin Authentication
- Separate admin login with password-protected access
- Server-side password validation (never exposed in frontend)
- Admin password stored in environment variables
- Admin login logging with IP and User-Agent

### Rate Limiting
- Login attempt rate limiting (5 attempts per 15 minutes)
- Prevents brute force attacks
- Applies to both user and admin login

### Data Protection
- CORS enabled and configurable
- Input validation on all endpoints
- XSS protection through input sanitization
- SQL injection protection through Mongoose ODM

## 🎮 How to Use

### First Time Login

1. Go to the application
2. Enter a username (or leave blank for random)
3. Enter a password
4. Click "LOGIN" to create account or login
5. You'll be assigned a random anonymous username like `ghost_742`

### User Dashboard

- **Chat** - Type messages in the main chat area
- **Tasks** - Visible in the sidebar, click to complete
- **Profile** - View your username, rank, and points
- **Commands** - Type `/help` for available commands

### Admin Access

1. On login screen, click "Admin?"
2. Enter admin password: `**************`
3. Access the admin panel with tabs for:
   - **USERS** - Manage all users
   - **MESSAGES** - View and delete messages
   - **TASKS** - Create and manage tasks
   - **REPORTS** - Review user reports
   - **LOGS** - View admin action logs

### Admin Commands

**User Management:**
- EDIT - View detailed user info
- RANK - Change user rank (NOVICE → LEGEND → ADMIN)
- +PTS - Award points to user
- SUSPEND - Temporarily suspend user
- UNSUSPEND - Restore suspended user
- BLOCK - Permanently ban user

**Task Management:**
- Create new tasks with point rewards
- Assign tasks to specific users
- Track task completion

**Message Logs:**
- Search messages by content or username
- Delete inappropriate messages

**Reports:**
- View user reports with reason
- Resolve reports

## 📊 Database Schema

### User
```
{
  username: String (unique, 3-20 chars)
  email: String (unique)
  passwordHash: String
  avatar: String (URL)
  rank: String (Newbie, Hacker, Elite, Legend, Admin)
  points: Number
  level: Number
  status: String (active, suspended, banned)
  isAdmin: Boolean
  tasks: Array {taskId, completed, completedAt}
  achievements: Array
  onlineStatus: Boolean
  createdAt: Date
  lastLogin: Date
}
```

### Message
```
{
  sender: Object {id, username, avatar, rank}
  content: String
  channel: String (default: 'general')
  createdAt: Date
}
```

### Task
```
{
  title: String
  description: String
  points: Number
  assignedTo: ObjectId (User)
  completed: Boolean
  completedAt: Date
  createdAt: Date
}
```

### Report
```
{
  reportedUser: ObjectId (User)
  reportedBy: ObjectId (User)
  reason: String
  resolved: Boolean
  resolvedAt: Date
  createdAt: Date
}
```

### AdminLog
```
{
  admin: ObjectId (User)
  action: String
  targetUser: ObjectId (User)
  details: Object
  ipAddress: String
  userAgent: String
  createdAt: Date
}
```

## 🎨 Design System

### Colors
- Primary: `#00ff00` (Neon Green)
- Secondary: `#00ffff` (Cyan)
- Accent: `#ff00ff` (Magenta)
- Background: `#000000` (Pure Black)
- Surface: `#0a0a0a` (Dark Gray)

### UI Elements
- CRT screen scanline effect
- Glitch animation for text
- Neon glow shadows
- Terminal-style window frame
- Blinking cursor indicator
- Smooth typing animations

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Messages
- `GET /api/messages` - Get messages (paginated)
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message (admin)

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users` - List all users

### Tasks
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks/:id/complete` - Complete task

### Reports
- `POST /api/reports` - Create report
- `GET /api/reports` - List reports (admin)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/messages` - Get all messages
- `GET /api/admin/tasks` - Get all tasks
- `GET /api/admin/reports` - Get all reports
- `GET /api/admin/logs` - Get admin logs
- `PATCH /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/block` - Block user
- `POST /api/admin/tasks` - Create task
- `DELETE /api/admin/messages/:id` - Delete message
- `DELETE /api/admin/tasks/:id` - Delete task
- `POST /api/admin/reports/:id/resolve` - Resolve report

## 📱 Responsive Design

The application is fully responsive:
- **Desktop** (1920px+) - Full side-by-side layout
- **Tablet** (768px-1024px) - Stacked layout with collapsible sidebar
- **Mobile** (< 768px) - Optimized touch interface

## 🌐 WebSocket Events

### Client → Server
- `send-message` - Send message to channel
- `user-typing` - Notify typing
- `user-stopped-typing` - Stop typing
- `join-channel` - Join a channel
- `leave-channel` - Leave a channel

### Server → Client
- `new-message` - New message received
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `user-joined` - User joined channel
- `user-left` - User left channel
- `user-online` - User came online
- `user-offline` - User went offline

## 🚨 Troubleshooting

### Connection Issues
- Ensure MongoDB is running: `mongod`
- Check if backend is running on port 3000
- Verify CORS settings match your frontend URL
- Check browser console for JavaScript errors

### Login Issues
- Verify `.env` file is configured correctly
- Check that JWT_SECRET is set
- Ensure MongoDB connection string is correct

### Admin Login Issues
- Verify ADMIN_PASSWORD is set in `.env`
- Admin password should be a strong, secret value configured by you
- Check admin login endpoint: `POST /api/auth/admin-login`

### WebSocket Connection Issues
- Ensure Socket.IO is configured with correct CORS origin
- Check browser console for connection errors
- Verify token is being sent with socket connection

## 📦 Deployment

### Deploy to Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create aren-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_production_secret
heroku config:set ADMIN_PASSWORD=your_secure_password
heroku config:set MONGODB_URI=your_mongodb_url

# Deploy
git push heroku main
```

### Deploy to Railway/Render

1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

## 📝 License

MIT License - feel free to use this for your projects!

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please create an issue on GitHub.

---

**Made with ❤️ by Victo-176**

Access it at: `http://localhost:5500`