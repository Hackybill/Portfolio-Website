@echo off
echo Starting Website Backend...
echo.

echo 1. Setting up database...
node setup-database.js

echo.
echo 2. Starting backend server on port 5001...
node backend_server.js

pause