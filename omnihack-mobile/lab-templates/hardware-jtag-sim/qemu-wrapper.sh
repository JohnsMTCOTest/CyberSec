#!/bin/bash
SEED=${LAB_SEED:-deadbeef}
FLAG_FILE="/tmp/flag-${SEED}.txt"
echo "FLAG{JTAG_${SEED}}" > "$FLAG_FILE"
echo "Simulating QEMU board with seed ${SEED}" >&2
# Stub QEMU invocation - in production this would run qemu-system-arm -s -S ...
while true; do
  sleep 3600
done
