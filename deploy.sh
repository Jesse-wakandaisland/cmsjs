#!/bin/bash

#############################################
# CMS.js Deployment Script
# Automated deployment for Docker Compose
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cmsjs"
FRONTEND_PORT=3000
POCKETBASE_PORT=8090

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║     CMS.js Deployment Script          ║"
    echo "╔════════════════════════════════════════╗"
    echo ""
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        echo "Install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    log_success "Docker is installed"

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        echo "Install Docker Compose from: https://docs.docker.com/compose/install/"
        exit 1
    fi
    log_success "Docker Compose is installed"

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        echo "Start Docker and try again"
        exit 1
    fi
    log_success "Docker daemon is running"
}

check_ports() {
    log_info "Checking if ports are available..."

    if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        log_warning "Port $FRONTEND_PORT is already in use"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Port $FRONTEND_PORT is available"
    fi

    if lsof -Pi :$POCKETBASE_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        log_warning "Port $POCKETBASE_PORT is already in use"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Port $POCKETBASE_PORT is available"
    fi
}

setup_environment() {
    log_info "Setting up environment..."

    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            log_success "Created .env from .env.example"
            log_warning "Please edit .env and set your credentials"
            read -p "Press enter to continue..."
        else
            log_warning "No .env.example found, skipping environment setup"
        fi
    else
        log_success ".env file exists"
    fi
}

stop_existing_containers() {
    log_info "Stopping existing containers..."

    if docker-compose ps -q 2>/dev/null | grep -q .; then
        docker-compose down
        log_success "Stopped existing containers"
    else
        log_info "No running containers found"
    fi
}

build_images() {
    log_info "Building Docker images..."
    echo ""

    local BUILD_ARGS=""

    if [ "$1" == "--no-cache" ]; then
        log_warning "Building without cache (clean build)"
        BUILD_ARGS="--no-cache"
    fi

    if docker-compose build $BUILD_ARGS; then
        log_success "Docker images built successfully"
    else
        log_error "Docker build failed"
        exit 1
    fi
}

start_services() {
    log_info "Starting services..."
    echo ""

    if docker-compose up -d; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
}

wait_for_health() {
    log_info "Waiting for services to be healthy..."

    local MAX_WAIT=60
    local COUNTER=0

    while [ $COUNTER -lt $MAX_WAIT ]; do
        if docker-compose ps | grep -q "healthy"; then
            log_success "Services are healthy"
            return 0
        fi

        echo -n "."
        sleep 1
        COUNTER=$((COUNTER + 1))
    done

    echo ""
    log_warning "Health check timeout (services may still be starting)"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        log_success "Containers are running"
    else
        log_error "Containers are not running"
        docker-compose ps
        exit 1
    fi

    # Test frontend
    sleep 2
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
        log_success "Frontend is responding on port $FRONTEND_PORT"
    else
        log_warning "Frontend is not responding yet (may still be starting)"
    fi

    # Test PocketBase
    if curl -s http://localhost:$POCKETBASE_PORT/api/health > /dev/null; then
        log_success "PocketBase is responding on port $POCKETBASE_PORT"
    else
        log_warning "PocketBase is not responding yet (may still be starting)"
    fi
}

show_status() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║        Deployment Summary              ║"
    echo "╠════════════════════════════════════════╣"
    echo ""

    docker-compose ps

    echo ""
    echo "Access URLs:"
    echo "  Frontend:         http://localhost:$FRONTEND_PORT"
    echo "  PocketBase Admin: http://localhost:$POCKETBASE_PORT/_/"
    echo "  PocketBase API:   http://localhost:$POCKETBASE_PORT/api/"
    echo ""
    echo "Useful commands:"
    echo "  View logs:        docker-compose logs -f"
    echo "  Stop services:    docker-compose down"
    echo "  Restart:          docker-compose restart"
    echo "  Rebuild:          ./deploy.sh --rebuild"
    echo ""
}

show_logs() {
    log_info "Showing recent logs..."
    echo ""
    docker-compose logs --tail=50
    echo ""
    log_info "Follow logs with: docker-compose logs -f"
}

cleanup() {
    log_warning "Cleaning up Docker resources..."

    docker-compose down -v
    docker system prune -f

    log_success "Cleanup complete"
}

# Main deployment flow
main() {
    print_header

    # Parse arguments
    CLEAN_BUILD=false
    SHOW_LOGS_FLAG=false
    DEV_MODE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-cache|--rebuild|--clean)
                CLEAN_BUILD=true
                shift
                ;;
            --logs)
                SHOW_LOGS_FLAG=true
                shift
                ;;
            --dev)
                DEV_MODE=true
                shift
                ;;
            --cleanup)
                cleanup
                exit 0
                ;;
            --help|-h)
                echo "Usage: ./deploy.sh [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --no-cache, --rebuild   Build without cache (clean build)"
                echo "  --dev                   Start in development mode with hot reload"
                echo "  --logs                  Show logs after deployment"
                echo "  --cleanup               Remove all containers and volumes"
                echo "  --help, -h              Show this help message"
                echo ""
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Run deployment steps
    check_dependencies
    check_ports
    setup_environment
    stop_existing_containers

    if [ "$CLEAN_BUILD" = true ]; then
        build_images --no-cache
    else
        build_images
    fi

    if [ "$DEV_MODE" = true ]; then
        log_info "Starting in development mode..."
        docker-compose --profile dev up -d
    else
        start_services
    fi

    wait_for_health
    verify_deployment
    show_status

    if [ "$SHOW_LOGS_FLAG" = true ]; then
        show_logs
    fi

    log_success "Deployment complete!"
    echo ""
}

# Handle Ctrl+C gracefully
trap 'echo ""; log_warning "Deployment interrupted"; exit 130' INT

# Run main function
main "$@"
