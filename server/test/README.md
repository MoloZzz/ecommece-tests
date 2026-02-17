# Test Suites Documentation

This directory contains comprehensive test suites organized by testing approach and purpose.

## Test Suite Organization

### 1. State Verification Tests (`test/state-verification/`)

**Purpose**: Verify the state of domain objects and computational logic after operations.

**Approach**: These tests check the **final state** of objects (entities, calculations) after operations complete. They focus on **what** the system does, not **how** it does it.

**Test Files**:
- `order-state.spec.ts` - Order domain object state verification
- `user-state.spec.ts` - User domain object state verification  
- `product-state.spec.ts` - Product domain object state verification
- `computational-logic.spec.ts` - Computational logic and calculations verification

**What They Test**:
- ✅ Order status transitions
- ✅ Order total calculations
- ✅ Price snapshot preservation
- ✅ User balance changes
- ✅ Product stock changes
- ✅ State after order creation vs payment
- ✅ Multi-item calculations

**Run Command**:
```bash
npm run test:state-verification
```

### 2. Behavior Verification Tests (`test/behavior-verification/`)

**Purpose**: Verify the behavior and interactions of orchestrator services and external dependencies.

**Approach**: These tests verify **how** the system works by checking method calls, interactions, and orchestration. They use mocks to isolate dependencies and verify interactions.

**Test Files**:
- `orders-service-behavior.spec.ts` - OrdersService orchestration and interactions
- `users-service-behavior.spec.ts` - UsersService repository interactions
- `products-service-behavior.spec.ts` - ProductsService repository interactions

**What They Test**:
- ✅ Service method calls to dependencies
- ✅ Repository interactions
- ✅ Query builder usage for atomic operations
- ✅ Orchestration of payment flow (UsersService + ProductsService)
- ✅ Error propagation
- ✅ Atomic operation behavior

**Run Command**:
```bash
npm run test:behavior-verification
```

### 3. E2E Tests (`test/*.e2e-spec.ts`)

**Purpose**: End-to-end integration tests that verify the complete system flow.

**Test Files**:
- `orders.ordered.e2e-spec.ts` - Ordered flow tests
- `orders.e2e-spec.ts` - Order lifecycle tests
- `users.e2e-spec.ts` - User management tests
- `products.e2e-spec.ts` - Product management tests

**Run Command**:
```bash
npm run test:e2e
```

### 4. Data-Driven Tests (`test/data-driven/`)

**Purpose**: Parameterized tests that verify multiple scenarios with different input data.

**Test Files**:
- `balance.ddt-spec.ts` - Balance validation tests
- `email.validation.ddt-spec.ts` - Email validation tests
- `payment.check.ddt-spec.ts` - Payment validation tests
- `quantity.edges.ddt-spec.ts` - Quantity edge case tests

**Run Command**:
```bash
npm run test:data-driven
```

## Test Philosophy

### State Verification vs Behavior Verification

**State Verification** (What):
- Checks the final state of objects
- Verifies calculations and computations
- Tests domain object properties
- Example: "After paying order, user balance should be 700"

**Behavior Verification** (How):
- Checks method calls and interactions
- Verifies orchestration and coordination
- Tests service dependencies
- Example: "When paying order, OrdersService should call UsersService.deductBalance"

### When to Use Each Approach

**Use State Verification When**:
- Testing domain objects and their properties
- Verifying computational logic
- Testing business rules and calculations
- Verifying data transformations

**Use Behavior Verification When**:
- Testing orchestrator services
- Verifying interactions with external dependencies
- Testing error propagation
- Verifying atomic operations
- Testing service coordination

## Running All Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:state-verification
npm run test:behavior-verification
npm run test:e2e
npm run test:data-driven

# Run with coverage
npm run test:cov
```

## Test Coverage Goals

- **State Verification**: Cover all domain objects and computational logic
- **Behavior Verification**: Cover all orchestrator services and interactions
- **E2E Tests**: Cover complete user flows
- **Data-Driven Tests**: Cover edge cases and validation scenarios

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Mock External Dependencies**: Use mocks for behavior verification tests
5. **Verify State**: Check actual state values in state verification tests
6. **Verify Behavior**: Check method calls and interactions in behavior verification tests

## Test Data Management

- Use unique identifiers (timestamps, random values) to avoid conflicts
- Create fresh test data for each test when possible
- Clean up test data in `afterAll` hooks for E2E tests
- Use mocks to avoid database dependencies in behavior verification tests

