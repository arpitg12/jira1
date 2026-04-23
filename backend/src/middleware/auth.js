import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ADMIN_ROLE = 'Admin';

const getJwtSecret = () => process.env.JWT_SECRET || 'jira-app-dev-secret';

export const isAdmin = (user) => user?.role === ADMIN_ROLE;

export const signAuthToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );

export const serializeUser = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  active: user.active,
});

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7).trim();
};

export const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication token is required' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.sub).select('+password');

    if (!user || !user.active) {
      return res.status(401).json({ error: 'User session is no longer valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.sub).select('+password');

    if (user && user.active) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireAdmin = (req, res, next) => {
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: 'Admin access is required for this action' });
  }

  next();
};

export const buildProjectAccessFilter = (user) => {
  if (isAdmin(user)) {
    return {};
  }

  return {
    $or: [{ visibleToUsers: { $size: 0 } }, { visibleToUsers: user._id }],
  };
};

export const hasProjectAccess = (user, project) => {
  if (!project) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  const visibleUsers = Array.isArray(project.visibleToUsers) ? project.visibleToUsers : [];

  if (visibleUsers.length === 0) {
    return true;
  }

  return visibleUsers.some((entry) => String(entry?._id || entry) === String(user._id));
};

export const isIssueVisibleToUser = (user, issue) => {
  if (isAdmin(user)) {
    return true;
  }

  if (!hasProjectAccess(user, issue?.project)) {
    return false;
  }

  return [issue?.assignee, issue?.reviewAssignee, issue?.reporter].some(
    (entry) => String(entry?._id || entry) === String(user._id)
  );
};
