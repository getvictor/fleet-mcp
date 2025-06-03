#!/usr/bin/env node
import { config } from 'dotenv';
import axios from 'axios';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';

// Load environment variables
config();

// Fleet API configuration
const FLEET_SERVER_URL = process.env.FLEET_SERVER_URL || 'https://fleet.example.com/api';
const FLEET_API_KEY = process.env.FLEET_API_KEY;

// MCP Server authorization
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || 'default-mcp-auth-token';

// Server configuration
const PORT = parseInt(process.env.PORT || '3000', 10);

if (!FLEET_API_KEY) {
  console.error('FLEET_API_KEY environment variable is required');
  process.exit(1);
}

// MCP Server implementation
class FleetMcpServer {
  private app: express.Application;
  private httpServer;
  private mcpServer: McpServer;
  private axiosInstance;
  private transports: Record<string, SSEServerTransport> = {};
  
  constructor() {
    // Initialize Express app
    this.app = express();
    
    // Initialize axios instance with Fleet API configuration
    this.axiosInstance = axios.create({
      baseURL: FLEET_SERVER_URL,
      headers: {
        'Authorization': `Bearer ${FLEET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Configure Express
    this.app.use(cors());
    this.app.use(express.json());
    
    // Create HTTP server
    this.httpServer = createServer(this.app);
    
    // Create MCP server
    this.mcpServer = new McpServer({
      name: 'fleet-api-server',
      version: '0.1.0',
    });
    
    // Set up MCP handlers
    this.setupMcpHandlers();
    
    // Set up routes
    this.setupRoutes();
    
    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('Shutting down MCP server...');
      
      // Close all active transports
      for (const sessionId in this.transports) {
        try {
          console.log(`Closing transport for session ${sessionId}`);
          await this.transports[sessionId].close();
          delete this.transports[sessionId];
        } catch (error) {
          console.error(`Error closing transport for session ${sessionId}:`, error);
        }
      }
      
      this.httpServer.close();
      process.exit(0);
    });
  }
  
  /**
   * Authorization middleware for MCP endpoints
   */
  private authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.error('No authorization header provided');
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      console.error('Invalid authorization header format');
      res.status(401).json({ error: 'Invalid authorization header format. Use: Bearer <token>' });
      return;
    }
    
    if (token !== MCP_AUTH_TOKEN) {
      console.error('Invalid authorization token');
      res.status(401).json({ error: 'Invalid authorization token' });
      return;
    }
    
    next();
  };
  
  /**
   * Set up Express routes
   */
  private setupRoutes(): void {
    // SSE endpoint for establishing the stream
    this.app.get('/mcp', this.authMiddleware, async (req, res) => {
      console.log('Received GET request to /mcp (establishing SSE stream)');
      try {
        // Create a new SSE transport for the client
        const transport = new SSEServerTransport('/mcp/messages', res);
        
        // Store the transport by session ID
        const sessionId = transport.sessionId;
        this.transports[sessionId] = transport;
        
        // Set up onclose handler to clean up transport when closed
        transport.onclose = () => {
          console.log(`SSE transport closed for session ${sessionId}`);
          delete this.transports[sessionId];
        };
        
        // Connect the transport to the MCP server
        await this.mcpServer.connect(transport);
        console.log(`Established SSE stream with session ID: ${sessionId}`);
      } catch (error) {
        console.error('Error establishing SSE stream:', error);
        if (!res.headersSent) {
          res.status(500).send('Error establishing SSE stream');
        }
      }
    });
    
    // Messages endpoint for receiving client JSON-RPC requests
    this.app.post('/mcp/messages', this.authMiddleware, async (req, res) => {
      console.log('Received POST request to /mcp/messages');
      
      // Extract session ID from URL query parameter
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        console.error('No session ID provided in request URL');
        res.status(400).send('Missing sessionId parameter');
        return;
      }
      
      const transport = this.transports[sessionId];
      if (!transport) {
        console.error(`No active transport found for session ID: ${sessionId}`);
        res.status(404).send('Session not found');
        return;
      }
      
      try {
        // Handle the POST message with the transport
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
          res.status(500).send('Error handling request');
        }
      }
    });
  }
  
  /**
   * Set up MCP handlers
   */
  private setupMcpHandlers(): void {
    // Register the install_software tool
    this.mcpServer.tool(
      'install_software',
      'Install software on a host managed by Fleet',
      {
        host_id: z.string().describe('Required. The host ID'),
        software_id: z.string().describe('Required. The software title ID')
      },
      async (params: { host_id: string; software_id: string }) => {
        try {
          console.log(`Installing software ID ${params.software_id} on host ID ${params.host_id}`);
          
          const url = `/api/v1/fleet/hosts/${params.host_id}/software/${params.software_id}/install`;
          const response = await this.axiosInstance.post(url);
          console.log('Fleet API install request successful');
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          console.error('Fleet API error:', error);
          throw {
            code: 'internal_error',
            message: `Fleet API error: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    );
    
    // Register the list_host_software tool
    this.mcpServer.tool(
      'list_host_software',
      'List software installed on a specific host managed by Fleet',
      {
        id: z.string().describe('Required. The host ID'),
        available_for_install: z.boolean().optional().describe('If true, only list software that is available for install (added by the user) and automatically sets installed_only to false. Default is false.'),
        installed_only: z.boolean().optional().describe('If true, only list software that is actually installed (has installed_versions or status="installed"). Default is true. Ignored if available_for_install is true.'),
        software_name: z.string().optional().describe('If provided, only list software that matches this name (case-insensitive partial match)')
      },
      async (params: { id: string; available_for_install?: boolean; installed_only?: boolean; software_name?: string }) => {
        try {
          console.log(`Making Fleet API call to get software for host ID: ${params.id}`);
          
          // Build the URL with query parameters if needed
          let url = `/api/v1/fleet/hosts/${params.id}/software?per_page=200`;
          if (params.available_for_install) {
            url += `&available_for_install=${params.available_for_install ? '1' : '0'}`;
          }
          
          const response = await this.axiosInstance.get(url);
          console.log('Fleet API call successful');
          
          let software = response.data.software || [];
          
          // If available_for_install is true, automatically set installed_only to false
          let effectiveInstalledOnly = params.installed_only !== false;
          if (params.available_for_install === true) {
            console.log('available_for_install is true, automatically setting installed_only to false');
            effectiveInstalledOnly = false;
          }
          
          // Filter software based on installed_only parameter (default to true if not provided)
          if (effectiveInstalledOnly) {
            console.log('Filtering for installed software only');
            const installedSoftware = software.filter((sw: any) =>
              sw.installed_versions !== null || sw.status === "installed"
            );
            console.log(`Found ${installedSoftware.length} installed software out of ${software.length} total`);
            software = installedSoftware;
          }
          
          // Filter software by name if provided
          if (params.software_name) {
            console.log(`Filtering for software matching name: ${params.software_name}`);
            const nameLower = params.software_name.toLowerCase();
            const matchingSoftware = software.filter((sw: any) =>
              sw.name.toLowerCase().includes(nameLower)
            );
            console.log(`Found ${matchingSoftware.length} software matching name "${params.software_name}"`);
            software = matchingSoftware;
          }
          
          // Update the response data with filtered software
          response.data.software = software;
          response.data.count = software.length;
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        } catch (error) {
          console.error('Fleet API error:', error);
          throw {
            code: 'internal_error',
            message: `Fleet API error: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    );
    
    // Register the list_hosts tool
    this.mcpServer.tool(
      'list_hosts',
      'List all hosts (devices) managed by Fleet',
      {
        platform: z.string().optional().describe('Filter by platform (e.g., darwin, windows, ubuntu, ios, android)'),
        status: z.string().optional().describe('Filter by status (online, offline)'),
        team_id: z.string().optional().describe('Filter by team ID'),
        email: z.string().optional().describe('Filter by user email'),
        limit: z.string().optional().describe('Maximum number of results to return')
      },
      async (params: {
        platform?: string;
        status?: string;
        team_id?: string;
        email?: string;
        limit?: string;
      }) => {
        console.log('Tool handler called with params:', params);
        console.log('Platform parameter:', params.platform);
        
        try {
          console.log('Making Fleet API call to get hosts...');
          const response = await this.axiosInstance.get('/api/v1/fleet/hosts?device_mapping=true');
          console.log('Fleet API call successful');
          
          // Get the hosts from the response
          let hosts = response.data.hosts || [];
          
          // Apply platform filter if provided
          if (params.platform) {
            console.log(`Filtering by platform: ${params.platform}`);
            hosts = hosts.filter((host: any) => host.platform === params.platform);
            console.log(`Found ${hosts.length} hosts with platform ${params.platform}`);
          }
          
          // Apply status filter if provided
          if (params.status) {
            console.log(`Filtering by status: ${params.status}`);
            hosts = hosts.filter((host: any) => host.status === params.status);
            console.log(`Found ${hosts.length} hosts with status ${params.status}`);
          }
          
          // Apply team_id filter if provided
          if (params.team_id) {
            console.log(`Filtering by team_id: ${params.team_id}`);
            hosts = hosts.filter((host: any) => host.team_id === parseInt(params.team_id!, 10));
            console.log(`Found ${hosts.length} hosts with team_id ${params.team_id}`);
          }
          
          // Apply email filter if provided
          if (params.email) {
            console.log(`Filtering by email: ${params.email}`);
            hosts = hosts.filter((host: any) => {
              // Check if the host has device_mapping with an email that matches
              if (host.device_mapping && Array.isArray(host.device_mapping)) {
                return host.device_mapping.some((mapping: any) =>
                  mapping.email && mapping.email.toLowerCase() === params.email!.toLowerCase()
                );
              }
              return false;
            });
            console.log(`Found ${hosts.length} hosts with email ${params.email}`);
          }
          
          // Apply limit if provided
          if (params.limit) {
            const limit = parseInt(params.limit, 10);
            if (!isNaN(limit) && limit > 0 && limit < hosts.length) {
              console.log(`Limiting results to ${limit} hosts`);
              hosts = hosts.slice(0, limit);
            }
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(hosts, null, 2),
              },
            ],
          };
        } catch (error) {
          console.error('Fleet API error:', error);
          throw {
            code: 'internal_error',
            message: `Fleet API error: ${error instanceof Error ? error.message : String(error)}`,
          };
        }
      }
    );
  }
  
  /**
   * Start the MCP server
   */
  async start(port: number = 3000): Promise<void> {
    return new Promise<void>((resolve) => {
      this.httpServer.listen(port, () => {
        console.log(`Fleet MCP server running on http://localhost:${port}/mcp`);
        console.log(`Authorization required: Bearer token`);
        resolve();
      });
    });
  }
}

// Create and start the server
const server = new FleetMcpServer();
server.start(PORT).catch(console.error);