module.exports = {
  apps: [
    {
      // Application name
      name: 'filmyfly-backend',
      
      // Entry point
      script: 'dist/app.js',
      
      // Working directory
      cwd: '/home/filmyfly/filmyfly.work',
      
      // Number of instances (max = all CPU cores)
      instances: 'max',
      
      // Execution mode (cluster = load balancing across CPUs)
      exec_mode: 'cluster',
      
      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logging
      error_file: '/home/filmyfly/.pm2/logs/filmyfly-error.log',
      out_file: '/home/filmyfly/.pm2/logs/filmyfly-out.log',
      log_file: '/home/filmyfly/.pm2/logs/filmyfly-combined.log',
      time: true,
      
      // Memory management
      max_memory_restart: '500M',  // Restart if exceeds 500MB
      
      // File watching (set to true for development)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist', 'public'],
      
      // Graceful shutdown
      kill_timeout: 5000,          // Wait 5 seconds before force kill
      wait_ready: true,            // Wait for app to signal ready
      listen_timeout: 3000,        // Timeout for ready signal
      
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      
      // Advanced options
      merge_logs: false,
      instance_var: 'INSTANCE_ID',
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'filmyfly',
      host: 'YOUR_GCP_INSTANCE_IP',  // Replace with your instance IP
      ref: 'origin/main',
      repo: 'https://github.com/kailashsur/filmyfly.work.git',
      path: '/home/filmyfly/filmyfly.work',
      
      // Post-deployment commands
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      
      // Pre-deployment backup
      'pre-deploy-local': 'echo "Deploying to production server"'
    }
  }
};
