# StockSim - Full-Stack Stock Market Dashboard & Trading Simulator

StockSim is a production-quality, responsive, and visually appealing virtual paper-trading platform. It allows users to study live stock market indices, build multiple watchlists, simulate buying and selling stocks with MARKET and LIMIT orders, track real-time portfolio returns, and analyze key stats using interactive charts.

This is an educational trading simulator. No real money or financial transactions are involved.

---

## Technical Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM (nested secure routes)
- **Styling**: Tailwind CSS (custom dark/light mode configurations, glassmorphic card classes)
- **State & Caching**: TanStack Query (React Query) + Axios
- **Charts & Visuals**: Recharts (Area charts for price histories, sector allocation pie charts, win/loss comparison bars)
- **Animations**: Framer Motion (animated card loads, page triggers, transaction modals)
- **Forms**: React Hook Form + Zod Schema Validation
- **Alerts**: React Hot Toast + Lucide Icons

### Backend
- **Server**: Node.js + Express.js
- **Database**: MongoDB (Mongoose models)
- **Authentication**: JWT Sessions + bcryptjs password hashing
- **Security**: Helmet headers, CORS filters, Express Rate Limit, express-validator sanitization
- **Simulation**: High-fidelity dynamic Random Walk (Brownian motion price ticks, limit orders queuing runner)

---

## Folder Structure

```
Stock Market Dashboard/
├── backend/
│   ├── config/             # Database connection setup
│   ├── controllers/        # Express handlers (auth, users, stocks, portfolio, watchlists, etc)
│   ├── middleware/         # Auth verify, admin validation
│   ├── models/             # Mongoose DB Schemas (User, Stock, Holding, Transaction, etc)
│   ├── routes/             # API routing endpoints
│   ├── services/           # MockStockService (Simulation Engine & Seed)
│   ├── tests/              # Native unit test scripts
│   ├── validators/         # Input fields validation schemas
│   ├── .env                # Port, Mongo URI, Secrets
│   ├── package.json        
│   └── server.js           # Server Entrypoint
├── angular-core-modules/   # Angular 20 Standalone components for alternative implementation
│   ├── dashboard.component.ts
│   ├── stock-explorer.component.ts
│   ├── stock-details.component.ts
│   └── trading-simulator.component.ts
└── frontend/
    ├── src/
    │   ├── components/     # Layout shells (Navbar, Sidebar)
    │   ├── context/        # Session AuthContext, ThemeContext
    │   ├── pages/          # Landing, Dashboard, Explorer, Details, Portfolio, Watchlists, Admin, etc
    │   ├── App.jsx         # Query Provider & Routes
    │   ├── index.css       # Tailwind layers, scrollbars, glass utilities
    │   └── main.jsx        # App mounting
    ├── index.html          # HTML frame
    ├── tailwind.config.js  # Theme extensions and tokens
    ├── postcss.config.js   
    └── package.json        
```

---

## Environment Variables

Create a `.env` file under the `/backend` folder:

```env
PORT=5009
MONGO_URI=mongodb://127.0.0.1:27017/stock-simulator
JWT_SECRET=stock_market_simulator_jwt_secret_token_987654321
NODE_ENV=development
CORS_ALLOWED_ORIGINS=http://localhost:3209,http://127.0.0.1:3209
```

---

## Installation & Getting Started

### Prerequisites
- Node.js installed (v18+ recommended)
- MongoDB running locally on port `27017` (or Atlas URI inside `.env`)

### Unified Startup (Recommended)
You can run both frontend and backend automatically using the custom orchestrator. 

1. Install dependencies at the root, frontend, and backend directories:
   - Root: `npm install`
   - Backend: `npm install --prefix backend`
   - Frontend: `npm install --prefix frontend`
2. Run `npm run dev` in the root workspace folder. This will:
   - Automatically free port `3209` if it is occupied by a previous/stale process.
   - Start the backend on port `5009`.
   - Poll backend health and validate CORS headers.
   - Start the frontend exactly on port `3209` with strict port checking.

### Port Mapping
- **Frontend**: `http://localhost:3209`
- **Backend**: `http://localhost:5009`

---

## REST API Documentation

### Authentication & Users
- `POST /api/auth/register`: Create a new profile. (First registered user is auto-promoted to Admin).
- `POST /api/auth/login`: Authenticate email and returns JWT.
- `GET /api/user/profile`: Retrieve user profile settings and balance.
- `PUT /api/user/profile`: Update profile info, toggle notifications, or change password.

### Stocks Explorer
- `GET /api/stocks`: Retrieve paginated stocks with sector, search, and cap filters.
- `GET /api/stocks/:symbol`: Retrieve detailed company details and 1D-5Y price history arrays.
- `GET /api/stocks/search/autocomplete?q=...`: Autocomplete ticker search.
- `GET /api/stocks/movers/top`: Get top 5 gainers, losers, and active assets.

### Portfolio & Simulator
- `GET /api/portfolio`: Get holdings list and valuation summaries.
- `POST /api/portfolio/buy`: Place a buy order (Market/Limit).
- `POST /api/portfolio/sell`: Place a sell order (Market/Limit).
- `DELETE /api/portfolio/order/:id`: Cancel pending Limit orders.
- `GET /api/transactions`: Get paginated transaction logs.

### Watchlists & Alerts
- `GET /api/watchlist`: Get all watchlists.
- `POST /api/watchlist`: Create new watchlist.
- `POST /api/watchlist/:id/add`: Add ticker.
- `DELETE /api/watchlist/:id/remove/:symbol`: Delete ticker.
- `DELETE /api/watchlist/:id`: Delete watchlist.

### Admin Dashboards (Requires role 'admin')
- `GET /api/admin/stats`: Aggregate system-wide counts.
- `GET /api/admin/users`: Search and paginate profiles list.
- `PUT /api/admin/users/:id/toggle`: Ban or unban user profiles.
- `POST /api/admin/stocks`: Seed a new stock symbol.
- `PUT /api/admin/stocks/:symbol`: Override quote price or specs.

---

## Future Improvements
- **Live APIs Fallback**: Connect fallback twelve-data or Finnhub tokens to hook real NYSE/NSE feeds.
- **Stock Comparison Desk**: Drag-and-drop comparison tool for two tickers.
- **Virtual Competitions**: Custom leaderboards and trading tournaments.
