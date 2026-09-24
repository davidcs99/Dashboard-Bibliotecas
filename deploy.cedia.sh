#!/bin/bash

set -euo pipefail

# Deployment script for the Dashboard Bibliotecas Virtuales server.
USER="ucacue"
SERVER="201.159.220.205"
SSH_PORT="22"
REMOTE_PATH="/home/ucacue/data-architecture/dashboard-bibliotecas-virtuales"
IMAGE_NAME="dashboard-bibliotecas-app:latest"
COMPOSE_FILE="docker-compose.prod.yml"
DATA_FILE="biblio_datos_limpios.csv"
TUNNEL_CONTAINER_NAME="dashboard-bibliotecas-tunnel"
APP_PORT="3001"

echo "Deploying Dashboard Bibliotecas Virtuales to $SERVER..."

if [ ! -f "$DATA_FILE" ]; then
  echo "Error: no se encontro $DATA_FILE en este proyecto."
  exit 1
fi

echo "Creando directorio remoto si no existe..."
ssh -p "$SSH_PORT" "$USER@$SERVER" "mkdir -p '$REMOTE_PATH/.cache'"

echo "Transfiriendo archivos al servidor..."
rsync -avz \
  -e "ssh -p $SSH_PORT" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.cache' \
  . "$USER@$SERVER:$REMOTE_PATH"

echo "Conectando al servidor para construir y ejecutar..."
ssh -p "$SSH_PORT" "$USER@$SERVER" \
  "REMOTE_PATH='$REMOTE_PATH' IMAGE_NAME='$IMAGE_NAME' COMPOSE_FILE='$COMPOSE_FILE' DATA_FILE='$DATA_FILE' TUNNEL_CONTAINER_NAME='$TUNNEL_CONTAINER_NAME' SERVER='$SERVER' APP_PORT='$APP_PORT' bash -s" << 'EOF'
  set -euo pipefail
  mkdir -p "$REMOTE_PATH"
  cd "$REMOTE_PATH"

  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker no esta instalado en el servidor."
    exit 1
  fi

  if [ ! -f "$DATA_FILE" ]; then
    echo "Error: falta $DATA_FILE en el servidor."
    exit 1
  fi

  mkdir -p .cache

  echo "Building Docker image..."
  if ! docker build --network=host -t "$IMAGE_NAME" .; then
    echo "Error: Docker build failed. Network issue possible."
    exit 1
  fi

  echo "Starting application with $COMPOSE_FILE..."
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
    docker compose -f "$COMPOSE_FILE" up -d
    docker compose -f "$COMPOSE_FILE" ps
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
    docker-compose -f "$COMPOSE_FILE" up -d
    docker-compose -f "$COMPOSE_FILE" ps
  else
    echo "Error: 'docker compose' ni 'docker-compose' estan instalados."
    exit 1
  fi

  echo "Deployment complete!"
  echo "Application running at http://$SERVER:$APP_PORT"
  echo "Getting public tunnel URL..."

  if timeout 90 bash -c '
    while true; do
      TUNNEL_URL=$(docker logs "'"$TUNNEL_CONTAINER_NAME"'" 2>&1 | grep -o "https://[A-Za-z0-9.-]*trycloudflare.com" | tail -n 1 || true)
      if [ -n "$TUNNEL_URL" ]; then
        echo "$TUNNEL_URL" > /tmp/dashboard_bibliotecas_tunnel_url.txt
        exit 0
      fi
      echo "Waiting for tunnel connection..."
      sleep 3
    done
  '; then
    echo "---------------------------------------------------"
    cat /tmp/dashboard_bibliotecas_tunnel_url.txt
    rm -f /tmp/dashboard_bibliotecas_tunnel_url.txt
    echo "---------------------------------------------------"
  else
    echo "Tunnel URL could not be obtained automatically."
    echo "Review logs with: docker logs $TUNNEL_CONTAINER_NAME --tail 100"
  fi
EOF
