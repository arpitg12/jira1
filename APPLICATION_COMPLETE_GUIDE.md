# JiraFlow Complete Application Guide

This file explains the full application in simple terms.

It covers:

- What is used in the frontend
- What is used in the backend
- How the code flows
- Which features exist
- How authentication works
- How authorization works
- How validation works
- How data moves from UI to API to database
- Which pages are active
- Which files are important

This guide is based on the current code in this project.

---

## 1. Application Summary

This application is a Jira-style workspace called `JiraFlow`.

Main purpose:

- Admins can manage users, projects, workflows, global states, and issues
- Members can log in and only see the projects and issues they are allowed to access
- Issues support assignees, reviewers, comments, replies, mentions, attachments, and notifications
- Workflows are built using reusable global states
- Notifications are available inside the app and also through browser push notifications

At a high level:

1. User opens the landing page
2. User logs in with email and password
3. Frontend stores the JWT token in `localStorage`
4. Frontend calls backend APIs with `Authorization: Bearer <token>`
5. Backend validates the token and loads the user
6. Role and project visibility decide what the user can see
7. UI renders admin or member-safe screens

---

## 2. Tech Stack Used

## Frontend

- `React`
- `React Router DOM`
- `React Icons`
- `Tailwind CSS`
- Custom global CSS in `frontend/src/index.css`
- Browser `fetch` API through a shared API helper
- Service Worker for push notification handling

## Backend

- `Node.js`
- `Express`
- `MongoDB`
- `Mongoose`
- `jsonwebtoken` for JWT auth
- `bcryptjs` for password hashing
- `helmet` for security headers
- `cors` for CORS restrictions
- `web-push` for browser push notifications

## Storage

- MongoDB stores users, projects, workflows, states, issues, notifications, and counters
- Local storage stores the auth token and current user in the browser
- Uploaded attachments are stored in the configured uploads folder on disk

---

## 3. Important Folder Structure

## Frontend

- `frontend/src/App.js`
  App routes and route protection
- `frontend/src/index.js`
  React app bootstrap and service worker registration
- `frontend/src/context`
  Auth, notification, and theme state
- `frontend/src/layouts`
  Shared page layout
- `frontend/src/components/common`
  Reusable UI building blocks
- `frontend/src/pages`
  Landing page and admin pages
- `frontend/src/services/api.js`
  All frontend API calls
- `frontend/src/utils/pushNotifications.js`
  Service worker and push subscription helpers
- `frontend/public/sw.js`
  Notification service worker

## Backend

- `backend/src/index.js`
  Express server startup and route registration
- `backend/src/config`
  Environment config and MongoDB connection
- `backend/src/routes`
  API route definitions
- `backend/src/controllers`
  Business logic for each API area
- `backend/src/models`
  MongoDB schemas
- `backend/src/middleware/auth.js`
  Auth and permission checks
- `backend/src/utils/notificationEngine.js`
  Notification audience selection and delivery
- `backend/src/utils/pushConfig.js`
  VAPID setup for web push
- `backend/src/utils/migrateLegacyIssueAssignments.js`
  Startup migration for old issue assignment fields

---

## 4. Frontend Architecture

## 4.1 App bootstrap

Main files:

- `frontend/src/index.js`
- `frontend/src/App.js`

Flow:

1. React starts from `index.js`
2. Global CSS is loaded
3. `App` is rendered
4. Service worker registration is attempted
5. `App` wraps the whole UI with:
   - `ThemeProvider`
   - `AuthProvider`
   - `NotificationProvider`
   - `Router`

This means theme, login state, and notifications are available across the app.

## 4.2 Route system

Main routing file:

- `frontend/src/App.js`

Active routes:

- `/`
  Landing page if logged out
- `/admin/dashboard`
  Dashboard
- `/admin/issues`
  Issue list
- `/admin/issue/:id`
  Single issue detail
- `/admin/projects`
  Project list
