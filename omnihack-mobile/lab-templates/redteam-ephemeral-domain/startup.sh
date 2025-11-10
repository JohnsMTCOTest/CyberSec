#!/bin/sh
PASS="${DOMAIN_PASS:-Password123!}"
echo "Booting simulated domain with password ${PASS}" > /var/log/domain.log
sleep infinity
