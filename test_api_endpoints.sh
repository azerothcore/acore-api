#!/bin/bash

BASE_URL="http://127.0.0.1/api"

ENDPOINTS=(
  "/characters/online"
  "/characters/stats"
  "/characters/search_characters"
  "/characters/battleground_deserters/1"
  "/characters/arena_team/id/1"
  "/characters/arena_team/type/2"
  "/characters/arena_team_member/1"
  "/characters/player_arena_team/1"
  "/characters/search/worldstates"
  "/characters/recoveryItemList/1"
  "/characters/recoveryHeroList"
  "/auth/logout"
  "/auth/pulse/7"
)

echo "🔍 Testing API endpoints on $BASE_URL"
echo "-----------------------------------------"

for endpoint in "${ENDPOINTS[@]}"
do
  full_url="${BASE_URL}${endpoint}"
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")
  echo "$full_url => HTTP $http_code"
done

echo "-----------------------------------------"
echo "✅ Test completed."
