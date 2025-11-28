# 🚀 Futuristic Website with Advanced Security

A cyberpunk-themed website with enterprise-level authentication and security features.

## 🔐 Security Features

### Backend Authentication
- **JWT Token Authentication** with 30-minute expiration
- **BCrypt Password Hashing** with salt rounds
- **Rate Limiting** (5 attempts, 15-minute lockout)
- **Session Management** with server validation
- **Role-Based Access Control** (Admin/User)

### Advanced Security
- **Device Fingerprinting** for session validation
- **CSRF Protection** with tokens
- **XSS Prevention** with input sanitization
- **Content Security Policy** headers
- **Activity Logging** with timestamps
- **Dev Tools Protection** and detection

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd futuristic-website

# Install dependencies
npm install

# Start the server
npm start
```

### Development Mode
```bash
npm run dev
```

## 🔑 Default Login Credentials

### Admin Access
- **Username:** admin
- **Password:** admin123
- **Access:** Full admin panel, user management, system logs

### User Access
- **Username:** user
- **Password:** user123
- **Access:** Standard user features

## 📁 Project Structure

```
futuristic-website/
├── server.js              # Express server with authentication
├── server-auth.js          # Client-side server integration
├── auth.js                 # Legacy client-side auth (backup)
├── package.json            # Dependencies and scripts
├── index.html              # Homepage
├── login.html              # Login page
├── register.html           # Registration page
├── admin.html              # Admin dashboard
├── about.html              # About page
├── services.html           # Services page
├── portfolio.html          # Portfolio page
├── contact.html            # Contact page
├── style.css               # Futuristic styling
└── README.md               # This file
```

## 🌐 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/verify` - Session verification

### Admin Only
- `GET /api/users` - Get all users
- `GET /api/logs` - Get system logs

### Public
- `POST /api/contact` - Send contact message

## 🎨 Features

### Frontend
- **Cyberpunk Design** with neon colors and animations
- **Glass Morphism** effects and hover animations
- **Responsive Design** for all devices
- **Interactive Elements** with smooth transitions
- **Typing Animations** and particle effects

### Backend
- **Express.js Server** with security middleware
- **JWT Authentication** with refresh tokens
- **Password Encryption** using BCrypt
- **Rate Limiting** to prevent brute force
- **Comprehensive Logging** of all activities

### Security Monitoring
- **Login Attempts** tracking and lockout
- **Session Fingerprinting** for device validation
- **Activity Logging** with timestamps and IP tracking
- **Dev Tools Detection** and blocking
- **Unauthorized Access** prevention

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
PORT=3000
JWT_SECRET=your_jwt_secret_here
SESSION_TIMEOUT=1800000
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=900000
```

### Security Settings
- Session timeout: 30 minutes
- Max login attempts: 5
- Lockout duration: 15 minutes
- Token expiration: 30 minutes

## 📊 Admin Dashboard Features

- **User Management** - View, edit, delete users
- **System Analytics** - Login statistics and metrics
- **Activity Logs** - Real-time security monitoring
- **Content Management** - Edit website content
- **Message Center** - Contact form submissions
- **Security Settings** - Configure system parameters

## 🛡️ Security Best Practices

1. **Password Policy** - Minimum 8 characters
2. **Session Security** - Automatic timeout and validation
3. **Input Validation** - All inputs sanitized and validated
4. **Error Handling** - No sensitive information in errors
5. **Logging** - Comprehensive activity and security logs
6. **Access Control** - Role-based permissions

## 🚀 Deployment

### Production Setup
1. Set environment variables
2. Use HTTPS in production
3. Configure reverse proxy (Nginx)
4. Set up database (MongoDB/PostgreSQL)
5. Enable process manager (PM2)

### Docker Deployment
```bash
# Build image
docker build -t futuristic-website .

# Run container
docker run -p 3000:3000 futuristic-website
```

## 📝 Logging System

### Client-Side Logs
- Login attempts and results
- Page navigation and access
- Security violations
- User activity patterns

### Server-Side Logs
- Authentication events
- API requests and responses
- Error tracking
- Performance metrics

## 🔍 Monitoring

The system logs all activities including:
- ✅ Successful logins
- ❌ Failed login attempts
- 🔒 Session timeouts
- 🚫 Unauthorized access attempts
- 🛠️ Dev tools detection
- 📧 Contact form submissions

## 📞 Support

For technical support or security concerns:
- Email: CyberArt3333@gmail.com
- Phone: +91 8302277030

## 📄 License

MIT License - See LICENSE file for details

---

**⚠️ Security Notice:** This system includes advanced security features. Ensure all default passwords are changed in production environments."# Portfolio-Website" 
# Portfolio-Website
