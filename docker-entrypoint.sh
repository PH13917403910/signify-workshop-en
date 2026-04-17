#!/bin/sh
# Fix volume permissions for the nextjs user
chown -R nextjs:nodejs /app/data 2>/dev/null || true
exec su -s /bin/sh nextjs -c "node server.mjs"
