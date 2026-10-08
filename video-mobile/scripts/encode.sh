#!/usr/bin/env bash
# Comprime out/master.mp4 para o site: MP4 (H.264) e WebM (VP9) em 2 passes + poster.
# Uso: bash scripts/encode.sh [kbps]   (padrão 1100 kbps ≈ 6,5 MB para 47s)
set -e
cd "$(dirname "$0")/.."
K=${1:-1100}
IN=out/master.mp4
cd out
ffmpeg -y -v error -i master.mp4 -an -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v ${K}k -pass 1 -passlogfile x264 -f mp4 NUL
ffmpeg -y -v error -i master.mp4 -an -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v ${K}k -pass 2 -passlogfile x264 -movflags +faststart joycombo-hero-mobile.mp4
ffmpeg -y -v error -i master.mp4 -an -c:v libvpx-vp9 -b:v $((K * 8 / 10))k -row-mt 1 -deadline good -cpu-used 2 -pass 1 -passlogfile vp9 -f webm NUL
ffmpeg -y -v error -i master.mp4 -an -c:v libvpx-vp9 -b:v $((K * 8 / 10))k -row-mt 1 -deadline good -cpu-used 2 -pass 2 -passlogfile vp9 joycombo-hero-mobile.webm
# poster: quadro do mural em movimento (o frame 0 é preto)
ffmpeg -y -v error -ss 1.5 -i master.mp4 -frames:v 1 -q:v 3 joycombo-hero-mobile-poster.jpg
rm -f x264*.log* vp9*.log*
ls -la joycombo-hero-mobile.*
