#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/public/videos"
OUTPUT_FILE="$OUTPUT_DIR/plexus-introduction.mp4"
WORK_DIR="$(mktemp -d /tmp/plexus-intro.XXXXXX)"

trap 'rm -rf "$WORK_DIR"' EXIT
mkdir -p "$OUTPUT_DIR"

MATCH_PHONE="$ROOT_DIR/public/app-future/plexus-match-phone-transparent.png"
COMPANY_PHONE="$ROOT_DIR/public/app-future/company-brain-phone-transparent.png"
JOURNEY="$ROOT_DIR/public/app-future/relationship-journey-hero.png"
WORDMARK="$ROOT_DIR/public/plexus-wordmark-transparent.png"
COPY_DIR="$ROOT_DIR/scripts/video-assets"

for scene in 1 2 3 4 5; do
  sips -s format png "$COPY_DIR/scene${scene}-copy.svg" \
    --out "$WORK_DIR/scene${scene}-copy.png" >/dev/null
done

render_scene() {
  local output="$1"
  shift
  ffmpeg -hide_banner -loglevel error -y "$@" \
    -r 30 -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p \
    -movflags +faststart "$output"
}

# Scene 1: brand hook and hero reveal (4.8 s)
render_scene "$WORK_DIR/scene1.mp4" \
  -f lavfi -i "color=c=0x020817:s=1920x1080:d=4.8:r=30" \
  -loop 1 -t 4.8 -i "$MATCH_PHONE" \
  -loop 1 -t 4.8 -i "$WORK_DIR/scene1-copy.png" \
  -filter_complex "
    [0:v]drawgrid=w=120:h=120:t=1:c=0x1266aa@0.11,
      drawbox=x='960-520*t':y=539:w=1040:h=2:c=0x00a8ff@0.16:t=fill,
      drawbox=x=0:y=0:w=iw:h=ih:c=0x020817@0.16:t=fill[bg];
    [1:v]scale=700:-1,
      fade=t=in:st=0.25:d=0.8:alpha=1,
      zoompan=z='min(1.06,1+0.00042*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=144:s=700x1050:fps=30[phone];
    [2:v]format=rgba,fade=t=in:st=0.8:d=0.8:alpha=1[copy];
    [bg][phone]overlay=x='250+10*sin(t*1.2)':y='28+6*sin(t*1.5)':format=auto[tmp];
    [tmp][copy]overlay=0:0,fade=t=out:st=4.35:d=0.45[v]" \
  -map "[v]" -an -t 4.8

# Scene 2: Plexus Match (4.8 s)
render_scene "$WORK_DIR/scene2.mp4" \
  -f lavfi -i "color=c=0x030a18:s=1920x1080:d=4.8:r=30" \
  -loop 1 -t 4.8 -i "$MATCH_PHONE" \
  -loop 1 -t 4.8 -i "$WORK_DIR/scene2-copy.png" \
  -filter_complex "
    [0:v]drawgrid=w=140:h=140:t=1:c=0x168fd8@0.08,
      drawbox=x='-500+380*t':y=780:w=900:h=3:c=0x009dff@0.22:t=fill[bg];
    [1:v]scale=680:-1,zoompan=z='min(1.045,1+0.00032*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=144:s=680x1020:fps=30[phone];
    [2:v]format=rgba,fade=t=in:st=0.35:d=0.65:alpha=1[copy];
    [bg][phone]overlay=x=165:y='28+5*sin(t*1.4)':format=auto[tmp];
    [tmp][copy]overlay=0:0,fade=t=in:st=0:d=0.35,fade=t=out:st=4.35:d=0.45[v]" \
  -map "[v]" -an -t 4.8

