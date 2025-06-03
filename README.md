# Fleet MCP Server

An MCP (Model Context Protocol) server for interacting with Fleet API. This server provides tools and resources for managing devices, policies, and queries through Fleet's API.

## Overview

This MCP server implements the Model Context Protocol to provide AI assistants with the ability to interact with Fleet's device management platform. It exposes a set of tools and resources that can be used to:

- Query and manage devices
- View device software inventory
- Install software on managed devices
- Filter devices by platform, status, team, and user email
- View and update policies
- Run Fleet queries
- Access device and policy information

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Access to a Fleet instance with API credentials

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/fleet-mcp.git
   cd fleet-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Fleet API credentials using the interactive script:
   ```bash
   npm run update-credentials
   ```
   
   Alternatively, you can manually create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```
   And edit it to add your Fleet API credentials and MCP authentication token:
   ```
   FLEET_SERVER_URL=https://your-fleet-instance.com/api
   FLEET_API_KEY=your_api_key_here
   MCP_AUTH_TOKEN=your_mcp_auth_token_here
   ```

4. Configure MCP Authentication:
   The MCP server requires Bearer token authentication for security. Set the `MCP_AUTH_TOKEN` environment variable in your `.env` file to a secure token of your choice. This token will be required by clients connecting to the MCP server.

   **Generating a secure token:**
   ```bash
   # Generate a secure random token (macOS/Linux)
   openssl rand -hex 32
   
   # Or using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   **Security recommendations:**
   - Use a strong, randomly generated token (at least 32 characters)
   - Rotate the token periodically
   - Never commit the token to version control
   - Keep the `.env` file secure and restrict access

5. Test your Fleet API connection:
   ```bash
   npm run test-fleet-api
   ```

6. Build the TypeScript code:
   ```bash
   npm run build
   ```

7. Install the MCP server to your Cline configuration:
   ```bash
   npm run install-mcp
   ```
   This script will automatically add the Fleet MCP server to your Cline and/or Claude Desktop configuration.

## Usage

### Starting the Server

Start the MCP server using one of these methods:

```bash
# Using npm
npm start

# Using the shell script
./start-server.sh
```

The server will run on http://localhost:3000/mcp by default. You can change the port by setting the `PORT` environment variable in your `.env` file:

```
PORT=8080
```

### Configuring with Cline

You can automatically configure Cline to use this MCP server by running:

```bash
npm run install-mcp
```

This script will add the Fleet MCP server configuration to your Cline and/or Claude Desktop settings.

Alternatively, you can manually add the following configuration to your MCP settings file:

```json
{
  "mcpServers": {
    "fleet": {
      "url": "http://localhost:3000/mcp",
      "disabled": false,
      "alwaysAllow": [],
      "headers": {
        "Authorization": "Bearer your_mcp_auth_token_here"
      }
    }
  }
}
```

**Important:** Replace `your_mcp_auth_token_here` with the actual token you set in your `.env` file as `MCP_AUTH_TOKEN`.

The settings files are located at:
- VS Code: `/Users/username/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/mcp_settings.json`
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Testing with Cline

After setting up the server and installing it to your Cline configuration, you can test if everything is working correctly:

```bash
npm run test-with-cline
```

This script will:
1. Check if the Fleet MCP server is running
2. Verify that it's properly configured in Cline
3. Provide instructions for testing with Cline

### Available Tools

The server provides the following tools:

1. `list_hosts` - List all hosts (devices) managed by Fleet
   - Parameters:
     - `platform` (optional): Filter by platform (e.g., darwin, windows, ubuntu, ios, android)
     - `status` (optional): Filter by status (online, offline)
     - `team_id` (optional): Filter by team ID
     - `email` (optional): Filter by user email
     - `limit` (optional): Maximum number of results to return

2. `list_host_software` - List software installed on a specific host managed by Fleet
   - Parameters:
     - `id` (required): The host ID
     - `available_for_install` (optional): If true, only list software that is available for install and automatically sets installed_only to false. Default is false.
     - `installed_only` (optional): If true, only list software that is actually installed (has installed_versions or status="installed"). Default is true. Ignored if available_for_install is true.
     - `software_name` (optional): If provided, only list software that matches this name (case-insensitive partial match)

3. `install_software` - Install software on a host managed by Fleet
   - Parameters:
     - `host_id` (required): The host ID
     - `software_id` (required): The software title ID

### Available Resources

The current implementation focuses on tools rather than resources. The MCP server provides tools for querying hosts, managing software, and performing actions on Fleet-managed devices.

