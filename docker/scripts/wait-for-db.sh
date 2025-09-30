
#!/bin/bash
# Wait for database to be ready before starting the application

set -e

host="$1"
port="$2"
user="$3"
shift 3
cmd="$@"

until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -p "$port" -U "$user" -c '\q'; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing command"
exec $cmd
