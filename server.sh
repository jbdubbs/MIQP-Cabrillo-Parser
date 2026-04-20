#!/usr/bin/env bash
# Usage: ./server.sh [start|stop|restart]

PORT=8080
PIDFILE=".server.pid"
DIR="$(cd "$(dirname "$0")" && pwd)"

start() {
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "Server already running (PID $(cat "$PIDFILE")) at http://localhost:$PORT"
    return 0
  fi
  python3 -m http.server "$PORT" --directory "$DIR" &>"$DIR/.server.log" &
  echo $! > "$PIDFILE"
  sleep 1
  if kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "Server started (PID $(cat "$PIDFILE")) at http://localhost:$PORT"
  else
    echo "Server failed to start. Check .server.log for details."
    rm -f "$PIDFILE"
    return 1
  fi
}

stop() {
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")"
    rm -f "$PIDFILE"
    echo "Server stopped."
  else
    echo "Server is not running."
    rm -f "$PIDFILE"
  fi
}

case "${1:-start}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; start ;;
  *)
    echo "Usage: $0 [start|stop|restart]"
    exit 1
    ;;
esac
