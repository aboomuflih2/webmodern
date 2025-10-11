module.exports = {
  apps: [{
    name: 'pottur-school-website',
    script: './start.sh',
    cwd: '/root/pottur-school-connect',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
