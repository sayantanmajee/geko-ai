#!/bin/bash

BASE_URL="http://localhost:3001"

echo "=== Testing Auth Service ==="

# Register
echo -e "\n1. Register new user"
REGISTER=$(curl -s -X POST $BASE_URL/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123","tenantName":"Test Org"}')

echo "$REGISTER" | jq . 

ACCESS_TOKEN=$(echo "$REGISTER" | jq -r '.accessToken')
REFRESH_TOKEN=$(echo "$REGISTER" | jq -r '. refreshToken')

echo "Access Token: $ACCESS_TOKEN"
echo "Refresh Token: $REFRESH_TOKEN"

# Get profile
echo -e "\n2. Get profile (with token)"
curl -s -X GET $BASE_URL/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Refresh token
echo -e "\n3. Refresh token"
curl -s -X POST $BASE_URL/v1/auth/refresh \
  -H "Content-Type:  application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq . 

# Login
echo -e "\n4. Login"
curl -s -X POST $BASE_URL/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example. com","password":"TestPass123"}' | jq . 

# Health
echo -e "\n5. Health check"
curl -s $BASE_URL/health | jq .

echo -e "\n=== All tests completed ==="