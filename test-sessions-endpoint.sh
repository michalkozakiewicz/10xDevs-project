#!/bin/bash

BASE_URL="http://localhost:4321"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}Testing POST /api/sessions endpoint${NC}"
echo -e "${CYAN}Development Mode (No Auth Required)${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Test 1: Create session with context
echo -e "${YELLOW}Test 1: Create session with context${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": "E-commerce platform using React and Node.js"}')

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
  echo -e "${GREEN}✅ SUCCESS (201)${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
  echo "$body"
fi
echo ""
echo -e "${GRAY}---${NC}"
echo ""

# Test 2: Create session with null context
echo -e "${YELLOW}Test 2: Create session with null context${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": null}')

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
  echo -e "${GREEN}✅ SUCCESS (201)${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
  echo "$body"
fi
echo ""
echo -e "${GRAY}---${NC}"
echo ""

# Test 3: Create session without context
echo -e "${YELLOW}Test 3: Create session without context (empty body)${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{}')

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "201" ]; then
  echo -e "${GREEN}✅ SUCCESS (201)${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
  echo "$body"
fi
echo ""
echo -e "${GRAY}---${NC}"
echo ""

# Test 4: Invalid payload - context as number
echo -e "${YELLOW}Test 4: Invalid payload - context as number${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": 123}')

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ SUCCESS (400 - validation error as expected)${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED - Expected 400, got HTTP $http_code${NC}"
  echo "$body"
fi
echo ""
echo -e "${GRAY}---${NC}"
echo ""

# Test 5: Invalid payload - context as array
echo -e "${YELLOW}Test 5: Invalid payload - context as array${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": ["test"]}')

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ SUCCESS (400 - validation error as expected)${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED - Expected 400, got HTTP $http_code${NC}"
  echo "$body"
fi
echo ""
echo -e "${GRAY}---${NC}"
echo ""

# Test 6: Invalid payload - context as boolean
echo -e "${YELLOW}Test 6: Invalid payload - context as boolean${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{"context": true}')

http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
  echo -e "${GREEN}✅ SUCCESS (400 - validation error as expected)${NC}"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
  echo -e "${RED}❌ FAILED - Expected 400, got HTTP $http_code${NC}"
  echo "$body"
fi
echo ""
echo -e "${GRAY}---${NC}"
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}All tests completed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "${NC}1. Check Supabase Dashboard → Table Editor → sessions${NC}"
echo -e "${NC}2. Verify all sessions have user_id = '00000000-0000-0000-0000-000000000001'${NC}"
echo -e "${NC}3. Check created_at and updated_at timestamps${NC}"
