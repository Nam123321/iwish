#!/bin/bash
# Script to generate Watchmen Keys

mkdir -p .agent/config
mkdir -p ~/.ssh

echo "[*] Generating Watchmen RSA Keys..."
echo "You will be prompted to enter a PASSPHRASE. This is your Admin password."

# Generate AES-encrypted private key
openssl genrsa -aes256 -out ~/.ssh/iwish_admin_key 4096

# Generate public key
openssl rsa -in ~/.ssh/iwish_admin_key -pubout -out .agent/config/watchmen-pub.pem

echo "[+] Keys generated!"
echo "Public Key: .agent/config/watchmen-pub.pem"
echo "Private Key: ~/.ssh/iwish_admin_key"
echo "Please commit .agent/config/watchmen-pub.pem to Git."
