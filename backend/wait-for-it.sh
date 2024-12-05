#!/bin/sh
set -e

# Maximum number of retries
max_retries=30
retry_interval=2
current_try=1

echo "Waiting for PostgreSQL to be ready..."

while [ $current_try -le $max_retries ]
do
    if PGPASSWORD=postgres psql -h "postgres" -U "postgres" -c '\q' >/dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    fi

    echo "Attempt $current_try of $max_retries: PostgreSQL is not ready yet..."
    
    if [ $current_try -eq $max_retries ]; then
        echo "Error: PostgreSQL did not become ready in time"
        exit 1
    fi
    
    current_try=$((current_try + 1))
    sleep $retry_interval
done

echo "Starting application..."
exec "$@"