# Scene 3: Company Brain (4.8 s)
render_scene "$WORK_DIR/scene3.mp4" \
  -f lavfi -i "color=c=0x030a18:s=1920x1080:d=4.8:r=30" \
  -loop 1 -t 4.8 -i "$COMPANY_PHONE" \
  -loop 1 -t 4.8 -i "$WORK_DIR/scene3-copy.png" \
  -filter_complex "
    [0:v]drawgrid=w=140:h=140:t=1:c=0x168fd8@0.08,
      drawbox=x='1900-370*t':y=778:w=900:h=3:c=0x009dff@0.22:t=fill[bg];
    [1:v]scale=680:-1,zoompan=z='min(1.045,1+0.00032*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=144:s=680x1020:fps=30[phone];
    [2:v]format=rgba,fade=t=in:st=0.35:d=0.65:alpha=1[copy];
    [bg][phone]overlay=x=1080:y='28+5*sin(t*1.35)':format=auto[tmp];
    [tmp][copy]overlay=0:0,fade=t=in:st=0:d=0.35,fade=t=out:st=4.35:d=0.45[v]" \
  -map "[v]" -an -t 4.8

# Scene 4: relationship journey (5.4 s)
render_scene "$WORK_DIR/scene4.mp4" \
  -loop 1 -t 5.4 -i "$JOURNEY" \
  -loop 1 -t 5.4 -i "$WORK_DIR/scene4-copy.png" \
  -filter_complex "
    [0:v]scale=1980:-1,
      zoompan=z='min(1.08,1+0.0005*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=162:s=1920x1080:fps=30,
      drawbox=x=0:y=0:w=iw:h=ih:c=0x020713@0.25:t=fill[bg];
    [1:v]format=rgba,fade=t=in:st=0.35:d=0.65:alpha=1[copy];
    [bg][copy]overlay=0:0,fade=t=in:st=0:d=0.4,fade=t=out:st=4.95:d=0.45[v]" \
  -map "[v]" -an -t 5.4

# Scene 5: clean brand end card (4.2 s)
render_scene "$WORK_DIR/scene5.mp4" \
  -f lavfi -i "color=c=0x020817:s=1920x1080:d=4.2:r=30" \
  -loop 1 -t 4.2 -i "$WORDMARK" \
  -loop 1 -t 4.2 -i "$WORK_DIR/scene5-copy.png" \
  -filter_complex "
    [0:v]drawgrid=w=120:h=120:t=1:c=0x168fd8@0.08,
      drawbox=x='960-420*t':y=545:w=840:h=2:c=0x1eb8ff@0.2:t=fill[bg];
    [1:v]scale=620:-1,fade=t=in:st=0.35:d=0.7:alpha=1[wordmark];
    [2:v]format=rgba,fade=t=in:st=0.9:d=0.7:alpha=1[copy];
    [bg][wordmark]overlay=x=(W-w)/2:y=300:format=auto[tmp];
    [tmp][copy]overlay=0:0,fade=t=out:st=3.8:d=0.4[v]" \
  -map "[v]" -an -t 4.2

cat > "$WORK_DIR/concat.txt" <<EOF
file '$WORK_DIR/scene1.mp4'
file '$WORK_DIR/scene2.mp4'
file '$WORK_DIR/scene3.mp4'
file '$WORK_DIR/scene4.mp4'
file '$WORK_DIR/scene5.mp4'
EOF

ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$WORK_DIR/concat.txt" \
  -f lavfi -i "sine=frequency=92:sample_rate=48000:duration=24" \
  -f lavfi -i "sine=frequency=184:sample_rate=48000:duration=24" \
  -f lavfi -i "anoisesrc=color=pink:amplitude=0.018:sample_rate=48000:duration=24" \
  -filter_complex "
    [1:a]volume=0.045[bass];
    [2:a]volume=0.014[tone];
    [3:a]highpass=f=900,lowpass=f=6500,volume=0.16[air];
    [bass][tone][air]amix=inputs=3:normalize=0,
      volume=8,
      afade=t=in:st=0:d=1.2,afade=t=out:st=22.8:d=1.2,
      alimiter=limit=0.8[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest \
  -movflags +faststart "$OUTPUT_FILE"

printf '%s\n' "$OUTPUT_FILE"
