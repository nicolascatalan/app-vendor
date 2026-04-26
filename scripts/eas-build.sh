#!/bin/bash

# EAS Build Helper Script for PropPublish MVP 1
# Usage: ./scripts/eas-build.sh [command] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="PropPublish"
BUNDLE_ID_IOS="cl.propublish.app"
PACKAGE_ID_ANDROID="com.propublish.app"

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  if ! command -v eas &> /dev/null; then
    log_error "EAS CLI not found. Install with: npm install -g eas-cli"
    exit 1
  fi

  if ! command -v git &> /dev/null; then
    log_error "Git not found"
    exit 1
  fi

  # Check if logged in to EAS
  if ! eas whoami &> /dev/null; then
    log_warning "Not logged in to EAS. Running 'eas login'..."
    eas login
  fi

  log_success "All prerequisites met"
}

# Setup environment variables
setup_env() {
  log_info "Setting up environment variables..."

  if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    log_error "GOOGLE_MAPS_API_KEY not set"
    exit 1
  fi

  if [ -z "$ML_APP_ID" ]; then
    log_error "ML_APP_ID not set"
    exit 1
  fi

  if [ -z "$ML_APP_SECRET" ]; then
    log_error "ML_APP_SECRET not set"
    exit 1
  fi

  log_success "Environment variables configured"
}

# Build functions
build_dev() {
  log_info "Building development version..."
  setup_env
  eas build --platform ios --profile development
  log_success "Development build complete"
}

build_preview() {
  platform=$1
  log_info "Building preview for $platform..."
  setup_env
  
  if [ "$platform" = "all" ]; then
    eas build --platform all --profile preview
  else
    eas build --platform "$platform" --profile preview
  fi
  log_success "Preview build complete"
}

build_production() {
  platform=$1
  log_info "Building production for $platform..."
  setup_env
  
  if [ "$platform" = "all" ]; then
    eas build --platform all --profile production --wait
  else
    eas build --platform "$platform" --profile production --wait
  fi
  log_success "Production build complete"
}

