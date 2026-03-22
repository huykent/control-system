#!/bin/bash

echo "=========================================="
echo "Starting LAN Control System"
echo "=========================================="

# Start backend in background
echo "Starting Backend on port 3000..."
npm run dev &
BACKEND_PID=$!

# Start frontend in background
echo "Starting Frontend on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Both services are running in the background."
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both child processes
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Wait for background jobs to keep the script running
wait
