import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { minerSettingsSchema, minerStateSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";

// Maintain active WebSocket connections
const clients = new Set<WebSocket>();

// Broadcast mining data to all connected clients
function broadcastMiningData(data: any) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create the HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server on a different path than Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('New client connected');
    clients.add(ws);

    // Send initial data
    storage.getMinerState().then(state => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'minerState', 
          data: state 
        }));
      }
    });

    storage.getGlobalMiningStats().then(stats => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'globalStats', 
          data: stats 
        }));
      }
    });

    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'startMining') {
          // Additional logic could be added here
          console.log('Client requested to start mining');
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected');
      clients.delete(ws);
    });
  });

  // API routes for the miner
  app.get('/api/miner/status', async (req, res) => {
    try {
      const minerState = await storage.getMinerState();
      return res.json(minerState);
    } catch (error) {
      return res.status(500).json({ 
        message: `Failed to get miner status: ${(error as Error).message}` 
      });
    }
  });

  app.post('/api/miner/status', async (req, res) => {
    try {
      // Validate request body
      const validatedData = minerStateSchema.parse(req.body);
      
      // Store the miner state
      await storage.updateMinerState(validatedData);
      
      // Broadcast updated mining data to all clients
      const globalStats = await storage.getGlobalMiningStats();
      broadcastMiningData({ 
        type: 'minerUpdate', 
        minerState: validatedData,
        globalStats: globalStats
      });
      
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data format", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: `Failed to update miner status: ${(error as Error).message}` 
      });
    }
  });

  app.get('/api/miner/settings', async (req, res) => {
    try {
      const settings = await storage.getMinerSettings();
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ 
        message: `Failed to get miner settings: ${(error as Error).message}` 
      });
    }
  });

  app.post('/api/miner/settings', async (req, res) => {
    try {
      // Validate request body
      const validatedData = minerSettingsSchema.parse(req.body);
      
      // Store the miner settings
      await storage.updateMinerSettings(validatedData);
      
      // Broadcast updated settings to all clients
      broadcastMiningData({ 
        type: 'settingsUpdate', 
        settings: validatedData 
      });
      
      return res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data format", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: `Failed to update miner settings: ${(error as Error).message}` 
      });
    }
  });

  // Endpoint to get global mining stats
  app.get('/api/miner/global-stats', async (req, res) => {
    try {
      const globalStats = await storage.getGlobalMiningStats();
      return res.json(globalStats);
    } catch (error) {
      return res.status(500).json({ 
        message: `Failed to get global mining stats: ${(error as Error).message}` 
      });
    }
  });

  // Set up a timer to broadcast global stats periodically
  setInterval(async () => {
    try {
      if (clients.size > 0) {
        const globalStats = await storage.getGlobalMiningStats();
        broadcastMiningData({ 
          type: 'globalStats', 
          data: globalStats 
        });
      }
    } catch (error) {
      console.error('Error broadcasting global stats:', error);
    }
  }, 10000); // Every 10 seconds

  return httpServer;
}
