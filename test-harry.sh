#!/bin/bash
cd ~/dev/reseller-intel
rm -f harry/scan-state.json
python3 harry/scanner.py --batch
