import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Script to troubleshoot common issues with the Fleet MCP server
 */
async function troubleshoot(): Promise<void> {
  console.log('Fleet MCP Server Troubleshooter');
  console.log('==============================');
  
  let hasIssues = false;
  
  // Check environment variables
  console.log('\nChecking environment variables...');
  const fleetServerUrl = process.env.FLEET_SERVER_URL;
  const fleetApiKey = process.env.FLEET_API_KEY;
  
  if (!fleetServerUrl) {
    console.log('❌ FLEET_SERVER_URL is not set');
    console.log('   Run: npm run update-credentials');
    hasIssues = true;
  } else {
    console.log(`✅ FLEET_SERVER_URL is set to: ${fleetServerUrl}`);
  }
  
  if (!fleetApiKey) {
    console.log('❌ FLEET_API_KEY is not set');
    console.log('   Run: npm run update-credentials');
    hasIssues = true;
  } else {
    console.log('✅ FLEET_API_KEY is set');
  }
  
  // Check if the build directory exists
  console.log('\nChecking build directory...');
  const buildDir = path.join(process.cwd(), 'build');
  
  if (!fs.existsSync(buildDir)) {
    console.log('❌ Build directory not found');
    console.log('   Run: npm run build');
    hasIssues = true;
  } else {
    console.log('✅ Build directory exists');
    
    // Check if the main server file exists
    const indexJs = path.join(buildDir, 'index.js');
    
    if (!fs.existsSync(indexJs)) {
      console.log('❌ Server executable not found');
      console.log('   Run: npm run build');
      hasIssues = true;
    } else {
      console.log('✅ Server executable exists');
    }
  }
  
  // Check if the server is running
  console.log('\nChecking if the server is running...');
  const port = process.env.PORT || '3000';
  try {
    const response = await axios.get(`http://localhost:${port}/mcp`, { timeout: 2000 });
    console.log('✅ Server is running');
    console.log(`   Server name: ${response.data.name}`);
    console.log(`   Server version: ${response.data.version}`);
  } catch (error) {
    console.log('❌ Server is not running or not responding');
    console.log('   Run: npm start');
    hasIssues = true;
  }
  
  // Check Cline and Roo Code configuration
  console.log('\nChecking Cline configuration...');
  
  // Determine the user's home directory
  const homeDir = os.homedir();
  
  // Path to Cline config file
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
  
  // Path to Roo Code config file
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
  
  if (fs.existsSync(clineConfigPath)) {
    try {
      const configContent = fs.readFileSync(clineConfigPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (config.mcpServers && config.mcpServers.fleet) {
        console.log('✅ Fleet MCP server is configured in Cline');
        
        if (config.mcpServers.fleet.disabled) {
          console.log('❌ Fleet MCP server is disabled in Cline');
          console.log('   Run: npm run install-mcp');
          hasIssues = true;
        } else {
          console.log('✅ Fleet MCP server is enabled in Cline');
        }
      } else {
        console.log('❌ Fleet MCP server is not configured in Cline');
        console.log('   Run: npm run install-mcp');
        hasIssues = true;
      }
    } catch (error) {
      console.log('❌ Error reading Cline configuration');
      console.log('   Run: npm run install-mcp');
      hasIssues = true;
    }
  } else {
    console.log('❌ Cline configuration file not found');
    console.log('   Is Cline installed? If yes, run: npm run install-mcp');
    hasIssues = true;
  }
  
  // Check Roo Code configuration
  console.log('\nChecking Roo Code configuration...');
  try {
    if (fs.existsSync(rooCodeConfigPath)) {
      try {
        const configContent = fs.readFileSync(rooCodeConfigPath, 'utf-8');
        const config = JSON.parse(configContent);
        
        if (config.mcpServers && config.mcpServers.fleet) {
          console.log('✅ Fleet MCP server is configured in Roo Code');
          
          if (config.mcpServers.fleet.disabled) {
            console.log('❌ Fleet MCP server is disabled in Roo Code');
            console.log('   Run: npm run install-mcp');
            hasIssues = true;
          } else {
            console.log('✅ Fleet MCP server is enabled in Roo Code');
          }
        } else {
          console.log('❌ Fleet MCP server is not configured in Roo Code');
          console.log('   Run: npm run install-mcp');
          hasIssues = true;
        }
      } catch (error) {
        console.log('❌ Error reading Roo Code configuration');
        console.log('   Run: npm run install-mcp');
        hasIssues = true;
      }
    } else {
      console.log('❌ Roo Code configuration file not found');
      console.log('   Run: npm run install-mcp to create the configuration');
      console.log(`   Configuration will be created at: ${rooCodeConfigPath}`);
      hasIssues = true;
    }
  } catch (error) {
    console.log('❌ Error checking Roo Code configuration');
    console.log(`   Error details: ${error instanceof Error ? error.message : String(error)}`);
    hasIssues = true;
  }
  
  // Summary
  console.log('\nTroubleshooting summary:');
  if (hasIssues) {
    console.log('❌ Issues were found. Please follow the recommendations above.');
  } else {
    console.log('✅ No issues found. The Fleet MCP server should be working correctly.');
  }
  
  // Additional help
  console.log('\nAdditional troubleshooting commands:');
  console.log('- npm run test-server: Test the MCP server locally');
  console.log('- npm run test-fleet-api: Test the Fleet API connection');
  console.log('- npm run test-with-cline: Test the MCP server with Cline');
}

// Run the troubleshooter
troubleshoot().catch(console.error);