# Test pre-build
pre_build_checks() {
  log_info "Running pre-build checks..."

  # Check version
  CURRENT_VERSION=$(grep '"version"' app.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
  log_info "Current version: $CURRENT_VERSION"

  # Run tests
  log_info "Running tests..."
  npm test -- --bail

  # TypeScript check
  log_info "Checking TypeScript..."
  npx tsc --noEmit

  log_success "All pre-build checks passed"
}

# Submit functions
submit_ios() {
  log_info "Submitting to App Store..."

  if [ -z "$APPLE_ID" ]; then
    log_error "APPLE_ID not set"
    exit 1
  fi

  if [ -z "$ASC_APP_PASSWORD" ]; then
    log_error "ASC_APP_PASSWORD not set (App-specific password from appleid.apple.com)"
    exit 1
  fi

  eas submit --platform ios --profile production
  log_success "iOS submission complete"
}

submit_android() {
  log_info "Submitting to Play Store..."

  if [ -z "$ANDROID_SERVICE_ACCOUNT_JSON" ]; then
    log_warning "ANDROID_SERVICE_ACCOUNT_JSON not set"
    log_info "Expected path: ~/.eas/android-service-account.json"
    export ANDROID_SERVICE_ACCOUNT_JSON="$HOME/.eas/android-service-account.json"
  fi

  if [ ! -f "$ANDROID_SERVICE_ACCOUNT_JSON" ]; then
    log_error "Service account JSON not found at $ANDROID_SERVICE_ACCOUNT_JSON"
    exit 1
  fi

  eas submit --platform android --profile production
  log_success "Android submission complete"
}

# Version bump
bump_version() {
  version=$1
  
  if [ -z "$version" ]; then
    log_error "Version not specified. Usage: $0 bump-version 1.0.1"
    exit 1
  fi

  log_info "Bumping version to $version..."
  
  # Update app.json
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/g" app.json
  
  # Increment iOS buildNumber
  CURRENT_BUILD=$(grep -A 5 '"ios"' app.json | grep '"buildNumber"' | sed 's/.*"buildNumber": "\([^"]*\)".*/\1/')
  NEW_BUILD=$((CURRENT_BUILD + 1))
  sed -i '' "s/\"buildNumber\": \"[^\"]*\"/\"buildNumber\": \"$NEW_BUILD\"/g" app.json
  
  # Increment Android versionCode
  CURRENT_CODE=$(grep -A 5 '"android"' app.json | grep '"versionCode"' | sed 's/.*"versionCode": \([^,]*\).*/\1/')
  NEW_CODE=$((CURRENT_CODE + 1))
  sed -i '' "s/\"versionCode\": [^,]*/\"versionCode\": $NEW_CODE/g" app.json
  
  log_success "Version bumped to $version (iOS build: $NEW_BUILD, Android code: $NEW_CODE)"
  
  # Git commit
  git add app.json
  git commit -m "chore: bump version to $version"
  log_success "Version committed to git"
}

# Status functions
list_builds() {
  log_info "Listing recent builds..."
  eas build:list --limit 10
}

view_build() {
  build_id=$1
  if [ -z "$build_id" ]; then
    log_error "Build ID not specified. Usage: $0 view-build <build-id>"
    exit 1
  fi
  eas build:view "$build_id"
}

download_build() {
  build_id=$1
  if [ -z "$build_id" ]; then
    log_error "Build ID not specified. Usage: $0 download-build <build-id>"
    exit 1
  fi
  
  output_dir="./builds/$build_id"
  mkdir -p "$output_dir"
  eas build:download "$build_id" --path "$output_dir"
  log_success "Build downloaded to $output_dir"
}

# Help
show_help() {
  cat << EOF
${BLUE}PropPublish EAS Build Helper${NC}

${YELLOW}Usage:${NC}
  $0 [command] [options]

${YELLOW}Commands:${NC}
  ${GREEN}build${NC}
    dev              Build development version
    preview [ios|android|all]
                     Build preview version (default: ios)
    prod [ios|android|all]
                     Build production version (default: ios)

  ${GREEN}submit${NC}
    ios              Submit iOS build to App Store
    android          Submit Android build to Play Store
    all              Submit both iOS and Android

  ${GREEN}version${NC}
    bump <version>   Bump app version (e.g., 1.0.1)

  ${GREEN}status${NC}
    list             List recent builds
    view <id>        View build details
    download <id>    Download build artifact

  ${GREEN}check${NC}
    pre-build        Run pre-build checks (tests, TypeScript)

${YELLOW}Examples:${NC}
  $0 build prod ios
  $0 submit all
  $0 version bump 1.0.1
  $0 status list

${YELLOW}Environment Variables:${NC}
  GOOGLE_MAPS_API_KEY        Required for building
  ML_APP_ID                  Required for building
  ML_APP_SECRET              Required for building
  APPLE_ID                   Required for iOS submission
  ASC_APP_PASSWORD           Required for iOS submission (app-specific)
  ANDROID_SERVICE_ACCOUNT_JSON
                             Required for Android submission

${YELLOW}Documentation:${NC}
  See EAS_BUILD_GUIDE.md for detailed instructions
EOF
}

# Main
main() {
  if [ $# -eq 0 ]; then
    show_help
    exit 0
  fi

  check_prerequisites

  case "$1" in
    build)
      case "$2" in
        dev)
          build_dev
          ;;
        preview)
          build_preview "${3:-ios}"
          ;;
        prod)
          build_production "${3:-ios}"
          ;;
        *)
          log_error "Unknown build type: $2"
          show_help
          exit 1
          ;;
      esac
      ;;
    
    submit)
      case "$2" in
        ios)
          submit_ios
          ;;
        android)
          submit_android
          ;;
        all)
          submit_ios
          submit_android
          ;;
        *)
          log_error "Unknown submit target: $2"
          show_help
          exit 1
          ;;
      esac
      ;;
    
    version)
      case "$2" in
        bump)
          bump_version "$3"
          ;;
        *)
          log_error "Unknown version command: $2"
          show_help
          exit 1
          ;;
      esac
      ;;
    
    status)
      case "$2" in
        list)
          list_builds
          ;;
        view)
          view_build "$3"
          ;;
        download)
          download_build "$3"
          ;;
        *)
          log_error "Unknown status command: $2"
          show_help
          exit 1
          ;;
      esac
      ;;
    
    check)
      case "$2" in
        pre-build)
          pre_build_checks
          ;;
        *)
          log_error "Unknown check command: $2"
          show_help
          exit 1
          ;;
      esac
      ;;
    
    help|-h|--help)
      show_help
      ;;
    
    *)
      log_error "Unknown command: $1"
      show_help
      exit 1
      ;;
  esac
}

main "$@"