- `/admin/projects/:id`
  Project detail
- `/admin/members`
  Admin only
- `/admin/workflows`
  Admin only

Protection rules:

- `ProtectedRoute`
  User must be logged in
- `AdminOnlyRoute`
  User must be admin

Redirect behavior:

- If not authenticated, protected routes go back to `/`
- If authenticated, default route depends on role
- Admin default route is `/admin/dashboard`
- Non-admin default route is `/admin/issues`

## 4.3 Layout system

Main layout:

- `frontend/src/layouts/AdminLayout.js`

What it does:

- Shows sidebar
- Shows top header
- Shows profile/logout
- Shows notification bell
- Shows theme switcher
- Chooses different sidebar items for admin vs member

Admin navigation:

- Dashboard
- Issues
- Projects
- Members
- Workflows

Member navigation:

- Dashboard
- Issues
- Projects

## 4.4 Shared contexts

### AuthContext

File:

- `frontend/src/context/AuthContext.js`

Responsibilities:

- Store token and current user
- Restore session from `localStorage`
- Call `/users/me` on startup if token exists
- Expose:
  - `login`
  - `logout`
  - `isAuthenticated`
  - `isAdmin`
  - `isBootstrapping`

### NotificationContext

File:

- `frontend/src/context/NotificationContext.js`

Responsibilities:

- Load notifications
- Load unread count
- Load notification preferences
- Mark single notification as read
- Mark all notifications as read
- Save push subscription
- Poll notifications every 20 seconds
- Listen for service worker messages

### ThemeContext

File:

- `frontend/src/context/ThemeContext.js`

Responsibilities:

- Switch between dark and light mode
- Save theme in `localStorage`
- Update `data-theme` on `documentElement` and `body`

## 4.5 API layer

File:

- `frontend/src/services/api.js`

What it does:

- Reads `REACT_APP_API_URL`
- Adds JSON content type automatically
- Adds `Authorization` header automatically if token exists
- Parses backend JSON response
- Throws an error using backend `error` message if API fails

This file is the single shared API access layer for:

- auth
- users
- workflows
- global states
- issues
- projects
- comments and replies
- attachments
- push subscription
- notifications

## 4.6 Global styling

File:

- `frontend/src/index.css`

What is defined here:

- app theme variables
- dark and light mode variables
- common surface classes
- table styles
- sidebar styles
- issue status pills
- issue type pills
- input/select/textarea default styling

This file acts like a small design system for the whole app.

---

## 5. Frontend Pages and Features

## 5.1 Landing Page

File:

- `frontend/src/pages/LandingPage.js`

Features:

- Marketing-style landing section
- Login modal
- Email and password login form
- Auto redirect after successful login based on role
- Shows app feature highlights

Frontend validation:

- email must not be empty
- password must not be empty

Real auth validation still happens in backend.

## 5.2 Dashboard

File:

- `frontend/src/pages/admin/Dashboard.js`

Features:

- Loads issues, projects, and users
- Shows different stats for admin and member
- Shows signed-in user information
- Shows operational snapshot cards
- Shows access rules section

Current behavior:

- Recent Issues section has been removed

Admin dashboard stats:

- total issues
- open issues
- projects
- members

Member dashboard stats:

- visible issues
- open issues in visible projects
- visible projects
- review count

## 5.3 Issues page

File:

- `frontend/src/pages/admin/Issues.js`

Features:

- Loads issues
- Loads projects
- Loads users for admin
- Loads global states for admin filters
- Create issue modal
- Edit issue modal
- Delete issue action
- Search by issue title or issue ID
- Filter by:
  - type
  - priority
  - status
  - assignee
- Click row to open issue detail

Issue form fields:

- title
- description
- issue type
- priority
- project
- assignees
- reviewers
- status while editing

Status values in the form:

- come from the project workflow states if available
- otherwise fallback to default statuses

## 5.4 Issue Detail page

