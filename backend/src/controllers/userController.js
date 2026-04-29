import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import {
  isAdmin,
  serializeUser,
  signAuthToken,
} from '../middleware/auth.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const validateCreateUserPayload = ({ username, email, password }) => {
  if (!username || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }

  if (!emailPattern.test(normalizeEmail(email))) {
    return 'A valid email address is required';
  }

  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  return null;
};

const sanitizeRole = (role) => {
  const allowedRoles = ['Admin', 'Member', 'Lead', 'Developer', 'Designer', 'QA'];
  return allowedRoles.includes(role) ? role : 'Member';
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const validationError = validateCreateUserPayload({ username, email, password });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const userCount = await User.countDocuments();
    const isBootstrapUser = userCount === 0;

    if (!isBootstrapUser && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: username.trim() }],
    });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedRole = isBootstrapUser ? 'Admin' : sanitizeRole(role);

    const user = new User({
      username: username.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: resolvedRole,
    });

    await user.save();

    const responseUser = serializeUser(user);
    const payload = {
      message: 'User created successfully',
      user: responseUser,
    };

    if (isBootstrapUser) {
      payload.token = signAuthToken(user);
    }

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ active: true }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { username, email, role, active } = req.body;
    const updates = {};

    if (username !== undefined) {
      if (!username.trim() || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }
      updates.username = username.trim();
    }

    if (email !== undefined) {
      if (!emailPattern.test(normalizeEmail(email))) {
        return res.status(400).json({ error: 'A valid email address is required' });
      }
      updates.email = normalizeEmail(email);
    }

    if (role !== undefined) {
      updates.role = sanitizeRole(role);
    }

    if (active !== undefined) {
      updates.active = Boolean(active);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user: serializeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateUserPasswordByEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!emailPattern.test(normalizeEmail(email))) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const normalizedEmail = normalizeEmail(email);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          password: hashedPassword,
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found for the provided email address' });
    }

    res.json({
      message: 'User password updated successfully',
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'Admin') {
      return res.status(403).json({ error: 'Admin users cannot be deleted' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!emailPattern.test(normalizeEmail(email)) || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      token: signAuthToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({ user: serializeUser(req.user) });
};
