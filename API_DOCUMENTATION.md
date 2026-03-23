# i_computers_backend API Documentation

## Base URL

- Local: `http://localhost:3000`
- API prefix: `/api`

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication via `Authorization: Bearer <token>`

## Environment Variables

Create a `.env` file with:

```env
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
```

## Authentication

- Auth middleware is applied globally in `index.js`.
- If no token is sent, public endpoints still work.
- Protected endpoints require a valid JWT.
- Admin-only endpoints require `req.user.role === "admin"`.

### Authorization Header

```http
Authorization: Bearer <jwt_token>
```

## Response Patterns

Typical success:

```json
{
  "message": "..."
}
```

Typical error:

```json
{
  "message": "...",
  "error": "..."
}
```

---

## Users API

Base path: `/api/users`

### 1) Register User

- Method: `POST`
- Path: `/api/users/`
- Auth: Not required

Request body:

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "123456"
}
```

Success response:

```json
{
  "message": "User created successfully"
}
```

### 2) Login

- Method: `POST`
- Path: `/api/users/login`
- Auth: Not required

Request body:

```json
{
  "email": "user@example.com",
  "password": "123456",
  "rememberMe": true
}
```

Success response:

```json
{
  "message": "Login successful",
  "token": "<jwt_token>",
  "role": "customer"
}
```

### 3) Get Current User Profile

- Method: `GET`
- Path: `/api/users/profile`
- Auth: Required

Success response:

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer",
  "image": "/images/default_profile.png",
  "isEmailVerified": false
}
```

### 4) Update User Profile

- Method: `PUT`
- Path: `/api/users/`
- Auth: Required

Request body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "image": "/images/profile.png",
  "rememberMe": false
}
```

Success response:

```json
{
  "message": "User profile updated successfully",
  "token": "<new_jwt_token>"
}
```

### 5) Change Password

- Method: `POST`
- Path: `/api/users/update-password`
- Auth: Required

Request body:

```json
{
  "password": "newPassword123"
}
```

Success response:

```json
{
  "message": "Password changed successfully"
}
```

---

## Products API

Base path: `/api/products`

### 1) Create Product (Admin)

- Method: `POST`
- Path: `/api/products/`
- Auth: Required (Admin)

Request body:

```json
{
  "productId": "P001",
  "name": "Laptop",
  "description": "High performance laptop",
  "altNames": ["Notebook"],
  "price": 250000,
  "labeledPrice": 275000,
  "category": "computers",
  "images": ["/images/laptop-1.jpg"],
  "isVisible": true,
  "brand": "BrandX",
  "model": "X-Pro"
}
```

Success response:

```json
{
  "message": "Product created successfully",
  "product": {
    "productId": "P001",
    "name": "Laptop"
  }
}
```

### 2) Get Products

- Method: `GET`
- Path: `/api/products/`
- Auth: Optional

Behavior:

- Admin gets all products.
- Non-admin or guest gets only products where `isVisible: true`.

Success response:

```json
[
  {
    "productId": "P001",
    "name": "Laptop",
    "price": 250000,
    "isVisible": true
  }
]
```

### 3) Get Product by ID

- Method: `GET`
- Path: `/api/products/:productId`
- Auth: Optional

Behavior:

- Hidden products are only visible to admin.
- Non-admin receives `404` for hidden products.

Success response:

```json
{
  "productId": "P001",
  "name": "Laptop",
  "price": 250000
}
```

### 4) Update Product (Admin)

- Method: `PUT`
- Path: `/api/products/:productId`
- Auth: Required (Admin)

Request body:

```json
{
  "name": "Laptop Pro",
  "description": "Updated description",
  "altNames": ["Notebook Pro"],
  "price": 300000,
  "labeledPrice": 325000,
  "category": "computers",
  "images": ["/images/laptop-pro.jpg"],
  "isVisible": true,
  "brand": "BrandX",
  "model": "X-Pro 2"
}
```

Success response:

```json
{
  "message": "Product updated successfully"
}
```

### 5) Delete Product (Admin)

- Method: `DELETE`
- Path: `/api/products/:productId`
- Auth: Required (Admin)

Success response:

```json
{
  "message": "Product deleted successfully"
}
```

---

## Orders API

Mounted with both base paths:

- `/api/order`
- `/api/orders`

Both map to the same router.

### 1) Create Order

- Method: `POST`
- Path: `/api/orders/` (or `/api/order/`)
- Auth: Required

Request body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "addressLine1": "No 10, Main Street",
  "addressLine2": "Colombo 05",
  "city": "Colombo",
  "country": "Sri Lanka",
  "postalCode": "00500",
  "phone": "0771234567",
  "items": [
    {
      "productId": "P001",
      "qty": 1
    }
  ]
}
```

Success response:

```json
{
  "message": "Order created successfully",
  "orderId": "ORD000123"
}
```

### 2) Get Orders (Paginated)

- Method: `GET`
- Path: `/api/orders/:pageSize/:pageNumber` (or `/api/order/:pageSize/:pageNumber`)
- Auth: Required

Path params:

- `pageSize`: number of orders per page
- `pageNumber`: current page number

Behavior:

- Admin gets all orders.
- Non-admin gets only own orders.

Success response:

```json
{
  "orders": [
    {
      "orderId": "ORD000123",
      "status": "Pending",
      "total": 250000
    }
  ],
  "totalPages": 3
}
```

### 3) Update Order Status (Admin)

- Method: `PUT`
- Path: `/api/orders/:orderId` (or `/api/order/:orderId`)
- Auth: Required (Admin)

Request body:

```json
{
  "status": "Shipped",
  "notes": "Handed over to courier"
}
```

Success response:

```json
{
  "message": "Order status updated successfully"
}
```

---

## Common HTTP Status Codes

- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

## Run Locally

```bash
npm install
npm start
```

Server runs on:

- `http://localhost:3000`
