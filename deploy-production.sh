#!/bin/bash

set -euo pipefail

# Ajusta estos valores antes del primer despliegue.
USER="jpcuencat"
SERVER="172.16.1.84"
REMOTE_PATH="/home/jpcuencat/dashboard-bibliotecas"
IMAGE_NAME="dashboard-bibliotecas-app:latest"
COMPOSE_FILE="docker-compose.prod.yml"
TUNNEL_CONTAINER_NAME="dashboard-bibliotecas-tunnel"

echo "Deploying dashboard to $SERVER..."

if [ ! -f "biblio_datos_limpios.csv" ]; then
  echo "Error: no se encontro biblio_datos_limpios.csv en este proyecto."
  exit 1
fi

echo "Creando directorio remoto si no existe..."
ssh "$USER@$SERVER" "mkdir -p '$REMOTE_PATH/.cache'"

echo "Transfiriendo archivos al servidor..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.cache' \
  . "$USER@$SERVER:$REMOTE_PATH"

echo "Conectando al servidor para construir y ejecutar..."
ssh "$USER@$SERVER" << EOF
  set -euo pipefail
  cd "$REMOTE_PATH"

  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker no esta instalado en el servidor."
    exit 1
  fi

  if [ ! -f "biblio_datos_limpios.csv" ]; then
    echo "Error: falta biblio_datos_limpios.csv en el servidor."
    exit 1
  fi

  mkdir -p .cache

  echo "Building Docker image..."
  if ! docker build --network=host -t "$IMAGE_NAME" .; then
    echo "Error: Docker build failed."
    exit 1
  fi

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
  echo "Application running at http://$SERVER:3001"
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
