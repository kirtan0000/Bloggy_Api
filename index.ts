import express from 'express'
import path from 'path'
import cors from 'cors'
import { create } from './util/connection'

create() // Establish a connection with the SQL database
const bodyParser = require('body-parser')
const rateLimit = require('express-rate-limit')
const http = require('http')
const app = express()
const server = http.createServer(app) // Create the http server
const port = 7090 // The server port that localhost will run on; e.g. port 4000 means http://localhost:4000

// Cors
const corsOptions = {
  origin: '*', // All requests
  optionsSuccessStatus: 200
}

// Auth Routers
import AuthRouter from './routes/Auth'
import DeleteUserAccountRouter from './routes/DeleteUserAccount'
import UpdatePasswordRouter from './routes/ChangeUserPassword'
import UpdateUserNameRouter from './routes/ChangeUserName'

// Routers
import GetRouter from './routes/Get'
import UploadPfpRouter from './routes/UploadPfp'

// The rate limit message displayed on the screen when too many requests are sent to the server
const limiterMessage = {
  success: false,
  message:
    'You have been temporarily rate limited. Please come back in 30 minutes.',
  status_code: 429
}

// Limit the authentication routes
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 15,
  message: limiterMessage // Send the limiter message with a 429 code
})

// Limit the authentication routes
const normalLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 200,
  message: limiterMessage // Send the limiter message with a 429 code
})

// Middlewares
app.use(express.static('public'))
app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.text())

// Route middlewares
app.use('/', AuthRouter)
app.use('/', DeleteUserAccountRouter)
app.use('/', UpdatePasswordRouter)
app.use('/', UpdateUserNameRouter)
app.use('/', UploadPfpRouter)
app.use('/', GetRouter)

// Limit the routes
app.use('/', normalLimiter)

app.use('/login', authLimiter)
app.use('/create-user', authLimiter)
app.use('/change-user-password', authLimiter)
app.use('/delete-user-account', authLimiter)



// Trust reverse proxies such as NGINX and Apache HTTP Server
app.enable('trust proxy')
app.set('trust proxy', 1)

// Start the http server
server.listen(port, () =>
  console.log(`Server started at http://localhost:${port}`)
)
