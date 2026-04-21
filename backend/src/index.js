import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import connectDB from './config/database.js'
import userRoutes from './routes/userRoutes.js'
import workflowRoutes from './routes/workflowRoutes.js'
import issueRoutes from './routes/issueRoutes.js'
import globalStateRoutes from './routes/globalStateRoutes.js'
import projectRoutes from './routes/projectRoutes.js'

dotenv.config()

const app = express()

// Connect to MongoDB
connectDB()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() })
})

// API Routes
app.use('/api/users', userRoutes)
app.use('/api/workflows', workflowRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/states', globalStateRoutes)
app.use('/api/projects', projectRoutes)

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  })
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app