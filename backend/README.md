# Backend - Jira Clone API

Node.js/Express backend for the Jira Clone application with MongoDB and Redis integration.

## 🎯 Features

- ✅ RESTful API
- ✅ JWT Authentication
- ✅ MongoDB Database
- ✅ Redis Caching
- ✅ Real-time Updates (Socket.io)
- ✅ Error Handling
- ✅ Security Middleware
- ✅ Rate Limiting
- ✅ File Uploads

## 📦 Dependencies

### Core
- `express@^4.18.2` - Web framework
- `cors@^2.8.5` - CORS middleware
- `helmet@^7.1.0` - Security headers

### Database
- `mongoose@^8.0.3` - MongoDB ODM
- `mongodb@^6.3.0` - MongoDB driver

### Caching
- `redis@^4.6.12` - Redis client

### Authentication
- `jsonwebtoken@^9.1.2` - JWT
- `bcryptjs@^2.4.3` - Password hashing

### Environment
- `dotenv@^16.3.1` - Environment variables

### Validation
- `express-validator@^7.0.0` - Input validation

### Real-time
- `socket.io@^4.7.2` - WebSocket server

### Security
- `express-ratelimit@^7.1.5` - Rate limiting
- `helmet@^7.1.0` - Security headers

### File Upload
- `multer@^1.4.5-lts.1` - File upload
- `cloudinary@^1.41.0` - Image storage

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:
```bash
cp .env.example .env
```

Update with your settings:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/jira-clone
JWT_SECRET=your_jwt_secret_key_here
REDIS_URL=redis://localhost:6379
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Production

```bash
npm start
```

## 📂 Folder Structure

```
src/
├── routes/              # API routes
│   ├── auth.js
│   ├── projects.js
│   ├── issues.js
│   └── users.js
├── controllers/         # Route handlers
│   ├── authController.js
│   ├── projectController.js
│   ├── issueController.js
│   └── userController.js
├── models/              # MongoDB models
│   ├── User.js
│   ├── Project.js
│   ├── Issue.js
│   └── Sprint.js
├── middleware/          # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── utils/               # Utility functions
│   ├── jwt.js
│   ├── email.js
│   └── database.js
├── config/              # Configuration
│   ├── database.js
│   ├── redis.js
│   └── cloudinary.js
├── index.js             # Server entry point
```

## 🔐 Authentication

### JWT Workflow

1. User registers/logs in
2. Server generates JWT token
3. Client stores token
4. Client includes token in Authorization header
5. Server validates token on protected routes

### Protected Routes

Add auth middleware to routes:
```javascript
router.get('/profile', authMiddleware, getUserProfile)
```

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (Admin, Member),
  avatar: String,
  createdAt: Date
}
```

### Project Model
```javascript
{
  name: String,
  key: String (unique),
  description: String,
  lead: ObjectId (User),
  team: [ObjectId] (Users),
  status: String,
  createdAt: Date
}
```

### Issue Model
```javascript
{
  key: String (unique),
  title: String,
  description: String,
  project: ObjectId (Project),
  type: String (Bug, Feature, Task),
  priority: String,
  status: String,
  assignee: ObjectId (User),
  storyPoints: Number,
  labels: [String],
  createdAt: Date
}
```

### Sprint Model
```javascript
{
  name: String,
  project: ObjectId (Project),
  startDate: Date,
  endDate: Date,
  goal: String,
  status: String,
  issues: [ObjectId] (Issues),
  createdAt: Date
}
```

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
POST   /api/auth/refresh      - Refresh token
```

### Projects
```
GET    /api/projects          - Get all projects
POST   /api/projects          - Create project
GET    /api/projects/:id      - Get project details
PUT    /api/projects/:id      - Update project
DELETE /api/projects/:id      - Delete project
GET    /api/projects/:id/stats - Get project stats
```

### Issues
```
GET    /api/issues            - Get all issues
POST   /api/issues            - Create issue
GET    /api/issues/:id        - Get issue details
PUT    /api/issues/:id        - Update issue
DELETE /api/issues/:id        - Delete issue
POST   /api/issues/:id/comments - Add comment
```

### Sprints
```
GET    /api/sprints           - Get all sprints
POST   /api/sprints           - Create sprint
GET    /api/sprints/:id       - Get sprint details
PUT    /api/sprints/:id       - Update sprint
DELETE /api/sprints/:id       - Delete sprint
POST   /api/sprints/:id/start  - Start sprint
POST   /api/sprints/:id/end    - End sprint
```

### Users
```
GET    /api/users             - Get all users
POST   /api/users             - Create user
GET    /api/users/:id         - Get user details
PUT    /api/users/:id         - Update user
DELETE /api/users/:id         - Delete user
```

## 🔄 Real-time Features

### Socket Events

```javascript
// Connected
socket.on('connection', (socket) => {
  console.log('Client connected')
})

// Issue Updates
socket.emit('issue:created', newIssue)
socket.emit('issue:updated', updatedIssue)
socket.emit('issue:deleted', issueId)

// Comments
socket.emit('comment:added', newComment)

// Notifications
socket.emit('notification:new', notification)
```

## 🚨 Error Handling

Standardized error response:
```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-04-15T10:30:00Z"
}
```

## 🔒 Security Features

- ✅ Helmet.js for security headers
- ✅ CORS for cross-origin requests
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation
- ✅ SQL injection prevention (using Mongoose)
- ✅ XSS protection
- ✅ Password hashing with bcryptjs

## 📊 Caching Strategy

Using Redis for:
- User sessions
- Token blacklisting
- Frequently accessed data
- Rate limit counters

## 📝 Environment Variables

```
PORT=5000                              # Server port
NODE_ENV=development                   # Environment
MONGODB_URI=mongodb://localhost:27017  # MongoDB connection
JWT_SECRET=your_secret_key_here        # JWT secret
JWT_EXPIRE=7d                          # JWT expiration
REDIS_URL=redis://localhost:6379       # Redis connection
CLOUDINARY_NAME=your_cloud_name        # Cloudinary account
CLOUDINARY_API_KEY=your_api_key        # Cloudinary API key
CLOUDINARY_API_SECRET=your_secret      # Cloudinary secret
```

## 🧪 Testing

```bash
npm test
```

## 🚀 Deployment

### Heroku
```bash
git push heroku main
```

### Docker
```bash
docker build -t jira-backend .
docker run -p 5000:5000 jira-backend
```

### Manual
1. Push code to server
2. Install dependencies
3. Set environment variables
4. Start with `npm start`

## 📚 API Documentation

Full API documentation with examples coming soon...

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Add tests
4. Submit pull request

## 📄 License

MIT License

---

Built with ❤️ for robust project management APIs
