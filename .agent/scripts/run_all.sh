#!/bin/bash
for story in 17.6 17.7 17.10; do
  echo ">>> Story $story"
  rm -f _iwish-output/integrity-fails-*.json
  for phase in pre-code post-code review delivery; do
    echo "Running $phase for $story"
    python3 .agent/scripts/pipeline-integrity-runner.py --phase $phase --story $story
    if [ $? -ne 0 ]; then
       echo "FAILED $phase for $story"
       break
    fi
  done
done
