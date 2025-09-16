# Nolojia Wallet 🏦

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-blue.svg)](https://vitejs.dev/)

**Kenya's Most Comprehensive Digital Wallet Platform** - Built for individuals, businesses, and communities with advanced P2P lending, Chama management, and fraud prevention.

## Project Structure

```
nolojia-wallet/
├── frontend/           # React + TailwindCSS + shadcn/ui
├── backend/           # NestJS + PostgreSQL
├── shared/            # Shared types and utilities
├── docs/             # Documentation
├── docker-compose.yml # Docker configuration
└── README.md
```

## 🚀 Features

### 💸 Core Financial Services
- **Send & Receive Money**: Instant transfers with low fees and real-time notifications
- **Digital Wallet**: Secure wallet with balance visibility controls and transaction history
- **Bill Payments**: Pay utilities, mobile credit, and services
- **QR Code Payments**: Quick scan-to-pay functionality

### 👥 Community Finance (Advanced P2P System)
- **Chama Management**: Digital group savings with automated contribution tracking
- **Two-Way P2P Lending**: Revolutionary marketplace where users can both borrow AND lend
- **Custom Loan Terms**: Set interest rates, duration, penalties, grace periods, and additional terms
- **Wallet Integration**: Automatic validation ensures lenders have sufficient funds
- **Auto-Cleanup**: Invalid offerings automatically removed when wallet balance drops
- **Edit Functionality**: Lenders can modify terms until money is lent out
- **Trust Scoring**: Community-driven credit scoring based on payment history
- **Real-time Matching**: Connect borrowers and lenders instantly

### 🏢 Business Solutions
- **Payroll Management**: Bulk employee payments with automated scheduling
- **Digital Receipts**: Generate, store, and manage transaction receipts
- **Escrow Services**: Secure transactions for business deals and freelance work
- **Analytics Dashboard**: Track payments, revenue, and financial insights

### 🛡️ Security & Trust
- **Advanced Fraud Detection**: Multi-layered fraud prevention system
- **KYC/Identity Management**: One wallet per National ID with KRA PIN verification
- **Trust Score System**: Real-time fraud detection and community reputation
- **Secure Authentication**: Multi-factor authentication with session persistence
- **Fraud Registry**: Public blacklist and verification portal

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running without Docker)

### 🚀 Quick Start (Frontend Only - Ready to Use!)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nolojia-wallet.git
   cd nolojia-wallet
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### 🎭 Demo Credentials
Experience the full application with these demo credentials:
- **Email**: `demo@nolojia.com`
- **Password**: `password`

### 🏗️ Full Stack Development (Optional)
For backend development:
```bash
# Start with Docker
docker-compose up -d

# Or manually
cd backend && npm install && npm run start:dev
```

### Access Points
- **Landing Page**: http://localhost:3000
- **Frontend App**: http://localhost:3000/login (after authentication)
- **Backend API**: http://localhost:3001 (if running)
- **Database**: localhost:5432 (if running)

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-kyc` - KYC verification

### Wallet
- `GET /wallet/balance` - Get wallet balance
- `POST /wallet/send` - Send money
- `POST /wallet/receive` - Receive money
- `GET /wallet/transactions` - Transaction history

### Escrow
- `POST /escrow/create` - Create escrow transaction
- `POST /escrow/confirm` - Confirm receipt
- `POST /escrow/dispute` - Raise dispute

### Fraud Prevention
- `GET /fraud/check/:userCode` - Check trust score
- `POST /fraud/report` - Report fraud
- `GET /fraud/blacklist` - Public blacklist

### Payroll
- `POST /payroll/upload` - Upload payroll CSV
- `POST /payroll/process` - Process payroll
- `GET /payroll/status` - Check processing status

## Database Schema

See [Database Schema](docs/database-schema.md) for detailed table structures.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact [support@nolojia.com](mailto:support@nolojia.com).