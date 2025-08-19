const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Store connected clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'transcription_result':
          // Broadcast transcription results to all clients
          broadcastToClients({
            type: 'transcription_result',
            data: data.data,
            timestamp: Date.now()
          });
          break;
          
        case 'accuracy_metrics':
          // Broadcast accuracy metrics
          broadcastToClients({
            type: 'accuracy_metrics',
            data: data.data,
            timestamp: Date.now()
          });
          break;
          
        case 'latency_metrics':
          // Broadcast latency metrics
          broadcastToClients({
            type: 'latency_metrics',
            data: data.data,
            timestamp: Date.now()
          });
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast message to all connected clients
function broadcastToClients(message) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/connections', (req, res) => {
  res.json({ 
    activeConnections: clients.size,
    timestamp: Date.now()
  });
});

// Mock transcription data for testing
app.post('/api/simulate-transcription', (req, res) => {
  const { text, confidence, latency } = req.body;
  
  // Simulate processing delay
  setTimeout(() => {
    const result = {
      type: 'transcription_result',
      data: {
        text: text || 'Sample transcription text',
        confidence: confidence || Math.random() * 0.3 + 0.7, // 0.7-1.0
        latency: latency || Math.random() * 100 + 50, // 50-150ms
        timestamp: Date.now()
      }
    };
    
    broadcastToClients(result);
  }, 100);
  
  res.json({ status: 'simulation_started' });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  console.log(`HTTP server available at http://localhost:${PORT}`);
});
