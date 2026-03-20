# Bombadil Property-Based Testing Recipes
# These recipes mirror the GitHub Actions workflows

# Default recipe - show available recipes
default:
    @just --list

# Install bombadil binary (macOS arm64)
bombadil-install:
    #!/usr/bin/env fish
    set -l BOMBADIL_VERSION "v0.3.2"
    set -l BOMBADIL_URL "https://github.com/antithesishq/bombadil/releases/download/$BOMBADIL_VERSION/bombadil-aarch64-darwin"
    echo "Downloading Bombadil $BOMBADIL_VERSION..."
    curl -L -o bombadil $BOMBADIL_URL
    chmod +x bombadil
    mkdir -p ~/.local/bin
    mv ./bombadil ~/.local/bin/bombadil
    echo "Bombadil installed to ~/.local/bin/bombadil"
    echo "Ensure ~/.local/bin is in your PATH"

# Check if bombadil is installed
bombadil-check:
    #!/usr/bin/env fish
    if command -q bombadil
        bombadil --version
    else
        echo "Bombadil not found. Run: just bombadil-install"
        exit 1
    end

# Start dev server in background, wait for it to be ready
_start-dev:
    #!/usr/bin/env fish
    echo "Starting dev server..."
    pnpm dev &
    set -l DEV_PID $last_pid
    echo $DEV_PID > .dev-server.pid
    # Wait for server to be ready
    set -l MAX_ATTEMPTS 30
    set -l ATTEMPT 0
    while test $ATTEMPT -lt $MAX_ATTEMPTS
        if curl -s http://localhost:5173 > /dev/null 2>&1
            echo "Dev server ready on http://localhost:5173"
            exit 0
        end
        set ATTEMPT (math $ATTEMPT + 1)
        sleep 1
    end
    echo "Dev server failed to start"
    exit 1

# Stop dev server
_stop-dev:
    #!/usr/bin/env fish
    if test -f .dev-server.pid
        set -l PID (cat .dev-server.pid)
        kill $PID 2>/dev/null; or true
        rm .dev-server.pid
    end
    # Also kill any lingering vite processes
    pkill -f "vite dev" 2>/dev/null; or true

# Quick tests - mirrors bombadil-quick.yml (PRs)
# Runs core invariant tests in <2 minutes
bombadil-quick: _start-dev
    #!/usr/bin/env fish
    mkdir -p bombadil-results/quick
    echo "Running quick property tests..."

    set -l EXIT_CODE 0
    for spec in bombadil/specs/core/*.spec.ts
        echo "Testing: $spec"
        bombadil test http://localhost:5173 $spec \
            --max-steps 100 \
            --timeout 120 \
            --output-path ./bombadil-results/quick
        if test $status -ne 0
            set EXIT_CODE 1
        end
    end

    just _stop-dev

    echo ""
    echo "Quick tests complete. Results in bombadil-results/quick/"
    exit $EXIT_CODE

# Full test suite - mirrors bombadil-full.yml (main branch)
# Runs core + workflow tests (5-15 minutes)
bombadil-full: _start-dev
    #!/usr/bin/env fish
    mkdir -p bombadil-results/full
    echo "Running full property test suite..."

    set -l EXIT_CODE 0

    # Run core tests
    echo "=== Core Tests ==="
    for spec in bombadil/specs/core/*.spec.ts
        echo "Testing: $spec"
        bombadil test http://localhost:5173 $spec \
            --max-steps 200 \
            --timeout 180 \
            --output-path ./bombadil-results/full
        if test $status -ne 0
            set EXIT_CODE 1
        end
    end

    # Run workflow tests
    echo "=== Workflow Tests ==="
    for spec in bombadil/specs/workflows/*.spec.ts
        echo "Testing: $spec"
        bombadil test http://localhost:5173 $spec \
            --max-steps 500 \
            --timeout 600 \
            --output-path ./bombadil-results/full
        if test $status -ne 0
            set EXIT_CODE 1
        end
    end

    just _stop-dev

    echo ""
    echo "Full test suite complete. Results in bombadil-results/full/"
    exit $EXIT_CODE

# Exploratory tests - mirrors bombadil-nightly.yml
# Long-running chaos testing (default: 1 hour)
bombadil-explore duration="3600": _start-dev
    #!/usr/bin/env fish
    mkdir -p bombadil-results/explore
    echo "Running exploratory tests for {{duration}} seconds..."

    timeout {{duration}} bombadil test http://localhost:5173 \
        bombadil/specs/exploratory/*.spec.ts \
        --max-steps 10000 \
        --output-path ./bombadil-results/explore

    just _stop-dev

    echo ""
    echo "Exploratory tests complete. Results in bombadil-results/explore/"

# Run a single spec file
bombadil-spec spec: _start-dev
    #!/usr/bin/env fish
    mkdir -p bombadil-results/single
    echo "Running spec: {{spec}}"

    bombadil test http://localhost:5173 {{spec}} \
        --max-steps 200 \
        --timeout 300 \
        --output-path ./bombadil-results/single

    set -l EXIT_CODE $status
    just _stop-dev
    exit $EXIT_CODE

# Generate violation report from test results
bombadil-report:
    #!/usr/bin/env fish
    echo "=== Bombadil Test Results ==="
    echo ""

    for dir in bombadil-results/*/
        set -l dirname (basename $dir)
        echo "--- $dirname ---"

        if test -f $dir/trace.jsonl
            set -l violations (jq -rs '[.[] | select(.violations != [])] | length' $dir/trace.jsonl 2>/dev/null; or echo "0")
            set -l total (jq -rs 'length' $dir/trace.jsonl 2>/dev/null; or echo "0")
            echo "Total states: $total"
            echo "Violations: $violations"

            if test "$violations" != "0"
                echo "Violation URLs:"
                jq -r 'select(.violations != []) | .url' $dir/trace.jsonl 2>/dev/null
            end
        else
            echo "No results found"
        end
        echo ""
    end

# Check for any violations (returns exit code 1 if violations found)
bombadil-check-violations:
    #!/usr/bin/env fish
    set -l total_violations 0

    for dir in bombadil-results/*/
        if test -f $dir/trace.jsonl
            set -l violations (jq -rs '[.[] | select(.violations != [])] | length' $dir/trace.jsonl 2>/dev/null; or echo "0")
            set total_violations (math $total_violations + $violations)
        end
    end

    if test $total_violations -gt 0
        echo "Found $total_violations violations"
        exit 1
    else
        echo "No violations found"
        exit 0
    end

# Clean up test results
bombadil-clean:
    rm -rf bombadil-results/
    echo "Cleaned up bombadil-results/"

# Watch mode - continuously run quick tests on file changes
bombadil-watch:
    #!/usr/bin/env fish
    echo "Watching for changes... (Ctrl+C to stop)"
    while true
        just bombadil-quick
        echo ""
        echo "Waiting for changes..."
        # Use fswatch if available, otherwise sleep
        if command -q fswatch
            fswatch -1 bombadil/ src/
        else
            sleep 30
        end
    end
