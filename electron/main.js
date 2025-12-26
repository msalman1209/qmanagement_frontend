const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let nextServer;
const isDev = process.env.NODE_ENV === 'development';
const PORT = 3000;

function checkServerReady(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      const options = {
        host: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 1000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode) {
          console.log('✅ Next.js server is ready!');
          resolve();
        }
      });

      req.on('error', (err) => {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('❌ Server failed to start after', maxAttempts, 'attempts');
          reject(new Error('Server timeout'));
        } else {
          console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
          setTimeout(check, 1000);
        }
      });

      req.end();
    };

    check();
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In dev mode, assume next dev is running externally
      checkServerReady(PORT)
        .then(resolve)
        .catch(reject);
      return;
    }

    // Start Next.js server for production
    const isPackaged = app.isPackaged;
    
    // Set correct paths based on packaging
    let standaloneServer, appPath;
    if (isPackaged) {
      // Use standalone server in packaged app
      const resourcesPath = process.resourcesPath;
      standaloneServer = path.join(resourcesPath, '.next', 'standalone', 'server.js');
      appPath = path.join(resourcesPath, '.next', 'standalone');
      
      console.log('📦 Resources Path:', resourcesPath);
      console.log('📍 Standalone Server:', standaloneServer);
      console.log('📁 App Path:', appPath);
      console.log('✅ Server Exists:', fs.existsSync(standaloneServer));
    } else {
      // Development mode
      standaloneServer = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
      appPath = path.join(__dirname, '..', '.next', 'standalone');
    }
    
    console.log('🚀 Starting Next.js standalone server...');
    console.log('📦 Is Packaged:', isPackaged);

    // Check if standalone server exists
    if (!fs.existsSync(standaloneServer)) {
      console.error('❌ Standalone server not found at:', standaloneServer);
      console.error('This means Next.js was not built with output: "standalone"');
      // Force window to show with error
      setTimeout(() => resolve(), 1000);
      return;
    }

    nextServer = spawn('node', [standaloneServer], {
      cwd: appPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: PORT.toString(),
        HOSTNAME: '0.0.0.0'
      },
      shell: false
    });

    let serverStarted = false;
    let serverOutput = '';

    nextServer.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log('Next.js:', output);
      if (output.includes('Ready') || output.includes('started') || output.includes(PORT)) {
        serverStarted = true;
      }
    });

    nextServer.stderr.on('data', (data) => {
      const error = data.toString();
      serverOutput += error;
      console.error('Next.js Error:', error);
    });

    nextServer.on('error', (err) => {
      console.error('❌ Failed to start Next.js server:', err);
      console.error('Server output:', serverOutput);
      if (!serverStarted) {
        // Don't reject, just resolve to show window
        resolve();
      }
    });

    nextServer.on('exit', (code) => {
      console.log('Next.js server exited with code:', code);
      if (code !== 0) {
        console.error('Server output before exit:', serverOutput);
      }
      if (!serverStarted && code !== 0) {
        // Don't reject, just resolve to show window
        resolve();
      }
    });

    // Wait for server to be ready
    setTimeout(() => {
      checkServerReady(PORT)
        .then(resolve)
        .catch((err) => {
          console.error('Server check failed after 3 seconds');
          console.error('Server output:', serverOutput);
          // Resolve anyway to show window
          resolve();
        });
    }, 3000); // Give server 3 seconds to start before checking
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Disable cache to avoid permission errors
      partition: 'persist:quemanagement',
    },
    title: 'Queue Management System',
    backgroundColor: '#ffffff',
    show: false,
  });

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Load from localhost
  const loadUrl = `http://localhost:${PORT}`;
  console.log('🌐 Loading URL:', loadUrl);
  
  mainWindow.loadURL(loadUrl).catch(err => {
    console.error('Failed to load URL:', err);
    // Show window anyway with error message
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // DevTools disabled in production for clean UI
  // Uncomment below line for debugging packaged app
  // if (app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Show window after 3 seconds even if not ready
  const showTimeout = setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('⚠️ Showing window after timeout');
      mainWindow.show();
    }
  }, 3000);

  mainWindow.once('ready-to-show', () => {
    clearTimeout(showTimeout);
    console.log('✅ Window ready to show');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    clearTimeout(showTimeout);
    mainWindow = null;
  });

  // Handle navigation errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    // Show window even on error
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
  });
}

app.whenReady().then(async () => {
  try {
    await startNextServer();
    createWindow();
  } catch (err) {
    console.error('Failed to initialize:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
  }
});

// Handle any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