File:

- `frontend/src/pages/admin/IssueDetail.js`

This is the most feature-rich page in the app.

Features:

- Load single issue
- Load all users
- Inline issue editing
- Inline description editing
- Change:
  - title
  - status
  - priority
  - issue type
  - assignees
  - reviewers
- Delete issue
- Add comments
- Edit comments
- Delete comments
- Add replies
- Edit replies
- Delete replies
- View edit history for comments and replies
- Mention users with `@username`
- Upload attachments
- Delete attachments
- Open image attachments
- Open non-image attachments through URL

Important UI data shown:

- issue ID
- title
- description
- status
- priority
- type
- assignees
- reviewers
- reporter
- project
- created date
- updated date

## 5.5 Projects page

File:

- `frontend/src/pages/admin/Projects.js`

Features:

- Lists projects
- Admin can create project
- Admin can edit project
- Admin can delete project
- Admin can assign project workflow
- Admin can choose project visibility using selected users
- Everyone can open project detail if they have access

Project access behavior:

- If `visibleToUsers` is empty, project is open to all authenticated members
- If `visibleToUsers` has users, only those users can see it
- Admin can always see all projects

## 5.6 Project Detail page

File:

- `frontend/src/pages/admin/ProjectDetail.js`

Features:

- Loads one project
- Loads issues inside that project
- Loads users for admin
- Search by:
  - title
  - issue ID
  - description
- Filter by:
  - status
  - priority
  - assignee
- Admin can create issue from inside the project
- Admin can edit issue from inside the project
- Admin can delete issue from inside the project
- Clicking an issue opens issue detail page

Status options come from the project workflow.

## 5.7 Members page

File:

- `frontend/src/pages/admin/Members.js`

Admin only page.

Features:

- List active users
- Add user
- Delete user
- Change password using email

Restrictions:

- Admin users cannot be deleted

Frontend validation in this page:

- add user form must have username, email, password
- password change form must have:
  - email
  - password
  - confirm password
- new password must be at least 8 characters
- password and confirm password must match

## 5.8 Workflow Editor page

File:

- `frontend/src/pages/admin/WorkflowEditor.js`

Admin only page.

Features:

- List global states
- Create global state
- Edit global state
- Delete global state
- List workflows
- Create workflow
- Edit workflow
- Delete workflow
- Add state to workflow
- Remove state from workflow
- Choose default state for a workflow

Important recent behavior:

- If a global state name changes, issue statuses using that name are updated
- If a global state is deleted:
  - it is removed from workflows
  - workflow default state is adjusted
  - issues using that deleted status are moved to the workflow fallback/default status

## 5.9 Header

File:

- `frontend/src/components/common/Header.js`

Features:

- mobile sidebar toggle
- notification bell
- theme toggle
- profile menu
- logout action

## 5.10 Notification bell

File:

- `frontend/src/components/common/NotificationBell.jsx`

Features:

- opens notification panel
- fetches latest notifications when opened
- shows unread count badge
- mark all as read
- click notification to mark as read and navigate
- responsive behavior for small screens

## 5.11 Mention textarea

File:

- `frontend/src/components/common/MentionTextarea.jsx`

Features:

- detects `@username` mention pattern while typing
- opens suggestion list
- filters user list
- keyboard navigation with:
  - arrow up
  - arrow down
  - enter
  - tab
  - escape

This is used mainly in issue comments and replies.

## 5.12 Inactive or legacy frontend pages

These files exist but are not wired into the current router:

- `KanbanBoard`
- `Backlog`
- `SprintBoard`
- `Roadmap`
- `Notifications`
- `CreateIssue`
- `CreateProject`

These look like older demo or placeholder screens.

---

## 6. Backend Architecture

## 6.1 Server startup

Main file:

- `backend/src/index.js`

Startup flow:

