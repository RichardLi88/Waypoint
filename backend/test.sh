#!/bin/bash

# Variables
URL="http://waypoint.docker.localhost/api/auth"
USERNAME="admin_alice"
PASSWORD="admin123"

# Make the curl request
ACCESS_TOKEN_ADMIN=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"username": "'"$USERNAME"'", "password": "'"$PASSWORD"'"}' | jq -r .accessToken) 

ACCESS_TOKEN_DEV=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{"username": "'"$USERNAME"'", "password": "'"$PASSWORD"'"}' | jq -r .accessToken) 

echo "Access Token is: $ACCESS_TOKEN_ADMIN"

# ID=$(curl -s -X GET "http://waypoint.docker.localhost/api/projects/1/tasks" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $ACCESS_TOKEN_ADMIN" | jq -r ".[2]._id")

# echo "ID is: $ID"

curl -X PATCH "http://waypoint.docker.localhost/api/users/admin_alice/password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN_ADMIN"
  
# curl -X POST "http://waypoint.docker.localhost/api/projects/1/tasks/$ID/worklog" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" \
#   -d '{"time": "3600000"}'

# curl -s -X GET "http://waypoint.docker.localhost/api/projects/1/tasks" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r ".[2]"


# curl -s -X GET "http://waypoint.docker.localhost/api/projects/1/tasks/1" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# curl -s -X GET "http://waypoint.docker.localhost/api/projects/1/tasks/1" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# curl -s -X PATCH "http://waypoint.docker.localhost/api/projects/1/tasks/1" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bear $ACCESS_TOKEN" \
#   -d '{"status": "completed", "description": "test"}' | jq .