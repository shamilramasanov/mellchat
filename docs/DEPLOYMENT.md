# MellChat Deployment Guide

## Prerequisites

### System Requirements
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB free disk space

### External Services
- Twitch API credentials
- YouTube API key
- (Optional) Kick API key

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd mellchat
```

### 2. Environment Setup
```bash
cp env.example .env
# Edit .env with your API keys and configuration
```

### 3. Start Services
```bash
docker-compose up -d
```

### 4. Verify Deployment
```bash
# Check API health
curl http://localhost:3000/api/v1/health

# Check WebSocket connection
# Open browser to http://localhost:3001
```

## Production Deployment

### 1. Environment Configuration

Create production `.env`:
```bash
NODE_ENV=production
POSTGRES_URL=postgresql://user:password@postgres-host:5432/mellchat
REDIS_URL=redis://redis-host:6379
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://yourdomain.com
```

### 2. Database Setup

#### PostgreSQL
```bash
# Create database
createdb mellchat

# Run migrations
docker-compose exec api-gateway npm run migrate
```

#### Redis Configuration
```bash
# Copy Redis config
cp database/redis/redis.conf /etc/redis/redis.conf
```

### 3. SSL/TLS Setup

#### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

#### Update docker-compose.yml for SSL
```yaml
api-gateway:
  ports:
    - "443:3000"
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 4. Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/mellchat`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/mellchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl create namespace mellchat
```

### 2. Apply Configurations
```bash
# Apply all K8s configs
kubectl apply -f infrastructure/kubernetes/ -n mellchat
```

### 3. Check Deployment
```bash
kubectl get pods -n mellchat
kubectl get services -n mellchat
```

## Monitoring Setup

### 1. Prometheus
```bash
# Prometheus is already configured in docker-compose.yml
# Access at http://localhost:9090
```

### 2. Grafana
```bash
# Grafana is already configured
# Access at http://localhost:3002
# Default credentials: admin/admin
```

### 3. Import Dashboards
- Import `monitoring/grafana/dashboards/overview.json`
- Import `monitoring/grafana/dashboards/collectors.json`

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump mellchat > backup_$(date +%Y%m%d_%H%M%S).sql

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb backup_redis_$(date +%Y%m%d_%H%M%S).rdb
```

### Automated Backup Script
```bash
# Run backup script
./scripts/backup.sh
```

## Scaling

### Horizontal Scaling
```bash
# Scale API Gateway
docker-compose up -d --scale api-gateway=3

# Scale Collectors
docker-compose up -d --scale twitch-collector=2
```

### Load Balancer Configuration
Update nginx config for multiple API instances:
```nginx
upstream api_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

location /api/ {
    proxy_pass http://api_backend;
}
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec api-gateway npm run test:db
```

#### Redis Connection Issues
```bash
# Check Redis logs
docker-compose logs redis

# Test Redis
docker-compose exec redis redis-cli ping
```

#### WebSocket Connection Issues
```bash
# Check WebSocket proxy logs
docker-compose logs websocket-proxy

# Test WebSocket
wscat -c ws://localhost:8080/ws
```

### Log Analysis
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f twitch-collector
```

### Performance Monitoring
```bash
# Check resource usage
docker stats

# Check Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up
```

## Security Considerations

### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Database Security
- Use strong passwords
- Enable SSL connections
- Regular security updates

### 3. API Security
- Rate limiting enabled
- JWT token validation
- CORS properly configured
- Input validation

### 4. Container Security
- Run containers as non-root user
- Regular image updates
- Scan for vulnerabilities

## Maintenance

### Regular Tasks
- Monitor disk space
- Check log file sizes
- Update dependencies
- Backup databases
- Review security logs

### Updates
```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `curl http://localhost:3000/api/v1/health`
4. Check resource usage: `docker stats`
