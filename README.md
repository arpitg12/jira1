# JiraFlow

A full-stack Jira-inspired project management and knowledge-sharing platform built for role-based team collaboration.

JiraFlow combines project tracking, workflow configuration, issue management, notifications, and an internal learning hub in one workspace. Admins can manage users, workflows, project visibility, and issue lifecycles, while members get a focused view of only the work they are allowed to access.

## Highlights

- Role-based workspace for `Admin` and member users
- JWT authentication with persistent login
- Project-level visibility control
- Workflow and global state management
- Issue tracking with assignees, reviewers, comments, replies, mentions, and attachments
- In-app notifications and browser push notifications
- Internal `Learn` hub for article-based knowledge sharing
- Dark/light theme support
- Responsive UI with searchable filters and reusable admin screens

## Tech Stack

### Frontend

- React
- React Router DOM
- Tailwind CSS
- Context API
- React Icons

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Web Push
- Helmet
- CORS

## Key Modules

### Authentication and Access Control

- Email/password login
- JWT-based API protection
- Persistent login using browser storage
- Admin-only routes and actions
- Backend-enforced authorization for projects and issues

### Project Management

- Create, edit, and delete projects
- Assign workflows to projects
- Restrict projects to selected users or make them visible to all members

### Workflow Engine

- Reusable global states
- Custom workflows with required states
- Default state configuration
- Admin-controlled workflow editing

### Issue Tracking

- Create and update issues
- Assignee and reviewer selection
- Priority and workflow-aware status handling
- Issue detail view with attachments, comments, replies, and mentions

### Learn Hub

- Shared article-based knowledge space
- Header-based search
- Author/admin-only edit and delete permissions
- Readable by all authenticated users

### Notifications

- In-app notification center
- Unread count tracking
- Notification preferences
- Browser push support through service workers

## Project Structure

```text
jira1/
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── config/
│   └── public/
├── backend/                      # Express API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── uploads/
│   │   └── utils/
└── APPLICATION_COMPLETE_GUIDE.md # Full internal application walkthrough
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd jira1
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure environment variables

Backend environment file:

Create `backend/src/.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/jira-app
MONGODB_ADMIN_URI=mongodb://127.0.0.1:27017
PRIMARY_DATABASE_NAME=jira-app
LEGACY_DATABASE_NAME=jira-app
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000
BODY_LIMIT=10mb
UPLOADS_DIR=uploads
VAPID_SUBJECT=mailto:admin@jira.local
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

Frontend environment file:

Create `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOADS_BASE_URL=http://localhost:5000
```

### 4. Start the backend

```bash
cd backend
npm run dev
```

### 5. Start the frontend

```bash
cd frontend
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

Backend runs on:

```text
http://localhost:5000
```

## Default Application Flow

1. Open the landing page
2. Log in with a registered user
3. Frontend stores the JWT token locally
4. Protected routes load based on user role
5. Admins can manage projects, workflows, members, and issues
6. Members can access only permitted projects and issues

## Available Scripts

### Frontend

```bash
npm start
npm run build
```

### Backend

```bash
npm run dev
npm start
```

## Deployment Notes

For production deployment on a server:

- Build the frontend with `npm run build`
- Run the backend with a process manager like PM2
- Set `CORS_ORIGINS` to your public frontend URL
- Set frontend env values to the deployed backend API URL
- Prefer using Nginx as a reverse proxy for:
  - frontend static files
  - `/api` backend routes
  - `/uploads` static attachments

Example production frontend env:

```env
REACT_APP_API_URL=http://your-server-ip/api
REACT_APP_UPLOADS_BASE_URL=http://your-server-ip
```