import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import connectDB from './config/database.js';
import { env } from './config/env.js';
import userRoutes from './routes/userRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import globalStateRoutes from './routes/globalStateRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { migrateLegacyIssueAssignments } from './utils/migrateLegacyIssueAssignments.js';

const app = express();

connectDB()
  .then(() => migrateLegacyIssueAssignments())
  .catch((error) => {
    console.error('Startup failed:', error.message);
    process.exit(1);
  });

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(env.uploadsDir)));

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() });
});

app.use('/api/users', userRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/states', globalStateRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});

export default app;
