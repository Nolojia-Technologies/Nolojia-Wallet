# Nolojia Wallet - Setup Instructions

## Prerequisites

Before running the Nolojia Wallet platform, ensure you have the following installed:

- **Node.js** (18.x or higher)
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose**
- **PostgreSQL** (if running without Docker)
- **Redis** (optional, for caching)

## Quick Start with Docker

The easiest way to get started is using Docker Compose:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nolojia-wallet
```

### 2. Environment Setup
Copy the environment file and update as needed:
```bash
cp backend/.env.example backend/.env
```

### 3. Start Services
```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up -d

# Or for production
docker-compose up -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **pgAdmin**: http://localhost:5050 (admin@nolojia.com / admin123)

## Manual Setup (Without Docker)

### 1. Database Setup

#### PostgreSQL
```bash
# Create database
createdb nolojia_wallet

# Or using psql
psql -c "CREATE DATABASE nolojia_wallet;"
```

#### Redis (Optional)
```bash
# Install Redis on Ubuntu/Debian
sudo apt install redis-server

# Install Redis on macOS
brew install redis
```

### 2. Backend Setup

```bash
cd backend
npm install

# Run database migrations
npm run migration:run

# Start in development mode
npm run start:dev

# Or build and start in production
npm run build
npm run start:prod
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

## Environment Configuration

### Backend Environment Variables (.env)

```bash
# Environment
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nolojia_wallet

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# M-Pesa Integration
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email & SMS (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMS_API_KEY=your_sms_api_key
```

### Frontend Environment Variables (.env)

```bash
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Nolojia Wallet
VITE_ENVIRONMENT=development
```

## Database Migrations

### Generate Migration
```bash
cd backend
npm run migration:generate src/database/migrations/InitialMigration
```

### Run Migrations
```bash
npm run migration:run
```

### Revert Migration
```bash
npm run migration:revert
```

## Testing

### Backend Tests
```bash
cd backend
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage
```

### Frontend Tests
```bash
cd frontend
npm run test           # Run tests
npm run test:ui        # Run tests with UI
```

## Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1: Start database
docker-compose -f docker-compose.dev.yml up postgres redis

# Terminal 2: Start backend
cd backend && npm run start:dev

# Terminal 3: Start frontend
cd frontend && npm run dev
```

### 2. Make Changes
- Backend changes are automatically reloaded via Nest.js watch mode
- Frontend changes are hot-reloaded via Vite

### 3. Database Changes
```bash
# After modifying entities, generate migration
npm run migration:generate src/database/migrations/YourMigrationName

# Run the migration
npm run migration:run
```

## Production Deployment

### 1. Build Applications
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### 2. Environment Setup
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper database credentials
- Set up SSL certificates
- Configure reverse proxy (nginx)

### 3. Deploy with Docker
```bash
docker-compose up -d
```

### 4. Health Checks
- Backend: http://your-domain.com/api/health
- Frontend: http://your-domain.com

## API Documentation

The API documentation is automatically generated using Swagger/OpenAPI:
- **Development**: http://localhost:3001/api/docs
- **Production**: https://your-domain.com/api/docs

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check connection credentials
   - Verify database exists

2. **Port Already in Use**
   ```bash
   # Find and kill process using port
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

3. **Docker Issues**
   ```bash
   # Clean up Docker containers
   docker-compose down
   docker system prune
   ```

4. **Node.js Version Issues**
   - Use Node.js 18.x or higher
   - Consider using nvm for version management

### Logs

- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Database logs: `docker-compose logs postgres`

## Security Considerations

1. **Change Default Passwords**: Update all default passwords in production
2. **JWT Secrets**: Use strong, unique JWT secrets
3. **Database Security**: Restrict database access and use strong passwords
4. **HTTPS**: Always use HTTPS in production
5. **Environment Variables**: Never commit sensitive data to version control
6. **Rate Limiting**: Implement rate limiting on API endpoints
7. **Input Validation**: All inputs are validated on both client and server
8. **Data Encryption**: Sensitive data is encrypted at rest and in transit

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the API documentation
- Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.