# YESP Order Management Microservice

A robust, scalable order management microservice built with Node.js, Express, and MongoDB, designed for multi-tenant SaaS applications.

## Features

- **Multi-tenant Architecture**: Separate databases for each tenant
- **JWT Authentication**: Secure API endpoints with role-based access
- **Order Management**: Complete CRUD operations for orders
- **Order Tracking**: Status updates and tracking numbers
- **Statistics**: Order analytics and reporting
- **Validation**: Input validation using Joi
- **Error Handling**: Centralized error handling
- **Rate Limiting**: API rate limiting for security
- **Health Checks**: Service health monitoring

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Configure your environment variables in \`.env\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Environment Variables

\`\`\`
PORT=5005
NODE_ENV=development
MAIN_DB_URI=mongodb://localhost:27017/yesp_main
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET=your_super_secret_jwt_key_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

## API Endpoints

### Orders

- \`POST /api/orders\` - Create a new order
- \`GET /api/orders\` - Get all orders (with pagination and filters)
- \`GET /api/orders/:orderId\` - Get order by ID
- \`PUT /api/orders/:orderId\` - Update order
- \`PATCH /api/orders/:orderId/cancel\` - Cancel order
- \`GET /api/orders/stats\` - Get order statistics

### Health Check

- \`GET /health\` - Service health status

## Order Status Flow

1. **pending** → **confirmed** → **processing** → **shipped** → **delivered**
2. **pending** → **cancelled**
3. **delivered** → **refunded**

## Authentication

All API endpoints require a valid JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

The JWT token should contain:
- \`userId\`: User identifier
- \`tenantId\`: Tenant identifier
- \`storeId\`: Store identifier
- \`role\`: User role

## Database Schema

### Main Database (Tenant Management)
- **Tenant**: Stores tenant information and database configurations

### Tenant Database (Per Tenant)
- **Order**: Stores order information, items, and tracking details

## Error Handling

The API returns consistent error responses:

\`\`\`json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"]
}
\`\`\`

## Pagination

List endpoints support pagination:

\`\`\`json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current": 1,
    "pages": 10,
    "total": 100,
    "limit": 10
  }
}
\`\`\`

## Development

\`\`\`bash
# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Start production server
npm start
\`\`\`

## Security Features

- Helmet for security headers
- CORS configuration
- Rate limiting
- JWT token validation
- Input validation and sanitization
- MongoDB injection prevention

## Monitoring

- Health check endpoint at \`/health\`
- Structured logging
- Error tracking
- Performance monitoring ready

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
\`\`\`