1. Load env
2. Connect to MongoDB
3. Run legacy issue assignment migration
4. Add security middleware
5. Add JSON/body parsers
6. Serve uploaded files from `/uploads`
7. Register all API routes
8. Register error handler
9. Register 404 handler
10. Start listening on configured port

## 6.2 Middleware

File:

- `backend/src/middleware/auth.js`

Important functions:

- `signAuthToken(user)`
  creates JWT
- `authenticate`
  checks `Authorization: Bearer ...`
- `optionalAuthenticate`
  auth is optional
- `requireAdmin`
  blocks non-admin users
- `buildProjectAccessFilter`
  returns Mongo filter for project visibility
- `hasProjectAccess`
  checks if a user can view one project
- `isIssueVisibleToUser`
  checks if issue is visible through project access
- `serializeUser`
  removes private fields and returns safe user payload

## 6.3 Models used

### User

File:

- `backend/src/models/User.js`

Fields:

- username
- email
- password
- role
- active
- pushSubscriptions
- notificationSettings

Roles allowed:

- Admin
- Member
- Lead
- Developer
- Designer
- QA

### Project

File:

- `backend/src/models/Project.js`

Fields:

- name
- description
- workflow
- visibleToUsers
- managers
- members
- watchers
- active

### Workflow

File:

- `backend/src/models/Workflow.js`

Fields:

- name
- description
- states
- defaultState
- active

### GlobalState

File:

- `backend/src/models/GlobalState.js`

Fields:

- name
- color
- description
- isActive

### Issue

File:

- `backend/src/models/Issue.js`

Main fields:

- issueId
- title
- description
- issueType
- priority
- status
- assignees
- reviewAssignees
- reporter
- watchers
- project
- comments
- attachments
- customFields
- timestamps

Nested data:

- comments
- replies
- edit history
- attachments

### Notification

File:

- `backend/src/models/Notification.js`

Fields:

- userId
- title
- body
- type
- actorName
- actionText
- issueTitle
- issueKey
- issueStatus
- url
- isRead
- createdAt

### Counter

File:

- `backend/src/models/Counter.js`

Purpose:

- stores sequence numbers
- currently used for generating issue IDs like `issue-1`, `issue-2`

---

## 7. Backend Routes and What They Do

## 7.1 User routes

File:

- `backend/src/routes/userRoutes.js`

Endpoints:

- `POST /api/users/login`
- `GET /api/users/me`
- `POST /api/users`
- `GET /api/users`
- `PUT /api/users/password`
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

Rules:

- login is public
- first-ever user creation is allowed without admin login
- later user creation is admin-only
- password update by email is admin-only
- user edit/delete is admin-only

## 7.2 Project routes

File:

- `backend/src/routes/projectRoutes.js`

Endpoints:

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

Rules:

- all routes require authentication
- create/update/delete require admin
- get/list uses project visibility rules

## 7.3 Workflow routes

File:

- `backend/src/routes/workflowRoutes.js`

Endpoints:

- `POST /api/workflows`
- `GET /api/workflows`
- `GET /api/workflows/:id`
- `PUT /api/workflows/:id`
- `DELETE /api/workflows/:id`
- `POST /api/workflows/:id/states`
- `DELETE /api/workflows/:id/states`

Rules:

- all are admin-only after authentication

## 7.4 Global state routes

File:

- `backend/src/routes/globalStateRoutes.js`

Endpoints:

- `POST /api/states`
- `GET /api/states`
- `GET /api/states/:id`
- `PUT /api/states/:id`
- `DELETE /api/states/:id`

Rules:

- all require admin

## 7.5 Issue routes

File:

- `backend/src/routes/issueRoutes.js`

Endpoints:

