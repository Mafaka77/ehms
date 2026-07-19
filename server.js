require('dotenv').config()
const path=require('path');
const fastify = require('fastify')({
  logger: true,
  http: {
    maxHeaderSize: 32768  // 32 KB — prevents 431 from large JWTs
  }
})

const connectDB = require('./config/db')

// Connect to MongoDB
connectDB()

// Register Core Plugins
fastify.register(require('@fastify/helmet'), {
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "frame-src": ["'self'", "blob:"],
      "img-src": ["'self'", "data:", "blob:"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"] // Usually needed by Vue
    }
  }
})
fastify.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS']
})
fastify.register(require('@fastify/cookie'))
fastify.register(require('@fastify/multipart'))

// Register JWT for Authentication
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'supersecretkey'
})

fastify.register(require('./routes/index.js'))

fastify.get('/api', async () => {
  return {
    message: 'HMS API Running (MongoDB)'
  }
})

const frontendPath = path.join(__dirname, 'dist');
fastify.register(require('@fastify/static'), {
  root: frontendPath,
  wildcard: false
})

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'uploads'),
  prefix: '/uploads/',
  decorateReply: false
})

// Serve index.html for all other unmatched non-API routes (SPA fallback)
fastify.get('/*', async (req, reply) => {
  if (req.url.startsWith('/api')) {
    reply.code(404).send({ error: 'Not Found' });
    return;
  }
  return reply.sendFile('index.html');
})


const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000 })
    fastify.log.info(`Server is running on port ${process.env.PORT || 3000}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