### Example Prompts

Here are some example prompts you can use with Cline to test the Fleet MCP server:

- "List all hosts managed by Fleet"
- "List Windows hosts that belong to roadrunner@acme.com"
- "Show me all software installed on host with ID 755"
- "Check if TeamViewer is installed on host with ID 755"
- "Show me software available for installation on host with ID 755"
- "Install TeamViewer on host with ID 755"

## Recent Improvements

The Fleet MCP server has been enhanced with the following improvements:

### Software Management

- **Improved Software Detection**: The server now correctly identifies installed software by checking both `installed_versions` and `status="installed"` fields.
- **Pagination Support**: Added `per_page=200` parameter to ensure comprehensive software listings.
- **Intuitive Parameter Handling**: When `available_for_install` is set to true, the server automatically sets `installed_only` to false for consistent behavior.
- **Software Name Filtering**: Added ability to filter software by name for easier identification of specific applications.

### Host Management

- **Email Filtering**: Added support for filtering hosts by user email using the device_mapping field.
- **Team Filtering**: Added support for filtering hosts by team ID.

### Software Installation

- Added support for installing software on managed devices through the Fleet API.

## Updating

To check for updates to the Fleet MCP server:

```bash
npm run check-updates
```

If updates are available, you can update the server by:

1. If you installed via git:
   ```bash
   git pull
   npm install
   npm run build
   ```

2. If you downloaded a zip file:
   - Download the latest version
   - Replace your files
   - Run `npm install && npm run build`

## Uninstalling

To uninstall the Fleet MCP server from Cline:

```bash
npm run uninstall-mcp
```

This script will:
1. Remove the Fleet MCP server configuration from Cline and/or Claude Desktop
2. Ask if you want to keep the server files
3. Provide instructions for completely removing the server files if desired

## Troubleshooting

If you encounter issues with the Fleet MCP server, you can run the troubleshooting script:

```bash
npm run troubleshoot
```

This script will check for common issues:
1. Environment variables configuration
2. Build directory and server executable
3. Server running status
4. Cline configuration

The script will provide recommendations for fixing any issues it finds.

## With Claude Code

mcp-servers.json:

```json
{
  "mcpServers": {
    "fleet": {
      "type": "sse",
      "url": "http://localhost:3000/mcp",
      "disabled": false,
      "alwaysAllow": [
        "list_hosts",
        "list_host_software"
      ],
      "timeout": 15
    }
  }
}
```

Sample prompt:

```
claude -p "Does Victor's hosts have Microsoft Edge installed?" --mcp-config mcp-servers.json --allowedTools 'mcp__fleet__list_hosts,mcp__fleet__list_host_software' --output-format stream-json --system-prompt "You are an IT admin." --verbose
```

## Development

### Project Structure

```
fleet-mcp/
├── src/                    # TypeScript source code
│   ├── index.ts            # Main server implementation
│   ├── test-client.ts      # Test client for the MCP server
│   ├── test-fleet-api.ts   # Test script for Fleet API connection
│   ├── install-mcp.ts      # Script to install MCP to Cline
│   ├── uninstall-mcp.ts    # Script to uninstall MCP from Cline
│   ├── update-credentials.ts # Script to update Fleet API credentials
│   ├── test-with-cline.ts  # Script to test with Cline
│   ├── troubleshoot.ts     # Script to troubleshoot common issues
│   └── check-updates.ts    # Script to check for updates
├── build/                  # Compiled JavaScript (generated)
├── .env.example            # Example environment variables
├── .env                    # Environment variables (create this)
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

### Scripts

- `npm run build` - Build the TypeScript code
- `npm start` - Start the server
- `npm run dev` - Run TypeScript in watch mode
- `npm run lint` - Run ESLint
- `npm run test-server` - Test the MCP server locally
- `npm run test-fleet-api` - Test the Fleet API connection
- `npm run test-with-cline` - Test the MCP server with Cline
- `npm run install-mcp` - Install the MCP server to Cline
- `npm run uninstall-mcp` - Uninstall the MCP server from Cline
- `npm run update-credentials` - Update Fleet API credentials
- `npm run check-updates` - Check for updates to the MCP server
- `npm run troubleshoot` - Troubleshoot common issues

## Extending

To add more Fleet API functionality:

1. Add new tool definitions in the `setupRoutes` method
2. Implement the tool logic in the route handler
3. Add new resource definitions as needed

## License

MIT
