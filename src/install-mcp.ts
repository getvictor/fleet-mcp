import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to install the Fleet MCP server to Cline configuration
 */
async function installMcpServer(): Promise<void> {
  try {
    // Determine the user's home directory
    const homeDir = os.homedir();
    
    // Paths to Cline, Roo Code, and Claude Desktop config files
    const clineConfigPath = path.join(
      homeDir,
      'Library',
      'Application Support',
      'Code',
      'User',
      'globalStorage',
      'rooveterinaryinc.roo-cline',
      'settings',
      'mcp_settings.json'
    );
    
    const rooCodeConfigPath = path.join(
      homeDir,
      'Library',
      'Application Support',
      'Roo Code',
      'globalStorage',
      'rooveterinaryinc.roo-cline',
      'settings',
      'mcp_settings.json'
    );
    
    const claudeConfigPath = path.join(
      homeDir,
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    );
    
    // Get MCP auth token from environment
    const mcpAuthToken = process.env.MCP_AUTH_TOKEN;
    if (!mcpAuthToken) {
      console.error('Error: MCP_AUTH_TOKEN not found in environment variables.');
      console.error('Please run "npm run update-credentials" first to set up your credentials.');
      process.exit(1);
    }
    
    // Get port from environment
    const port = process.env.PORT || '3000';
    
    // Fleet MCP server configuration
    const fleetMcpConfig = {
      fleet: {
        url: `http://localhost:${port}/mcp`,
        disabled: false,
        alwaysAllow: [],
        headers: {
          Authorization: `Bearer ${mcpAuthToken}`
        }
      }
    };
    
    // Function to update a config file
    const updateConfigFile = (configPath: string) => {
      if (fs.existsSync(configPath)) {
        // Read existing config
        const configContent = fs.readFileSync(configPath, 'utf-8');
        let config;
        
        try {
          config = JSON.parse(configContent);
        } catch (error) {
          console.error(`Error parsing ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
          console.error('Creating new config file...');
          config = {};
        }
        
        // Add or update mcpServers section
        config.mcpServers = {
          ...(config.mcpServers || {}),
          ...fleetMcpConfig
        };
        
        // Write updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`Updated ${configPath}`);
      } else {
        console.log(`Config file not found: ${configPath}`);
      }
    };
    
    // Try to update Cline config
    console.log('Attempting to install Fleet MCP server to Cline...');
    if (fs.existsSync(path.dirname(clineConfigPath))) {
      // Ensure the settings directory exists
      const settingsDir = path.dirname(clineConfigPath);
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }
      
      // Create config file if it doesn't exist
      if (!fs.existsSync(clineConfigPath)) {
        fs.writeFileSync(clineConfigPath, JSON.stringify({ mcpServers: fleetMcpConfig }, null, 2), 'utf-8');
        console.log(`Created new config file: ${clineConfigPath}`);
      } else {
        updateConfigFile(clineConfigPath);
      }
    } else {
      console.log('Cline configuration directory not found. Is Cline installed?');
    }
    
    // Try to update Roo Code config
    console.log('\nAttempting to install Fleet MCP server to Roo Code...');
    
    // Create all directories in the path if they don't exist
    const rooCodeDir = path.dirname(rooCodeConfigPath);
    try {
      fs.mkdirSync(rooCodeDir, { recursive: true });
      console.log(`Created directory structure: ${rooCodeDir}`);
      
      // Create config file if it doesn't exist
      if (!fs.existsSync(rooCodeConfigPath)) {
        fs.writeFileSync(rooCodeConfigPath, JSON.stringify({ mcpServers: fleetMcpConfig }, null, 2), 'utf-8');
        console.log(`Created new config file: ${rooCodeConfigPath}`);
      } else {
        updateConfigFile(rooCodeConfigPath);
      }
    } catch (error) {
      console.error(`Error creating Roo Code configuration: ${error instanceof Error ? error.message : String(error)}`);
      console.log('You may need to manually create the configuration file at:');
      console.log(rooCodeConfigPath);
    }
    
    // Try to update Claude Desktop config
    console.log('\nAttempting to install Fleet MCP server to Claude Desktop...');
    if (fs.existsSync(path.dirname(claudeConfigPath))) {
      updateConfigFile(claudeConfigPath);
    } else {
      console.log('Claude Desktop configuration directory not found. Is Claude Desktop installed?');
    }
    
    console.log('\nInstallation complete!');
    console.log('To use the Fleet MCP server:');
    console.log('1. Start the server with: npm start');
    console.log('2. Open Cline or Claude Desktop');
    console.log('3. The Fleet MCP tools and resources should now be available');
  } catch (error) {
    console.error('Error installing MCP server:', error);
  }
}

// Run the installation
installMcpServer();