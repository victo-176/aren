# ANON - Local Setup Guide

Complete step-by-step guide to set up and run ANON locally on your machine.

## 🖥️ System Requirements

- **Node.js**: v14.0.0 or higher
- **MongoDB**: v4.4 or higher
- **npm** or **yarn**: Latest version
- **Git**: Latest version
- **RAM**: 2GB minimum recommended
- **Disk Space**: 500MB minimum

## 🚀 Quick Start (5 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/victo-176/aren.git
cd aren
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 3. Start MongoDB

**On Linux/Mac:**
```bash
mongod
```

**On Windows:**
```powershell
mongod
# Or if installed as service:
net start MongoDB
```

### 4. Configure Environment

Copy and edit the .env file:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/aren
JWT_SECRET=your_secret_key_here_CHANGE_THIS
ADMIN_PASSWORD=your_secret_admin_password
CORS_ORIGIN=http://localhost:5500
CLIENT_URL=http://localhost:5500
```

### 5. Start Backend Server

```bash
cd backend
npm run dev
```

Expected output:
```
> nodemon server.js
[SERVER] Running on port 3000
[DATABASE] Connected to MongoDB successfully
```

### 6. Start Frontend (New Terminal)

Navigate to frontend directory:

```bash
cd frontend
python -m http.server 5500
```

Or using Node.js:

```bash
npx http-server . -p 5500
```

### 7. Open in Browser

Visit: `http://localhost:5500`

## 📋 Detailed Setup Guide

### Prerequisites Installation

#### Node.js Installation

**macOS (Using Homebrew):**
```bash
brew install node
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nodejs npm
```

**Windows:**
Download from: https://nodejs.org/
Run the installer and follow instructions

#### MongoDB Installation

