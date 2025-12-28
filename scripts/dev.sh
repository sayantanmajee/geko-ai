#!/bin/bash

# Start databases
echo "🚀 Starting databases..."
docker-compose up -d postgres mongodb redis

# Wait for databases
sleep 5

# Start services in parallel (background)
echo "🚀 Starting GEKO-AI services..."

cd services/auth-service && pnpm dev &
AUTH_PID=$!

cd services/workspace-service && pnpm dev &
WORKSPACE_PID=$!

cd services/model-service && pnpm dev &
MODEL_PID=$! 

cd services/billing-service && pnpm dev &
BILLING_PID=$!

cd services/rbac-service && pnpm dev &
RBAC_PID=$!

cd services/memory-service && pnpm dev &
MEMORY_PID=$!

cd services/ai-gateway && pnpm dev &
GATEWAY_PID=$! 

echo ""
echo "✅ All services started!"
echo ""
echo "Service PIDs:"
echo "Auth:       $AUTH_PID"
echo "Workspace: $WORKSPACE_PID"
echo "Model:      $MODEL_PID"
echo "Billing:   $BILLING_PID"
echo "RBAC:      $RBAC_PID"
echo "Memory:    $MEMORY_PID"
echo "Gateway:   $GATEWAY_PID"
echo ""
echo "Stop all with:  pkill -f 'pnpm dev' && docker-compose down"