# ANON - Deployment Guide

This guide covers deploying the ANON hacker-style messaging system to production.

## 🚀 Deployment Platforms

### Option 1: Heroku (Easiest for Small Projects)

#### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed
- Git repository

#### Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ubuntu/Debian
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login to Heroku

```bash
heroku login
```

#### Step 3: Create Heroku App

```bash
heroku create aren-app-name
```

#### Step 4: Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_very_secure_random_string_here
heroku config:set ADMIN_PASSWORD=your_secure_admin_password
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set PORT=3000
heroku config:set CORS_ORIGIN=https://aren-app-name.herokuapp.com
heroku config:set CLIENT_URL=https://aren-app-name.herokuapp.com
```

#### Step 5: Deploy

```bash
git push heroku main
```

#### Step 6: View Logs

```bash
heroku logs --tail
```

### Option 2: Railway (Modern Alternative)

#### Step 1: Create Account

Visit https://railway.app and create an account

#### Step 2: Create New Project

Click "New Project" → "Deploy from GitHub"

#### Step 3: Connect Repository

- Select your GitHub repository
- Authorize Railway to access GitHub

#### Step 4: Configure Environment Variables

In Railway dashboard, set:
```
NODE_ENV=production
JWT_SECRET=your_very_secure_random_string_here
ADMIN_PASSWORD=your_secure_admin_password
MONGODB_URI=your_mongodb_atlas_connection_string
CORS_ORIGIN=your_railway_domain_url
CLIENT_URL=your_railway_domain_url
```

#### Step 5: Deploy

Railway automatically deploys on push. View in dashboard.

### Option 3: Render (Free Tier Available)

#### Step 1: Create Account

Visit https://render.com and create an account

#### Step 2: Create Web Service

- Click "New +" → "Web Service"
- Connect GitHub repository
- Select the repository

#### Step 3: Configure

- **Name:** aren-app
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

#### Step 4: Add Environment Variables

In "Environment" section, add:
```
NODE_ENV=production
JWT_SECRET=your_very_secure_random_string_here
ADMIN_PASSWORD=your_secure_admin_password
MONGODB_URI=your_mongodb_atlas_connection_string
CORS_ORIGIN=https://aren-app.onrender.com
CLIENT_URL=https://aren-app.onrender.com
```

#### Step 5: Deploy

Click "Create Web Service" and Render will deploy automatically

### Option 4: DigitalOcean App Platform

#### Step 1: Create Account

Visit https://digitalocean.com and create an account with payment info

#### Step 2: Create App

- Click "Create" → "Apps"
- Connect GitHub
- Select repository

#### Step 3: Configure

- Set build and run commands
- Add environment variables

#### Step 4: Deploy

Click "Deploy" and wait for deployment

## 🗄️ Database Setup

### MongoDB Atlas (Free Cloud Database)

#### Step 1: Create Account

Visit https://www.mongodb.com/cloud/atlas

#### Step 2: Create Cluster

- Click "Build a Cluster"
- Choose "M0 Sandbox" (free tier)
- Select region
- Click "Create Cluster"

#### Step 3: Create Database User

- Go to "Database Access"
- Click "Add New Database User"
- Set username and password
- Note the password safely

#### Step 4: Get Connection String

- Go to "Clusters"
- Click "Connect"
- Choose "Connect your application"
- Copy the connection string
- Replace `<password>` with your password

Example:
```
mongodb+srv://username:password@cluster0.abcde.mongodb.net/aren?retryWrites=true&w=majority
```

#### Step 5: Whitelist IP Addresses

- Go to "Network Access"
- Click "Add IP Address"
- For production: Add 0.0.0.0/0 (allows all) or add your specific IPs

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a random 32+ character string
- [ ] Change `ADMIN_PASSWORD` to a strong password (20+ characters, mixed case, numbers, symbols)
- [ ] Ensure `NODE_ENV=production`
- [ ] Use HTTPS only (all platforms provide this)
- [ ] Enable CORS only for your domain
- [ ] Set MongoDB password to strong value
- [ ] Enable IP whitelist on MongoDB Atlas
- [ ] Review `.env` file is not committed to Git
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting in production

## 🌐 Domain Setup

### Custom Domain on Heroku

```bash
heroku domains:add www.example.com
```

Then add CNAME record to your DNS:
```
CNAME: www.example.com -> your-app-name.herokuapp.com
```

### Custom Domain on Railway/Render

In dashboard settings, add custom domain and follow DNS instructions provided

## 📊 Monitoring

### Heroku

```bash
# View real-time logs
heroku logs --tail

# View app metrics
heroku metrics

# Restart app
heroku restart
```

### Railway

- Use Railway dashboard for real-time logs
- Monitor CPU and memory usage
- View deployment history

### Render

- View logs in dashboard
- Monitor resource usage
- Set up alerts

## 🔄 Database Backup

### MongoDB Atlas Automated Backups

- Atlas automatically backs up data daily (M0 not included)
- For free tier: manually export data regularly

```bash
# Export MongoDB data
mongodump --uri="your_connection_string" --out=./backup

# Import MongoDB data
mongorestore --uri="your_connection_string" ./backup
```

## 📈 Scaling

### When to Scale

- User base grows beyond 1000 concurrent users
- Database size exceeds 500MB
- Response times exceed 1 second average

### Scaling Options

1. **Upgrade MongoDB Plan**
   - M2 or higher tier
   - Enables automated backups
   - Better performance

2. **Add Dyno Workers** (Heroku)
   ```bash
   heroku ps:scale worker=1
   ```

3. **Upgrade Instance Size**
   - Railway, Render: Upgrade to paid plans
   - DigitalOcean: Increase app spec

## 🚨 Troubleshooting

### App Won't Start

```bash
# Check logs
heroku logs --tail

# Ensure all env vars are set
heroku config

# Restart app
heroku restart
```

### Database Connection Issues

- Verify MongoDB URI is correct
- Check IP whitelist on MongoDB Atlas
- Ensure credentials are accurate
- Test connection locally first

### CORS Issues

- Verify `CORS_ORIGIN` matches frontend domain
- Check browser console for specific error
- Ensure localhost is allowed in CORS if testing

### WebSocket Connection Issues

- WebSocket must work on your hosting platform
- Some proxies block WebSocket
- Ensure Socket.IO is properly configured
- Check browser console for connection errors

## 📝 CI/CD Pipeline

### GitHub Actions Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "aren-app-name"
          heroku_email: "your-email@example.com"
```

Then add `HEROKU_API_KEY` to GitHub Secrets

## 📞 Post-Deployment Checklist

- [ ] Test login functionality
- [ ] Test admin login with password
- [ ] Send test message
- [ ] Create and complete task
- [ ] Create user report
- [ ] Test admin panel functions
- [ ] Verify real-time chat works
- [ ] Check upload functionality
- [ ] Monitor error logs
- [ ] Load test with multiple users

## 💰 Cost Estimates

### Free Options
- **Heroku**: Free tier, limited resources
- **Railway**: $5/month minimum
- **Render**: Free tier available
- **MongoDB Atlas**: M0 free tier (512MB storage)

### Recommended Production Setup
- **Hosting**: $10-20/month
- **Database**: $50-100/month  
- **Domain**: $10-15/month
- **CDN** (optional): $20+/month
- **Total**: ~$100-150/month minimum

## 🔗 Useful Resources

- [Heroku Documentation](https://devcenter.heroku.com/)
- [Railway Docs](https://docs.railway.app/)
- [Render Deployment Docs](https://render.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Happy deployment! 🚀**
