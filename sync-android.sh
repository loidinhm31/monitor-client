#!/bin/bash

# Get current directory
WSL_PROJECT_DIR=$(pwd)
WINDOWS_DEST_DIR="/mnt/d/WORKSPACE/monitor-client-android"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if source directories exist
check_source_dirs() {
    if [ ! -d "$WSL_PROJECT_DIR/android" ]; then
        echo -e "${RED}Error: Android directory does not exist: $WSL_PROJECT_DIR/android${NC}"
        echo -e "${YELLOW}Please make sure you're running this script from your project root directory${NC}"
        echo -e "${YELLOW}Current directory: $WSL_PROJECT_DIR${NC}"
        exit 1
    fi
    if [ ! -d "$WSL_PROJECT_DIR/node_modules/@capacitor" ]; then
        echo -e "${RED}Error: Capacitor modules not found in node_modules${NC}"
        echo -e "${YELLOW}Please make sure @capacitor is installed in your project${NC}"
        exit 1
    fi
}

# Function to create destination directories
create_dest_dirs() {
    local dirs=(
        "$WINDOWS_DEST_DIR/android"
        "$WINDOWS_DEST_DIR/node_modules/@capacitor"
    )

    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            if [ $? -ne 0 ]; then
                echo -e "${RED}Error: Could not create directory: $dir${NC}"
                exit 1
            fi
        fi
    done
}

# Function to sync directories
sync_directories() {
    echo -e "${YELLOW}Starting sync process...${NC}"

    # Using rsync for efficient copying
    if command -v rsync >/dev/null 2>&1; then
        # Sync Android directory
        echo -e "${YELLOW}Syncing Android directory...${NC}"
        rsync -av --progress \
            --exclude='.gradle/' \
            --exclude='build/' \
            --exclude='app/build/' \
            --exclude='.idea/' \
            --exclude='*.iml' \
            --exclude='.externalNativeBuild/' \
            --exclude='.cxx/' \
            --exclude='local.properties' \
            --exclude='*.hprof' \
            --exclude='.DS_Store' \
            --exclude='captures/' \
            "$WSL_PROJECT_DIR/android/" "$WINDOWS_DEST_DIR/android/"

        # Sync Capacitor modules
        echo -e "${YELLOW}Syncing Capacitor modules...${NC}"
        rsync -av --progress \
            --exclude='node_modules' \
            --exclude='.git' \
            --exclude='*.log' \
            "$WSL_PROJECT_DIR/node_modules/@capacitor/" "$WINDOWS_DEST_DIR/node_modules/@capacitor/"
    else
        # Fallback to cp if rsync is not available
        echo -e "${YELLOW}rsync not found, using cp command${NC}"
        cp -rf "$WSL_PROJECT_DIR/android"/* "$WINDOWS_DEST_DIR/android/"
        cp -rf "$WSL_PROJECT_DIR/node_modules/@capacitor"/* "$WINDOWS_DEST_DIR/node_modules/@capacitor/"
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Sync completed successfully!${NC}"

        # Ensure gradlew is executable
        if [ -f "$WINDOWS_DEST_DIR/android/gradlew" ]; then
            chmod +x "$WINDOWS_DEST_DIR/android/gradlew"
            echo -e "${GREEN}Made gradlew executable${NC}"
        fi

        # Create a new local.properties file for Windows
        if [ -n "$ANDROID_HOME" ]; then
            echo "Creating Windows-specific local.properties..."
            echo "sdk.dir=$ANDROID_HOME" > "$WINDOWS_DEST_DIR/android/local.properties"
        fi
    else
        echo -e "${RED}Error occurred during sync${NC}"
        exit 1
    fi
}

# Clean Windows directories before sync
clean_windows_dirs() {
    echo -e "${YELLOW}Cleaning Windows directories...${NC}"
    rm -rf "$WINDOWS_DEST_DIR/android/.gradle" 2>/dev/null
    rm -rf "$WINDOWS_DEST_DIR/android/build" 2>/dev/null
    rm -rf "$WINDOWS_DEST_DIR/android/app/build" 2>/dev/null
    rm -rf "$WINDOWS_DEST_DIR/android/.externalNativeBuild" 2>/dev/null
    rm -rf "$WINDOWS_DEST_DIR/android/.cxx" 2>/dev/null
    echo -e "${GREEN}Clean completed${NC}"
}

# Main execution
echo "WSL to Windows Android Directory Sync with Capacitor"
echo "=================================================="
echo "Project Source: $WSL_PROJECT_DIR"
echo "Destination: $WINDOWS_DEST_DIR"
echo "=================================================="

# List current directory contents
echo -e "${YELLOW}Current directory contents:${NC}"
ls -la

# Run checks and sync
check_source_dirs
create_dest_dirs
clean_windows_dirs
sync_directories

echo -e "${GREEN}Sync process completed successfully!${NC}"
echo "You can now open the project in Android Studio from: $WINDOWS_DEST_DIR/android"