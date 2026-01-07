# API cURL Commands

These commands assume the server is running on `http://localhost:8080`.

## Users API

### Create User
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "baseCurrency": "USD"
  }'
```

### Get All Users
```bash
curl -X GET http://localhost:8080/api/users
```

### Get Single User
Replace `:id` with actual user ID.
```bash
curl -X GET http://localhost:8080/api/users/1
```

---

## Expenses API

### Create Expense
**Note:** valid IDs for `userId` and `paymentMethodId` are required.
```bash
curl -X POST http://localhost:8080/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "paymentMethodId": 1,
    "amountOriginal": 150.50,
    "currencyOriginal": "USD",
    "amountConverted": 150.50,
    "expenseDate": "2023-10-27T10:00:00Z",
    "notes": "Lunch meeting",
    "categoryId": 1
  }'
```

### Get All Expenses
```bash
curl -X GET "http://localhost:8080/api/expenses?limit=10&offset=0"
```

### Get Single Expense
```bash
curl -X GET http://localhost:8080/api/expenses/1
```

### Update Expense (PATCH)
```bash
curl -X PATCH http://localhost:8080/api/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "amountOriginal": 175.00,
    "amountConverted": 175.00,
    "notes": "Updated lunch cost"
  }'
```

### Delete Expense
```bash
curl -X DELETE http://localhost:8080/api/expenses/1
```

---

## Categories API

### Create Category
```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Dining",
    "description": "Restaurants and food",
    "color": "#FF5733",
    "icon": "dining"
  }'
```

### Get Categories
```bash
curl -X GET "http://localhost:8080/api/categories?userId=1"
```

---

## People API

### Create Person
```bash
curl -X POST http://localhost:8080/api/people \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "John Smith",
    "relationshipType": "Friend",
    "notes": "College buddy"
  }'
```

### Get People
```bash
curl -X GET "http://localhost:8080/api/people?userId=1"
```

---

## Payment Methods API

### Create Payment Method
```bash
curl -X POST http://localhost:8080/api/payment-methods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Credit Card",
    "isSystem": true
  }'
```

### Get Payment Methods
```bash
curl -X GET http://localhost:8080/api/payment-methods
```

---

## Credit Cards API

### Create Credit Card
**Note:** Ensure `paymentMethodId` exists.
```bash
curl -X POST http://localhost:8080/api/credit-cards \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "paymentMethodId": 1,
    "cardName": "Chase Sapphire",
    "bankName": "Chase",
    "last4": "1234",
    "billingCycleStart": 1,
    "billingCycleEnd": 30
  }'
```

---

## Expense Apps API

### Create Expense App (Splitwise, etc.)
```bash
curl -X POST http://localhost:8080/api/expense-apps \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Splitwise",
    "description": "Shared expenses"
  }'
```

---

## Currencies API

### Create Currency
```bash
curl -X POST http://localhost:8080/api/currencies \
  -H "Content-Type: application/json" \
  -d '{
    "code": "EUR",
    "name": "Euro",
    "symbol": "€"
  }'
```

### Get Currencies
```bash
curl -X GET http://localhost:8080/api/currencies
```

---

## Expense Participants API

### Add Participant
```bash
curl -X POST http://localhost:8080/api/expense-participants \
  -H "Content-Type: application/json" \
  -d '{
    "expenseId": 1,
    "personId": 1,
    "shareAmount": 50.00,
    "isSettled": false
  }'
```

### Get Participants for Expense
```bash
curl -X GET "http://localhost:8080/api/expense-participants?expenseId=1"
```

---

## Monthly Notes API

### Create Note
```bash
curl -X POST http://localhost:8080/api/monthly-notes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "year": 2023,
    "month": 10,
    "notes": "High spending due to vacation"
  }'
```

---

## Settlements API

### Create Settlement
```bash
curl -X POST http://localhost:8080/api/settlements \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "fromPersonId": 1,
    "toPersonId": 2,
    "amount": 100.00,
    "settlementDate": "2023-11-01T12:00:00Z",
    "notes": "Paid back for tickets"
  }'
```

### Get Settlements
```bash
curl -X GET "http://localhost:8080/api/settlements?userId=1"
```

---

## Demo/Health Check

### Connection Check
```bash
curl -X GET http://localhost:8080/api/demo
```
