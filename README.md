# ecommers-tests
This project was created to test different parts of it using different types of validations.

## Goal
1. Unit tests
2. Web tests
3. load tests
4. ordered tests
5. data-driven tests 
6. state verification 
7. behaviour verification
8. tests with mock objects
9. test-driven development

## Structure:
/backend   (NestJS)
/frontend  (React)
/load-tests (k6)

## Backend
It is nest.js basic project
### Entities:
- User
- Product
- Order

### Endpoints:
- POST /users
- POST /login (можна фейкову)
- GET /products
- POST /orders
- GET /orders/:id
- PATCH /orders/:id/status 


### Business logic:
- check product availability
- calculate total
- change statuses (created → paid → shipped)
- check user balance