- `POST /api/issues`
- `GET /api/issues`
- `GET /api/issues/:id`
- `PUT /api/issues/:id`
- `DELETE /api/issues/:id`
- `POST /api/issues/:id/comments`
- `PUT /api/issues/:id/comments/:commentId`
- `DELETE /api/issues/:id/comments/:commentId`
- `POST /api/issues/:id/comments/:commentId/replies`
- `PUT /api/issues/:id/comments/:commentId/replies/:replyId`
- `DELETE /api/issues/:id/comments/:commentId/replies/:replyId`
- `POST /api/issues/:id/attachments`
- `DELETE /api/issues/:id/attachments/:attachmentId`

Rules:

- all require authentication
- delete issue is effectively admin-only
- read/update/comment/reply/attachment use issue visibility checks

## 7.6 Notification routes

File:

- `backend/src/routes/notificationRoutes.js`

Endpoints:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences`
- `POST /api/notifications/mark-read/:id`
- `POST /api/notifications/mark-all-read`

Rules:

- all require authentication

## 7.7 Push routes

File:

- `backend/src/routes/pushRoutes.js`

Endpoints:

- `GET /api/push/vapid-public-key`
- `POST /api/push/subscribe`

Rules:

- all require authentication

---

## 8. Authentication Flow

Authentication is JWT based.

Full flow:

1. User enters email and password in the landing page modal
2. Frontend calls `POST /api/users/login`
3. Backend:
   - validates email and password exist
   - finds user by email
   - rejects inactive users
   - compares password with bcrypt
4. If valid:
   - backend signs JWT
   - backend returns `token` and serialized user
5. Frontend stores token and user in `localStorage`
6. On app reload:
   - `AuthContext` reads token from `localStorage`
   - calls `/api/users/me`
   - if token is still valid, session is restored
   - if invalid, local storage is cleared

Important files:

- `frontend/src/context/AuthContext.js`
- `frontend/src/services/api.js`
- `backend/src/controllers/userController.js`
- `backend/src/middleware/auth.js`

---

## 9. Authorization and Access Rules

There are two layers:

- frontend route protection
- backend permission protection

Frontend route protection prevents navigation to screens.

Backend protection prevents unauthorized data access even if someone manually calls an API.

## Role rules

### Admin

Can:

- access dashboard
- access issues
- access projects
- access members
- access workflows
- create/edit/delete users
- create/edit/delete projects
- create/edit/delete workflows
- create/edit/delete global states
- create/edit/delete issues
- reset passwords

### Non-admin member

Can:

- access dashboard
- access issues they are allowed to see
- access projects they are allowed to see
- access issue detail if issue belongs to a visible project

Cannot:

- open members page
- open workflows page
- delete issues
- manage users
- manage workflows or states

## Project visibility rules

Implemented in:

- `buildProjectAccessFilter`
- `hasProjectAccess`
- `isIssueVisibleToUser`

Rules:

- Admin can see everything
- If a project has empty `visibleToUsers`, all authenticated non-admin users can see it
- If `visibleToUsers` has selected users, only those users can see it
- Issues are visible if their project is visible to the current user

---

## 10. Validation Rules

This app validates at both frontend and backend, but backend validation is the real source of truth.

## 10.1 User validation

Backend rules:

- username must be at least 3 characters
- email must match email pattern
- password must be at least 8 characters
- username and email must be unique
- role must be from allowed list

Extra rules:

- first user becomes Admin automatically
- after first user, only admin can create users
- admin users cannot be deleted

## 10.2 Login validation

Backend rules:

- email must be valid
- password must exist
- user must exist
- user must be active
- password hash must match

## 10.3 Project validation

Backend rules:

- project name is required on create
- workflow is required on create
- workflow must exist
- project name must be unique
- selected visible users must exist and be active
- selected manager/member/watcher users must exist and be active

## 10.4 Workflow validation

Backend rules:

- workflow name is required
- workflow name must be unique
- states added to workflow must exist and be active
- default state must belong to workflow state list

## 10.5 Global state validation

Backend rules:

- state name is required
- state name must be unique

## 10.6 Issue validation

Backend rules:

- issue title is required
- project is required
- project must exist
- current user must have access to the project
- selected status must be valid for that project workflow
- assignee and review assignee values are normalized into arrays

Schema rules:

- issueType must be one of:
  - Bug
  - Feature
  - Task
  - Improvement
- priority must be one of:
  - Low
  - Medium
  - High
  - Critical

## 10.7 Comment and reply validation

Backend rules:

- comment text is required
- reply text is required
- comment owner or admin can edit/delete comment
- reply owner or admin can edit/delete reply

## 10.8 Attachment validation

Backend rules:

- attachment name is required
- attachment content is required
- only uploader or admin can delete attachment

## 10.9 Push subscription validation

Backend rules:

- endpoint must exist
- keys.p256dh must exist
- keys.auth must exist
- user cannot register push subscription for a different user ID

## 10.10 Notification preferences validation

Backend rules:

- incoming settings are normalized into booleans
- missing settings fallback to defaults

---

## 11. Main Business Flows

## 11.1 First user bootstrap flow

1. No users exist in DB
2. Public `POST /api/users` is called
3. Backend sees user count is zero
4. New user is created as `Admin`
5. Backend returns token immediately
6. App can continue with admin session

This is how the application gets its first admin.

## 11.2 Normal login flow

1. User submits login form
2. Backend validates credentials
3. Token is generated
4. Frontend stores token and user
5. Frontend redirects user:
   - admin to dashboard
   - member to issues

## 11.3 Create project flow

1. Admin opens Projects page
2. Admin opens Create Project modal
3. Admin selects:
   - name
   - description
   - workflow
   - visible users
4. Frontend sends request to `/api/projects`
5. Backend validates workflow and visible users
6. Project is saved
7. Project is returned with populated workflow and users

## 11.4 Create workflow and states flow

1. Admin creates global states
2. Admin creates workflow
3. Workflow stores state IDs and default state ID
4. Projects attach one workflow
5. Issues in a project can only use status names that belong to that project workflow

## 11.5 Create issue flow

1. Admin opens issue create modal
2. Frontend sends issue data
3. Backend:
   - verifies title and project
   - verifies user has project access
   - loads workflow from project
   - computes allowed statuses
   - chooses provided status or default workflow state
   - generates sequential issue ID like `issue-1`
   - sets reporter to current user
   - builds watcher list
4. Issue is saved
5. Notification engine sends `TASK_CREATED`

## 11.6 Update issue flow

1. User opens issue detail or issue edit modal
2. Frontend sends updated data
3. Backend:
   - loads issue
   - checks visibility
   - checks status belongs to workflow
   - applies updates
   - rebuilds watchers
   - saves issue
4. Notification engine sends `TASK_UPDATED`
5. If assignees changed, `TASK_ASSIGNED` may also be sent

## 11.7 Comment and mention flow

1. User writes comment or reply
2. `MentionTextarea` suggests usernames
3. Comment is saved to issue
4. Watchers are refreshed
5. Notification engine sends `TASK_COMMENTED`
6. Mention parser extracts usernames from text
7. Mentioned users receive `TASK_MENTIONED`

## 11.8 Attachment flow

1. User chooses file
2. Frontend reads file as Base64
3. Frontend sends:
   - file name
   - mime type
   - content
4. Backend writes file to uploads folder
5. Attachment metadata is stored in issue

## 11.9 Global state rename flow

1. Admin edits a global state
2. Backend updates the state document
3. If state name changed:
   - all issues with old status name are updated to new status name

This is how issue status stays in sync after rename.

## 11.10 Global state delete flow

1. Admin deletes global state
2. Backend finds workflows using that state
3. Backend removes that state from workflow state arrays
4. Backend adjusts default state if needed
5. Backend finds projects using those workflows
6. Backend moves issues with deleted status to the workflow fallback/default state

This prevents broken statuses inside issues.

## 11.11 Notification flow

1. Some event happens:
   - issue created
   - assignee changed
   - comment added
   - issue updated
   - user mentioned
2. Backend `notify` or `notifyMentionedUsers` runs
3. Backend loads issue and related context
4. Backend calculates audience
5. Backend respects user notification settings
6. Backend inserts in-app notification documents
7. Backend tries push delivery if browser subscriptions exist

## 11.12 Push notification flow

1. Frontend loads `NotificationContext`
2. It asks for notification permission if needed
3. It requests VAPID public key
4. It subscribes through service worker
5. Subscription is saved in backend user document
6. Backend can send browser push for future events
7. Service worker displays notification and notifies open tabs

---

## 12. Notification Audience Logic

Audience is not the same for every event.

File:

- `backend/src/utils/notificationEngine.js`

Event rules:

### TASK_CREATED

Audience:

- project managers
- project members

### TASK_ASSIGNED

Audience:

- current assignees

### TASK_COMMENTED

Audience:

- watchers
- assignees
- reporter
- users who already commented or replied

### TASK_UPDATED

Audience:

- project watchers
- issue watchers
- assignees
- reviewers
- reporter

### TASK_MENTIONED

Audience:

- only explicitly mentioned users

Actor exclusion:

- the user who performed the action does not receive the same notification

Preference handling:

- if a user disabled a notification type in settings, that user is skipped

---

## 13. Issue ID Generation

Current behavior:

- new issue IDs are generated like `issue-1`, `issue-2`, `issue-3`

How it works:

1. Backend uses `Counter` model
2. Counter key `issue-sequence` is incremented
3. New issue gets `issue-<number>`
4. Backend checks uniqueness before using it

Why this exists:

- IDs are short and readable
- better than timestamp IDs like `ISSUE-17123456789`

Existing older issue IDs are not automatically rewritten.

---

## 14. Data Population Strategy

Many backend queries populate references before returning data.

Example populated data:

- issue assignees
- reviewers
- reporter
- watchers
- comment authors
- reply authors
- attachment uploaders
- project workflow
- workflow states
- default state
- project visible users

This means frontend receives rich objects and does not need to make separate calls for every small thing.

---

## 15. Startup Migration

File:

- `backend/src/utils/migrateLegacyIssueAssignments.js`

Purpose:

- older issues may have used `assignee` and `reviewAssignee`
- current code uses arrays:
  - `assignees`
  - `reviewAssignees`

On startup:

- backend copies old single-value fields into the new arrays
- then removes the old fields

This keeps old data compatible with new UI and new controllers.

---

## 16. Environment Variables Used

## Backend env

Defined in:

- `backend/src/config/env.js`

Required values:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `BODY_LIMIT`
- `UPLOADS_DIR`
- `VAPID_SUBJECT`
- `MONGODB_ADMIN_URI`
- `LEGACY_DATABASE_NAME`
- `PRIMARY_DATABASE_NAME`

Optional values:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

## Frontend env

Defined in:

- `frontend/src/config/env.js`

Required values:

- `REACT_APP_API_URL`
- `REACT_APP_UPLOADS_BASE_URL`

---

## 17. Error Handling Pattern

## Frontend

- all API failures throw `Error`
- UI catches errors and shows:
  - inline message
  - `alert`
  - fallback empty states

## Backend

- controllers return:
  - `400` for bad input
  - `401` for invalid login/token
  - `403` for permission denied
  - `404` for missing data
  - `500` for server errors

Global backend error middleware:

- logs stack
- returns JSON:
  - `error`
  - `status`

---

## 18. Reusable UI Components Used

Main exports:

- `Button`
- `Card`
- `Badge`
- `Modal`
- `Table`
- `Sidebar`
- `Header`
- `Breadcrumb`
- `Alert`
- `InputField`
- `TextArea`
- `Select`

Practical use:

- `Button` for all actions
- `Modal` for create/edit forms
- `Badge` for roles and issue types
- `Sidebar` for navigation
- `Header` for notification and profile controls
- `Breadcrumb` for page hierarchy

---

## 19. Current Active Features Checklist

Authentication and session:

- landing page login
- JWT session
- local session restore
- logout

Role-based access:

- frontend protected routes
- admin-only routes
- backend admin-only actions

Users:

- bootstrap first admin
- create users
- list users
- get user by id
- update user
- update password by email
- delete non-admin user

Projects:

- create project
- list projects
- edit project
- delete project
- attach workflow
- choose visible users
- member-safe visibility

Workflows and states:

- create workflow
- edit workflow
- delete workflow
- add state
- remove state
- choose default state
- create global state
- edit global state
- delete global state
- propagate state rename/delete effects

Issues:

- create issue
- update issue
- delete issue
- sequential issue IDs
- workflow-aware statuses
- assignees
- reviewers
- reporter
- watchers
- advanced filters
- search

Issue collaboration:

- add comment
- edit comment
- delete comment
- add reply
- edit reply
- delete reply
- view edit history
- mentions
- mention suggestions

Attachments:

- upload attachment
- delete attachment
- store metadata
- store file on disk

Notifications:

- in-app notifications
- unread count
- mark one as read
- mark all as read
- preferences
- browser push notifications
- service worker update handling

Theme and UI:

- dark mode
- light mode
- responsive sidebar
- responsive notification panel

---

## 20. End-to-End Real Example Flows

## Example 1: Admin creates a member

1. Admin opens Members page
2. Clicks Add
3. Fills username, email, password, role
4. Frontend sends `POST /api/users`
5. Backend validates input and admin access
6. Password is hashed with bcrypt
7. User is saved
8. Members page refreshes list

## Example 2: Admin creates project with restricted access

1. Admin opens Projects page
2. Creates project with workflow
3. Selects some visible users
4. Backend saves `visibleToUsers`
5. Member project lists now only show allowed projects

## Example 3: Admin creates issue

1. Admin selects project
2. Workflow states for that project decide allowed statuses
3. Backend generates `issue-N`
4. Reporter becomes current user
5. Watchers are built
6. Notifications are sent

## Example 4: User comments and mentions someone

1. User types comment
2. `@username` suggestion appears
3. User posts comment
4. Comment is saved
5. Watchers are notified
6. Mentioned users get mention notification

## Example 5: Admin renames a state

1. Admin edits global state from Workflow Editor
2. State name is changed
3. Backend updates state document
4. Backend updates all issues that still use the old state name
5. Frontend now shows new name everywhere

---

## 21. Important Files to Read First If You Continue Development

If you want to understand the app quickly, read in this order:

1. `frontend/src/App.js`
2. `frontend/src/context/AuthContext.js`
3. `frontend/src/services/api.js`
4. `backend/src/index.js`
5. `backend/src/middleware/auth.js`
6. `backend/src/controllers/userController.js`
7. `backend/src/controllers/projectController.js`
8. `backend/src/controllers/issueController.js`
9. `backend/src/utils/notificationEngine.js`
10. `frontend/src/pages/admin/IssueDetail.js`

---

## 22. Final Short Summary

This app is a role-aware issue and project management system.

Frontend responsibilities:

- show pages
- protect routes
- manage session state
- call APIs
- render workflows, issues, comments, notifications, and member-safe views

Backend responsibilities:

- validate all important input
- enforce auth and admin rules
- enforce project visibility
- save and populate MongoDB data
- generate issue IDs
- keep workflow state changes consistent
- send in-app and push notifications

Most important concepts in this app:

- JWT authentication
- admin vs member authorization
- project visibility control
- workflow-controlled issue statuses
- issue collaboration with mentions and attachments
- notification engine with user preferences

---

If you want, the next step I can do is make a second file with:

- API endpoint table only
- database schema table only
- frontend page flow only
- developer onboarding steps only

That would give you smaller docs alongside this master file.
