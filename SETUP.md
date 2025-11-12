# Quick Setup Guide

## Prerequisites
- .NET 9 SDK
- Node.js 18+
- MongoDB (Atlas or local instance)

## Step-by-Step Setup

### 1. Backend Setup
```bash
cd "Inventory & Order Management System\server"
copy .env.example .env
dotnet restore
dotnet run
```
Update the copied `.env` with your `MongoDb__ConnectionString` and `JwtSettings__Secret`.
✅ Backend runs at: `http://localhost:5001`
📚 Swagger docs at: `https://localhost:5002/swagger`

### 2. Frontend Setup
```bash
cd "Inventory & Order Management System\client"
npm install
npm start
```
✅ Frontend runs at: `http://localhost:3000`

### 3. Login
- Use seeded test accounts or register new users
- Test Admin: admin / Admin@123
- Test Staff: staff / Staff@123

## Project Features

| Feature | Status |
|---------|--------|
| Authentication (JWT) | ✅ Complete |
| Product CRUD | ✅ Complete |
| Order Management | ✅ Complete |
| Supplier Management | ✅ Complete |
| Category Management | ✅ Complete |
| Dashboard with Charts | ✅ Complete |
| Low Stock Alerts | ✅ Complete |
| Role-Based Access | ✅ Complete |
| API Documentation | ✅ Swagger |
| Responsive UI | ✅ Material-UI |

## Database Configuration

**Connection String** (`appsettings.json` or `.env` overrides):
```json
"MongoDb": {
  "ConnectionString": "mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority",
  "DatabaseName": "InventoryDB"
}
```

**JWT Secret** (`appsettings.json` or `.env`):
```json
"JwtSettings": {
  "Secret": "your-very-secret-key-min-32-characters-long!",
  "Issuer": "InventoryApp",
  "Audience": "InventoryAppUsers",
  "ExpiryMinutes": 60
}
```

## API Base URL Configuration

**Frontend** (`.env` or `.env.local`):
```
REACT_APP_API_URL=http://localhost:5001/api
```

## Troubleshooting

### Issue: Database connection failed
- **Solution**: Verify MongoDB URI, credentials, and Atlas IP allow-list

### Issue: CORS error in browser
- **Solution**: Backend CORS policy includes localhost:3000 by default

### Issue: Port 5001 already in use
- **Solution**: Change port in `server/Properties/launchSettings.json`

### Issue: npm install fails
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`

## Next Steps

1. ✅ Start both backend and frontend servers
2. ✅ Sign in with the seeded admin user
3. ✅ Create categories, suppliers, and products
4. ✅ Create sales and purchase orders
5. ✅ Review the dashboard statistics

## Important Files

| File | Purpose |
|------|---------|
| `server/appsettings.json` | Backend configuration |
| `client/src/api/axiosClient.js` | API client configuration |
| `client/src/api/endpoints.js` | API endpoint definitions |
| `client/.env` | Frontend environment variables |

## Database Tables

- Users (Authentication & roles)
- Products (Inventory items)
- Categories (Product categories)
- Suppliers (Supplier info)
- Orders (Sales & Purchase orders)
- OrderItems (Order line items)

All relationships and constraints are configured in MongoDB collections seeded via `server/Data/SeedData.cs`.

---

For detailed documentation, see `README.md`