**macOS (Using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download from: https://www.mongodb.com/try/download/community
Run installer with default settings

**Verify MongoDB:**
```bash
mongo --version
```

#### Git Installation

**macOS:**
```bash
brew install git
```

**Ubuntu:**
```bash
sudo apt install git
```

**Windows:**
Download from: https://git-scm.com/

### Project Setup

#### Step 1: Clone Repository

```bash
git clone https://github.com/victo-176/aren.git
cd aren
```

#### Step 2: Verify Directory Structure

```bash
tree -L 2
# Or on Windows:
dir /s /b
```

Expected structure:
```
aren/
├── backend/           # Node.js server
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── frontend/          # Web interface
│   ├── index.html
│   ├── styles.css
│   ├── auth.js
│   ├── chat.js
│   └── admin.js
├── README.md
└── DEPLOYMENT.md
```

#### Step 3: Install Dependencies

Backend:
```bash
cd backend
npm install
```

Check installation:
```bash
npm list
```

Expected packages:
- express
- socket.io
- mongoose
- jsonwebtoken
- bcryptjs
- dotenv
- cors
- express-rate-limit
- nodemon

#### Step 4: Verify MongoDB

```bash
# Start MongoDB service
mongod

# In another terminal, verify connection
mongo
# Should show: MongoDB shell version
```

If MongoDB won't start:
```bash
# Check if port 27017 is in use
netstat -an | grep 27017  # macOS/Linux
netstat -ano | findstr :27017  # Windows

# Kill process on port 27017 if needed and restart mongod
```

#### Step 5: Create .env File

In `backend/` directory:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
# Development Configuration
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/aren

# JWT (keep secret!)
JWT_SECRET=dev_secret_key_change_in_production_12345

# Admin - Set your own SECRET password
ADMIN_PASSWORD=your_secret_admin_password

# CORS & Frontend
CORS_ORIGIN=http://localhost:5500
CLIENT_URL=http://localhost:5500

# Logging
LOG_LEVEL=debug
```

#### Step 6: Start MongoDB

Keep a terminal window open with MongoDB running:

```bash
mongod
```

You should see:
```
[initandlisten] Waiting for connections on port 27017
```

#### Step 7: Start Backend Server

In a new terminal:

```bash
cd backend
npm run dev
```

Expected output:
```
[SERVER] Running on port 3000
[SERVER] Environment: development
[DATABASE] Connected: localhost
[SOCKET] WebSocket enabled
```

If port 3000 is already in use:
```bash
# Change PORT in .env to 3001 or higher
# Or kill the process using port 3000
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

#### Step 8: Start Frontend Server

In a new terminal:

```bash
cd frontend

# Option 1: Using Python
python -m http.server 5500

# Option 2: Using Node http-server
npm install -g http-server
http-server . -p 5500

# Option 3: Using Python3
python3 -m http.server 5500
```

Expected output:
```
Serving HTTP on http://localhost:5500
```

#### Step 9: Open Application

1. Open your browser
2. Visit: `http://localhost:5500`
3. You should see the ANON login screen

## 🧪 Testing the Application

### User Account Test

1. **Create Account:**
   - Leave username blank (auto-generated)
   - Enter password: `testpass123`
   - Click LOGIN
   - You'll get a random username like `ghost_742`

2. **Send Message:**
   - Type a message in the chat input
   - Press Enter
   - Message appears in chat

3. **View Tasks:**
   - Tasks appear in left sidebar
   - Click a task to complete it
   - Points increase automatically

### Admin Panel Test

1. **Access Admin:**
   - On login screen, click "Admin?"
   - Enter your secret admin password (set in `.env`)
   - Click AUTHENTICATE

2. **View Users:**
   - Go to USERS tab
   - See all registered users
   - Can edit, change rank, add points

3. **Create Task:**
   - Go to TASKS tab
   - Fill in title, description, points
   - Select user from dropdown
   - Click CREATE TASK

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error: "Cannot connect to MongoDB"**

```bash
# Check if MongoDB is running
mongo --version

# Start MongoDB
mongod

# Verify connection string
echo "mongodb://localhost:27017"

# Test connection
mongo mongodb://localhost:27017
```

**Port 27017 Already In Use:**

```bash
# macOS/Linux
lsof -i :27017
kill -9 <PID>

# Windows
netstat -ano | findstr :27017
taskkill /PID <PID> /F
```

### Node/NPM Issues

**Error: "Command not found: node"**

```bash
# Check Node installation
node --version
npm --version

# If not installed, check installation instructions above
```

**Error: "npm install fails"**

```bash
# Clear npm cache
npm cache clean --force

# Try install again
npm install

# If still fails, remove node_modules
rm -rf node_modules package-lock.json
npm install
```

### Port Already In Use

**Port 3000 (Backend):**

```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or change port in .env
PORT=3001
```

**Port 5500 (Frontend):**

```bash
# Try different port
python -m http.server 5501

# Then visit http://localhost:5501
```

### WebSocket Connection Issues

**Error: "WebSocket connection failed"**

1. Check backend is running: `http://localhost:3000`
2. Check browser console for errors (F12)
3. Verify CORS settings in `backend/.env`
4. Try hard refresh: `Ctrl+Shift+R`

### CORS Errors

**Error: "Cross-Origin Request Blocked"**

Edit `backend/.env`:

```env
CORS_ORIGIN=http://localhost:5500
CLIENT_URL=http://localhost:5500
```

Restart backend server:
```bash
# Ctrl+C to stop
npm run dev  # Restart
```

### Login Issues

**Error: "Invalid credentials" on first login**

1. Verify `.env` file exists in `backend/`
2. Ensure `JWT_SECRET` is set
3. Check MongoDB is running
4. Check backend logs for errors

**Admin password not working**

1. Check the ADMIN_PASSWORD you set in `backend/.env`
2. Make sure you're entering the correct password
3. Ensure backend server has been restarted after changing it
4. Check backend logs for authentication errors

## 📚 Development Tips

### View Backend Logs

```bash
# Already showing with nodemon, but to filter:
npm run dev 2>&1 | grep ERROR
npm run dev 2>&1 | grep DATABASE
```

### Database Management

**View Collections:**

```bash
mongo
> use aren
> db.getCollectionNames()
> db.users.find()
> exit
```

**Clear Database:**

```bash
mongo
> use aren
> db.dropDatabase()
> exit
```

**Export Data:**

```bash
mongodump --db aren --out ./backup
```

**Import Data:**

```bash
mongorestore --db aren ./backup/aren
```

### Testing with Multiple Browsers

Send messages across different browsers:

1. Open in Firefox: `http://localhost:5500`
2. Open in Chrome: `http://localhost:5500`
3. Send message in Firefox
4. See it appear in Chrome in real-time

### Network Testing (Real Device)

1. Get your machine IP:
   ```bash
   # macOS/Linux
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```

2. Edit `backend/.env`:
   ```env
   CORS_ORIGIN=http://YOUR_IP:5500
   CLIENT_URL=http://YOUR_IP:5500
   ```

3. On mobile/other device, visit: `http://YOUR_IP:5500`

## 🔄 Workflow - Making Changes

### Backend Changes

1. Edit files in `backend/` directory
2. Nodemon automatically restarts server
3. Refresh browser to see changes

### Frontend Changes

1. Edit `.html`, `.css`, or `.js` in `frontend/`
2. Hard refresh browser: `Ctrl+Shift+R`
3. Check browser console (F12) for errors

### Database Schema Changes

1. Update Model file in `backend/models/`
2. Clear and repopulate database
3. Restart backend server

## 📞 Common Commands Reference

```bash
# Start MongoDB
mongod

# MongoDB shell
mongo

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Serve frontend
python -m http.server 5500

# View backend logs
npm run dev 2>&1 | less

# Find process on port
lsof -i :3000  (macOS/Linux)
netstat -ano | findstr :3000  (Windows)

# Kill process
kill -9 <PID>  (macOS/Linux)
taskkill /PID <PID> /F  (Windows)

# Clear npm cache
npm cache clean --force
```

## 📖 Next Steps

1. ✅ Setup complete! Start using the app
2. 📖 Read [README.md](README.md) for features
3. 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) when ready to deploy
4. 🔧 Explore code in `backend/controllers/` and `frontend/`
5. 💡 Contribute improvements via Pull Requests

---

**Happy coding! 🚀**

If stuck, check:
1. Browser console (F12)
2. Backend terminal logs
3. MongoDB is running
4. Correct `.env` values
5. Ports aren't blocked
