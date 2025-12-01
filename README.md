# 🎫 Queue Management System with License Management

A comprehensive Queue Management System built with Next.js and Node.js, featuring a complete License Management System for controlling admin access, user limits, and service restrictions.

## ✨ Features

### 🎯 Core Features
- **Queue Management**: Complete ticket management system
- **Multi-counter Support**: Handle multiple service counters
- **User Management**: Create and manage users per admin
- **Service Management**: Define and manage services
- **Real-time Display**: Live ticket display system
- **Reporting**: Comprehensive reports and analytics

### 🔐 License Management Features
- **License Types**: Trial, Basic, Premium, Enterprise
- **Automatic Validation**: License expiry checking on every API call
- **User Limits**: Enforce maximum users per license type
- **Service Limits**: Control number of services per admin
- **Status Tracking**: Active, Expired, Suspended, Inactive
- **Expiry Warnings**: Automatic notifications for expiring licenses
- **License Reports**: Detailed analytics and statistics

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL Database
- npm or yarn

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd que-management
```

#### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
npm install
```

#### 3. Configure Environment Variables

Create `.env` file in backend directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=u998585094_demoqueue
DB_PORT=3306
JWT_SECRET=your_jwt_secret
PORT=5000
```

#### 4. Setup License System
```bash
cd backend
npm run setup:license
```

This will:
- ✅ Create/update database tables
- ✅ Add license management tables
- ✅ Create super admin account
- ✅ Add necessary indexes

#### 5. Test Setup
```bash
npm run test:license
```

#### 6. Start the Application

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Credentials

### Super Admin
```
Username: superadmin
Password: SuperAdmin@123
```
**⚠️ Important:** Change this password after first login!

## 📚 Documentation

Comprehensive documentation is available in the following files:

- **[QUICK_START.md](QUICK_START.md)** - 5-minute quick setup guide
- **[LICENSE_COMPLETE_GUIDE.md](LICENSE_COMPLETE_GUIDE.md)** - Complete licensing system guide
- **[LICENSE_URDU_GUIDE.md](LICENSE_URDU_GUIDE.md)** - اردو میں مکمل گائیڈ
- **[LICENSE_VISUAL_GUIDE.md](LICENSE_VISUAL_GUIDE.md)** - Visual diagrams and flowcharts
- **[LICENSE_QUICK_REFERENCE.md](LICENSE_QUICK_REFERENCE.md)** - API reference
- **[LICENSE_MANAGEMENT_GUIDE.md](LICENSE_MANAGEMENT_GUIDE.md)** - Frontend management guide

## 🎯 License Types

| Type | Duration | Max Users | Max Counters | Max Services | Price |
|------|----------|-----------|--------------|--------------|-------|
| **Trial** | 30 days | 5 | 2 | 5 | Free |
| **Basic** | 1 year | 10 | 5 | 10 | $99/year |
| **Premium** | 1 year | 50 | 20 | 50 | $299/year |
| **Enterprise** | 1 year | Unlimited | Unlimited | Unlimited | Custom |

## 📁 Project Structure

```
que-management/
├── backend/                 # Node.js Backend
│   ├── config/             # Configuration files
│   ├── controllers/        # API controllers
│   │   ├── license/        # License management
│   │   ├── auth/           # Authentication
│   │   ├── admin/          # Admin operations
│   │   └── user/           # User operations
│   ├── database/           # Database scripts
│   │   ├── setup-licensing.js    # License setup script
│   │   └── test-licensing.js     # License test script
│   ├── middlewares/        # Express middlewares
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   │   └── licenseUtils.js # License utilities
│   └── server.js           # Main server file
├── src/                    # Next.js Frontend
│   ├── app/                # App router pages
│   ├── Components/         # React components
│   └── store/              # Redux store
└── public/                 # Static files
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/super-admin/login` - Super admin login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout

### License Management (Super Admin Only)
- `POST /api/license/create` - Create new license
- `GET /api/license/all` - Get all licenses
- `GET /api/license/:id` - Get license by ID
- `PUT /api/license/:id` - Update license
- `DELETE /api/license/:id` - Delete license
- `GET /api/license/report` - Get license report

### User Management
- `POST /api/user/create` - Create user (checks license limits)
- `GET /api/user/all` - Get all users
- `PUT /api/user/:id` - Update user
- `DELETE /api/user/:id` - Delete user

### Service Management
- `POST /api/services/create` - Create service (checks license limits)
- `GET /api/services/all` - Get all services
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

## 🛠️ Available Scripts

### Backend Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server
npm run setup:license  # Setup license system
npm run test:license   # Test license system
```

### Frontend Scripts
```bash
npm run dev            # Start development server
npm run build          # Build for production
npm start              # Start production server
npm run lint           # Run ESLint
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
