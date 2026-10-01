#!/usr/bin/env python3
import sys, re
input_file = sys.argv[1]
try:
    with open(input_file, "r") as f: content = f.read()
    scrubbed = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "<REDACTED_EMAIL>", content)
    scrubbed = re.sub(r"\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}", "<REDACTED_PHONE>", scrubbed)
    with open("scrubbed_output.json", "w") as f: f.write(scrubbed)
    print("Anonymization complete.")
except Exception as e: exit(1)
