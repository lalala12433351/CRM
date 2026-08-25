#!/bin/bash
# Create 2GB swap file if not present to prevent npm install OOM memory stalls
if [ ! -f /var/swapfile ]; then
    sudo dd if=/dev/zero of=/var/swapfile bs=1M count=2048
    sudo chmod 600 /var/swapfile
    sudo mkswap /var/swapfile
    sudo swapon /var/swapfile
    echo "Swapfile created and activated successfully."
fi
