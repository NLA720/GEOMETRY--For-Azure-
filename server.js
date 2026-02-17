// const express = require('express');
// const session = require('cookie-session');
// const { PORT, SERVER_SESSION_SECRET } = require('./config.js');
// const path = require('path');




// let app = express();

// // Setting cookies in your Express app
// app.use(session({
//     secret: SERVER_SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//         maxAge: 24 * 60 * 60 * 1000,  // 1 day
//         secure: true,                 // Cookie will only be sent over HTTPS
//         sameSite: 'None',             // Allow cookies in cross-origin iframes
//     }
// }));


// // Serve static files from 'wwwroot' directory
// app.use(express.static(path.join(__dirname, 'public')));


// // Use session middleware
// app.use(session({
//     keys: [SERVER_SESSION_SECRET],
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
// }));

// // Serve index.html for the root path
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });



// // Import custom routes
// app.use(require('./routes/auth.js'));
// app.use(require('./routes/hubs.js'));

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack); // Log the error
//     res.status(500).send('Something went wrong!'); // Send a generic error message
// });

// // Start the server
// app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));


const express = require('express');



const session = require('cookie-session');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { PORT, SERVER_SESSION_SECRET } = require('./config.js');

const app = express();

app.use(express.json());


const server = http.createServer(app);

// 📒 Store all WebSocket clients by user ID
const clients = new Map();

// Express session setup
app.use(session({
  secret: SERVER_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: 'None',
  }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use(require('./routes/auth.js'));
app.use(require('./routes/hubs.js'));

// Inject WebSocket clients into your custom route (for Power Automate)
const createWebSocketRoutes = require('./routes/websocket.js');
app.use(createWebSocketRoutes(clients)); // ✅ Pass the notebook

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// 🔌 Setup WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request, userGuid) => {
  console.log(`🟢 WebSocket connected for user: ${userGuid}`);
  clients.set(userGuid, ws); // 📝 Store in notebook

  // 🫀 Optional: heartbeat
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat', message: 'keep-alive' }));
    }
  }, 30000);

  ws.on('message', (message) => {
    console.log(`📩 [${userGuid}] Received:`, message.toString());
    ws.send(`Echo from server to ${userGuid}: ` + message);
  });

  ws.on('close', () => {
    console.log(`🔴 WebSocket closed for user: ${userGuid}`);
    clearInterval(heartbeat);
    clients.delete(userGuid); // ❌ remove from notebook
  });
});

// 🔁 Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname.startsWith('/ws/')) {
    const userGuid = pathname.split('/').pop();
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, userGuid);
    });
  } else {
    socket.destroy(); // Not a WebSocket path
  }
});

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 HTTP + WebSocket server running on port ${PORT}...`);
});


// app.use(express.json());

// app.listen(8080, () => {
//   console.log("Server running on http://localhost:8080");
// });


// app.post('/export-pdf', async (req, res) => {
//    console.log("🔥 /export-pdf route hit");
// });


// app.post('/export-pdf', (req, res) => {
//   console.log("Route works!");
//   res.send("Export route reached");
// });
// app.post('/export-pdf', async (req, res) => {
//   const { urn, viewableID } = req.body; // <- this must exist
//   if (!urn || !viewableID) return res.status(400).send("Missing urn or viewableID");
// });


