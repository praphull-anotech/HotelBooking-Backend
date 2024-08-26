const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const db = require('./db');
const routes = require('./routes');
const cors = require('cors');
require('dotenv').config();
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  const app = express();

  // Database connection
  db.connectDB();

  // CORS configuration
  const corsOptions = {
    origin: 'http://localhost:3000', // Replace with your client URL
    credentials: true, // Allow credentials (cookies) to be sent
  };
  app.use(cors(corsOptions));

  // Middleware
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Routes
  app.use(routes);

  // Example route: Home route
  app.get('/', (req, res) => {
    res.send('Welcome to the Home Page');
  });

  // Example route: About route
  app.get('/about', (req, res) => {
    res.send('Welcome to the About Page');
  });

  // Example route: API route
  app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to the API' });
  });

  // Handle POST requests to /data
  app.post('/data', (req, res) => {
    const receivedData = req.body;
    console.log(receivedData);
    res.json({ message: 'Data received', data: receivedData });
  });

  // Start the server and listen on the specified port
  const port = process.env.PORT || 5000;
  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Worker ${process.pid} started and is running on port ${port}`);
  });
}
