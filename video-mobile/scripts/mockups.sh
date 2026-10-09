#!/usr/bin/env bash
# Exporta os mockups (browser/celular com a página) em PNG transparente, 2x.
# Uso: bash scripts/mockups.sh   → out/mockups/<nome>.png
set -e
cd "$(dirname "$0")/.."
CH="${CHROME:-C:/Program Files/Google/Chrome/Application/chrome.exe}"
mkdir -p out/mockups
for n in sollevo-hero sollevo-servicos plathanus-hero plathanus-numeros cereja-bloom-hero cereja-bloom-musicas milvus-hero milvus-chatbot; do
  npx remotion still src/index.ts "mockup-$n" "out/mockups/$n.png" --image-format=png --scale=2 --browser-executable="$CH" --log=error
done
ls -la out/mockups
