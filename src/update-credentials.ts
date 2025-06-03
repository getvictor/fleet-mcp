import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';

/**
 * Script to update Fleet API credentials in .env file
 */
async function updateCredentials(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  };

  try {
    console.log('Fleet API Credentials Update');
    console.log('============================');
    
    // Get current values from .env file if it exists
    const envPath = path.join(process.cwd(), '.env');
    let currentUrl = '';
    let currentKey = '';
    let currentToken = '';
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const urlMatch = envContent.match(/FLEET_SERVER_URL=(.+)/);
      const keyMatch = envContent.match(/FLEET_API_KEY=(.+)/);
      const tokenMatch = envContent.match(/MCP_AUTH_TOKEN=(.+)/);
      
      if (urlMatch && urlMatch[1]) {
        currentUrl = urlMatch[1];
      }
      
      if (keyMatch && keyMatch[1]) {
        currentKey = keyMatch[1];
      }
      
      if (tokenMatch && tokenMatch[1]) {
        currentToken = tokenMatch[1];
      }
    }
    
    // Prompt for new values
    const newUrl = await question(`Fleet Server URL [${currentUrl || 'https://fleet.example.com/api'}]: `);
    const newKey = await question(`Fleet API Key [${currentKey ? '********' : 'your_api_key_here'}]: `);
    
    console.log('\nMCP Authentication Token');
    console.log('------------------------');
    if (currentToken) {
      console.log(`Current token: ${currentToken.substring(0, 8)}...`);
      const keepToken = await question('Keep current token? (y/n) [y]: ');
      if (keepToken.toLowerCase() === 'n') {
        const generateToken = await question('Generate new secure token? (y/n) [y]: ');
        if (generateToken.toLowerCase() !== 'n') {
          currentToken = crypto.randomBytes(32).toString('hex');
          console.log(`Generated new token: ${currentToken.substring(0, 8)}...`);
        } else {
          const newToken = await question('Enter new MCP auth token: ');
          if (newToken) {
            currentToken = newToken;
          }
        }
      }
    } else {
      const generateToken = await question('Generate secure token? (y/n) [y]: ');
      if (generateToken.toLowerCase() !== 'n') {
        currentToken = crypto.randomBytes(32).toString('hex');
        console.log(`Generated token: ${currentToken.substring(0, 8)}...`);
      } else {
        const newToken = await question('Enter MCP auth token: ');
        currentToken = newToken || crypto.randomBytes(32).toString('hex');
      }
    }
    
    // Prepare new .env content
    const fleetServerUrl = newUrl || currentUrl || 'https://fleet.example.com/api';
    const fleetApiKey = newKey || currentKey || 'your_api_key_here';
    const mcpAuthToken = currentToken;
    
    const envContent = `# Fleet API Configuration
FLEET_SERVER_URL=${fleetServerUrl}
FLEET_API_KEY=${fleetApiKey}

# MCP Server Authentication
MCP_AUTH_TOKEN=${mcpAuthToken}
`;
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent, 'utf-8');
    
    console.log('\nCredentials updated successfully!');
    console.log(`Server URL: ${fleetServerUrl}`);
    console.log(`API Key: ${fleetApiKey.replace(/./g, '*')}`);
    console.log(`MCP Token: ${mcpAuthToken.substring(0, 8)}...`);
    
    console.log('\nYou can now test your connection with:');
    console.log('npm run test-fleet-api');
    console.log('\nAnd start the MCP server with:');
    console.log('npm start');
  } catch (error) {
    console.error('Error updating credentials:', error);
  } finally {
    rl.close();
  }
}

// Run the update
updateCredentials();