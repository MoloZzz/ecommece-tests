# E-Commerce API Documentation

This document provides comprehensive documentation of the e-commerce system's endpoints, business logic, and state management for writing tests (state/behaviour verifications).

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Models](#data-models)
3. [API Endpoints](#api-endpoints)
4. [Business Logic & Validation Rules](#business-logic--validation-rules)
5. [State Transitions](#state-transitions)
6. [Error Handling](#error-handling)
7. [Testing Considerations](#testing-considerations)

---

## System Overview

The e-commerce system manages three main entities:
- **Users**: Customers with email and balance
- **Products**: Items available for purchase with price and stock
- **Orders**: Customer orders containing multiple products with status tracking

### Key Business Rules
- Orders can only transition through specific statuses: `created` → `paid` → `shipped`
- Stock is checked at order creation but only reserved when order is paid
- User balance is checked and deducted atomically when order is paid
- Order total is calculated from product prices at order creation time (price snapshot)

---

## Data Models

### User Entity
```typescript
{
  id: string (UUID, auto-generated)
  email: string (unique, required)
  balance: number (integer, default: 0)
  orders: OrderEntity[] (relation)
}
```

**Constraints:**
- Email must be unique
- Email must be valid email format
- Balance defaults to 0 on creation
- Balance can be negative (no validation prevents this)

### Product Entity
```typescript
{
  id: string (UUID, auto-generated)
  name: string (required)
  price: number (integer, required, must be positive)
  stock: number (integer, required, must be positive)
  orderItems: OrderItemEntity[] (relation)
}
```

**Constraints:**
- Price must be positive (> 0)
- Stock must be positive (> 0)
- Stock is checked at order creation but only decremented when order is paid

### Order Entity
```typescript
{
  id: string (UUID, auto-generated)
  userId: string (required, UUID)
  total: number (integer, calculated)
  status: OrderStatus (enum: 'created' | 'paid' | 'shipped', default: 'created')
  items: OrderItemEntity[] (relation)
}
```

**Status Enum:**
- `created`: Order created but not paid
- `paid`: Order paid, balance deducted, stock reserved
- `shipped`: Order shipped (final state)

### OrderItem Entity
```typescript
{
  id: string (UUID, auto-generated)
  orderId: string (required, UUID)
  productId: string (required, UUID)
  quantity: number (integer, required, must be positive)
  priceAtPurchase: number (integer, snapshot of product price at order creation)
}
```

**Constraints:**
- Quantity must be positive (> 0)
- Price at purchase is a snapshot (doesn't change if product price changes)

---

## API Endpoints

### Users

#### `POST /users`
Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Validation:**
- `email`: Required, must be valid email format

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "balance": 0
}
```

**Errors:**
- `400 Bad Request`: Invalid email format
- `500 Internal Server Error`: Duplicate email (database constraint)

**State Changes:**
- Creates new user with balance = 0

---

#### `GET /users/:id`
Get user by ID.

**Path Parameters:**
- `id`: UUID of the user

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "balance": 1000
}
```

**Errors:**
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid UUID format

---

#### `PATCH /users/:id/balance`
Update user balance.

**Path Parameters:**
- `id`: UUID of the user

**Request Body:**
```json
{
  "balance": 1000
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "balance": 1000
}
```

**Errors:**
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid UUID format

**State Changes:**
- Updates user balance (can be any number, including negative)

**Note:** This is a direct balance update, not a transaction. Use with caution in tests.

---

### Products

#### `POST /products`
Create a new product.

**Request Body:**
```json
{
  "name": "Laptop",
  "price": 500,
  "stock": 10
}
```

**Validation:**
- `name`: Required, non-empty string
- `price`: Required, positive number (> 0)
- `stock`: Required, positive number (> 0)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Laptop",
  "price": 500,
  "stock": 10
}
```

**Errors:**
- `400 Bad Request`: Validation errors (invalid price/stock, empty name)

**State Changes:**
- Creates new product

---

#### `GET /products`
Get all products.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Laptop",
    "price": 500,
    "stock": 10
  }
]
```

---

#### `PATCH /products/:id/stock`
Update product stock.

**Path Parameters:**
- `id`: UUID of the product

**Request Body:**
```json
{
  "stock": 20
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Laptop",
  "price": 500,
  "stock": 20
}
```

**Errors:**
- `404 Not Found`: Product not found
- `400 Bad Request`: Invalid UUID format

**State Changes:**
- Updates product stock directly (bypasses reservation logic)

**Note:** This is a direct stock update. Stock is also decremented atomically when orders are paid.

---

### Orders

#### `POST /orders`
Create a new order.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2
    }
  ]
}
```

**Validation:**
- `userId`: Required, valid UUID v4
- `items`: Required, non-empty array
- Each item:
  - `productId`: Required, valid UUID v4
  - `quantity`: Required, positive integer (> 0)

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "total": 1000,
  "status": "created",
  "items": [
    {
      "id": "uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "priceAtPurchase": 500
    }
  ]
}
```

**Business Logic:**
1. Validates user exists
2. For each item:
   - Validates product exists
   - Validates quantity > 0
   - Checks if `product.stock >= item.quantity` (at creation time)
   - Calculates total: `product.price * item.quantity`
   - Stores `priceAtPurchase` snapshot
3. Creates order with status `created`
4. **Does NOT** deduct balance or reserve stock at this stage

**Errors:**
- `400 Bad Request`: 
  - Invalid UUID format
  - Quantity <= 0
  - Insufficient stock (`product.stock < item.quantity`)
  - User not found
  - Product not found
- `404 Not Found`: User not found (during validation)

**State Changes:**
- Creates order with status `created`
- Does NOT modify user balance
- Does NOT modify product stock
- Stores price snapshot in `priceAtPurchase`

---

#### `GET /orders/:id`
Get order by ID.

**Path Parameters:**
- `id`: UUID of the order

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "total": 1000,
  "status": "created",
  "items": [
    {
      "id": "uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "priceAtPurchase": 500
    }
  ]
}
```

**Errors:**
- `404 Not Found`: Order not found
- `400 Bad Request`: Invalid UUID format

---

#### `PATCH /orders/:id/status`
Update order status.

**Path Parameters:**
- `id`: UUID of the order

**Request Body:**
```json
{
  "status": "paid"
}
```

**Validation:**
- `status`: Required, must be one of: `"created"`, `"paid"`, `"shipped"`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "user-uuid",
  "total": 1000,
  "status": "paid",
  "items": [...]
}
```

**Business Logic:**
1. Validates order exists
2. Validates status transition is allowed (see [State Transitions](#state-transitions))
3. If transitioning to `paid`:
   - Atomically deducts user balance: `user.balance -= order.total`
   - Validates user has sufficient balance (atomic check)
   - For each item, atomically reserves stock: `product.stock -= item.quantity`
   - Validates sufficient stock exists (atomic check)
4. Updates order status

**Errors:**
- `400 Bad Request`:
  - Invalid status enum value
  - Invalid status transition (e.g., `created` → `shipped`)
  - Insufficient balance (when paying)
  - Insufficient stock (when paying)
- `404 Not Found`: Order not found
- `400 Bad Request`: Invalid UUID format

**State Changes:**
- Updates order status
- If status = `paid`:
  - Decrements user balance atomically
  - Decrements product stock atomically for each item

**Critical Behavior:**
- Balance and stock checks are **atomic** (database-level)
- If balance/stock is insufficient, the entire operation fails
- Stock is only decremented when order is paid, not when created

---

## Business Logic & Validation Rules

### Order Creation
1. **User Validation**: User must exist
2. **Product Validation**: All products must exist
3. **Quantity Validation**: 
   - Must be positive integer (> 0)
   - Validated at DTO level (`@IsPositive()`, `@IsInt()`)
   - Also validated in service layer
4. **Stock Check**: 
   - Checks `product.stock >= item.quantity` at creation time
   - Stock is **NOT** decremented at creation
   - Stock is only reserved when order is paid
5. **Total Calculation**: 
   - `total = sum(product.price * item.quantity)` for all items
   - Uses current product price at creation time
6. **Price Snapshot**: 
   - Stores `priceAtPurchase` for each item
   - This is the price at order creation, not current price

### Order Payment (Status: `created` → `paid`)
1. **Status Transition Validation**: Must be valid transition
2. **Balance Deduction**:
   - Atomic operation: `UPDATE users SET balance = balance - total WHERE id = userId AND balance >= total`
   - If `affected === 0`, throws `Insufficient balance`
   - This prevents race conditions
3. **Stock Reservation**:
   - For each item, atomic operation: `UPDATE products SET stock = stock - quantity WHERE id = productId AND stock >= quantity`
   - If any `affected === 0`, throws `Insufficient stock`
   - This prevents overselling

### Order Shipping (Status: `paid` → `shipped`)
1. **Status Transition Validation**: Must be valid transition
2. **No Business Logic**: Simply updates status

### Stock Management
- **At Order Creation**: Stock is checked but not decremented
- **At Order Payment**: Stock is atomically decremented
- **Direct Update**: `PATCH /products/:id/stock` updates stock directly (bypasses reservation)

### Balance Management
- **At Order Creation**: Balance is not checked
- **At Order Payment**: Balance is atomically checked and deducted
- **Direct Update**: `PATCH /users/:id/balance` updates balance directly

---

## State Transitions

### Order Status State Machine

```
created → paid → shipped
  ↓        ↓        ↓
  └────────┴────────┘
   (no further transitions)
```

**Allowed Transitions:**
- `created` → `paid` ✅
- `paid` → `shipped` ✅
- `created` → `shipped` ❌ (not allowed)
- `paid` → `created` ❌ (not allowed)
- `shipped` → `paid` ❌ (not allowed)

**Transition Rules:**
- Each status can only transition to specific next statuses
- Invalid transitions throw `400 Bad Request` with message: `"Cannot transition from {current} to {next}"`

**State-Specific Behaviors:**
- **`created`**: Order exists, no balance deducted, no stock reserved
- **`paid`**: Balance deducted, stock reserved, cannot be reversed
- **`shipped`**: Final state, no further changes

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Scenarios |
|------|---------|------------------|
| `200` | Success | GET, PATCH operations |
| `201` | Created | POST operations (user, product, order) |
| `400` | Bad Request | Validation errors, invalid transitions, insufficient balance/stock |
| `404` | Not Found | Resource doesn't exist |
| `500` | Internal Server Error | Database constraints, unexpected errors |

### Common Error Responses

**Validation Error (400):**
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

**Business Logic Error (400):**
```json
{
  "statusCode": 400,
  "message": "Insufficient balance",
  "error": "Bad Request"
}
```

**Not Found Error (404):**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### Error Scenarios

1. **Insufficient Stock** (Order Creation):
   - When: `product.stock < item.quantity`
   - Error: `400 Bad Request` - "Insufficient stock"

2. **Insufficient Balance** (Order Payment):
   - When: `user.balance < order.total` (atomic check)
   - Error: `400 Bad Request` - "Insufficient balance"

3. **Insufficient Stock** (Order Payment):
   - When: `product.stock < item.quantity` (atomic check, after order creation)
   - Error: `400 Bad Request` - "Insufficient stock"
   - Note: Can happen if stock was decremented between order creation and payment

4. **Invalid Status Transition**:
   - When: Attempting invalid transition (e.g., `created` → `shipped`)
   - Error: `400 Bad Request` - "Cannot transition from {current} to {next}"

5. **Duplicate Email**:
   - When: Creating user with existing email
   - Error: `500 Internal Server Error` (database constraint violation)

6. **Invalid UUID**:
   - When: Invalid UUID format in path/body
   - Error: `400 Bad Request` (validation error)

---

## Testing Considerations

### State Verification Tests

**User State:**
- Verify balance changes after order payment
- Verify balance remains unchanged after order creation
- Verify balance can be negative (no validation prevents this)

**Product State:**
- Verify stock remains unchanged after order creation
- Verify stock decrements after order payment
- Verify stock check at order creation (prevents creating orders with insufficient stock)
- Verify atomic stock reservation (prevents overselling)

**Order State:**
- Verify order status transitions
- Verify order total calculation (price snapshot)
- Verify `priceAtPurchase` matches product price at creation time
- Verify order cannot transition invalid states

### Behavior Verification Tests

**Order Creation Flow:**
1. Create user
2. Create product with stock
3. Create order → Verify status = `created`, stock unchanged, balance unchanged
4. Pay order → Verify status = `paid`, stock decremented, balance decremented

**Concurrent Order Payment:**
- Test atomic balance deduction (prevent double payment)
- Test atomic stock reservation (prevent overselling)

**Price Snapshot:**
- Create order with product at price X
- Update product price to Y
- Verify order total and `priceAtPurchase` remain at X

**Stock Race Condition:**
- Create order when stock is sufficient
- Decrement stock manually (simulate another order)
- Attempt to pay → Should fail with "Insufficient stock"

**Balance Race Condition:**
- Create order when balance is sufficient
- Decrement balance manually (simulate another order)
- Attempt to pay → Should fail with "Insufficient balance"

### Edge Cases to Test

1. **Zero/Negative Quantities**: Should be rejected (validated at DTO and service level)
2. **Zero Stock**: Order creation should fail
3. **Zero Balance**: Order payment should fail
4. **Negative Balance**: User can have negative balance (no validation prevents this)
5. **Multiple Items**: Order with multiple products, verify all stocks decrement
6. **Invalid Status Transitions**: All invalid transitions should be rejected
7. **Non-existent Resources**: All endpoints should handle missing resources

### Test Data Setup

**For State Verification:**
- Create isolated test data for each test
- Use unique emails/products to avoid conflicts
- Reset state between tests if needed

**For Behavior Verification:**
- Test complete order lifecycle: create → pay → ship
- Test error scenarios: insufficient balance/stock
- Test concurrent operations: multiple orders, race conditions

---

## Summary

### Key Points for Test Writers

1. **Stock Management**: Stock is checked at creation but only decremented at payment
2. **Balance Management**: Balance is only checked and deducted at payment (atomic)
3. **Price Snapshot**: Order prices are snapshotted at creation time
4. **State Transitions**: Only specific transitions are allowed
5. **Atomic Operations**: Balance and stock operations are atomic (prevents race conditions)
6. **Validation Layers**: Validation happens at both DTO level (class-validator) and service level

### Critical Behaviors

- ✅ Stock checked but not reserved at order creation
- ✅ Stock reserved atomically at order payment
- ✅ Balance checked and deducted atomically at order payment
- ✅ Price snapshot stored at order creation
- ✅ Status transitions are strictly enforced
- ✅ All operations are idempotent where possible

---

*Last Updated: Based on current codebase analysis*
*For questions or clarifications, refer to the source code in `server/src/`*

