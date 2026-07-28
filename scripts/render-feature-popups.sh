#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/public/videos"
OUTPUT_FILE="$OUTPUT_DIR/plexus-feature-popups.mp4"
WORK_DIR="$(mktemp -d /tmp/plexus-popups.XXXXXX)"
SOURCE="$ROOT_DIR/public/app-future/relationship-journey-hero.png"
COPY_SVG="$ROOT_DIR/scripts/video-assets/feature-popups-copy.svg"

trap 'rm -rf "$WORK_DIR"' EXIT
mkdir -p "$OUTPUT_DIR"
sips -s format png "$COPY_SVG" --out "$WORK_DIR/copy.png" >/dev/null

# Four circular UI moments are lifted from the source artwork and animated
# forward in sequence. The dimmed base preserves the full relationship story.
ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -t 12 -i "$SOURCE" \
  -loop 1 -t 12 -i "$SOURCE" \
  -loop 1 -t 12 -i "$SOURCE" \
  -loop 1 -t 12 -i "$SOURCE" \
  -loop 1 -t 12 -i "$SOURCE" \
  -loop 1 -t 12 -i "$WORK_DIR/copy.png" \
  -f lavfi -i "sine=frequency=92:sample_rate=48000:duration=12" \
  -f lavfi -i "sine=frequency=184:sample_rate=48000:duration=12" \
  -f lavfi -i "sine=frequency=276:sample_rate=48000:duration=12" \
  -f lavfi -i "anoisesrc=color=pink:amplitude=0.012:sample_rate=48000:duration=12" \
  -filter_complex "
    [0:v]scale=2160:1080,crop=1920:1080:120:0,
      zoompan=z='min(1.035,1+0.00012*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=360:s=1920x1080:fps=30,
      drawbox=x=0:y=0:w=iw:h=ih:c=0x020713@0.22:t=fill[base];

    [1:v]crop=250:250:365:275,format=rgba,
      geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2),(W/2-5)*(W/2-5)),255,0)',
      zoompan=z='min(1.24,0.76+0.018*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=330:s=310x310:fps=30,
      fade=t=in:st=0:d=0.28:alpha=1,setpts=PTS+1.5/TB[p1];

    [2:v]crop=250:250:625:275,format=rgba,
      geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2),(W/2-5)*(W/2-5)),255,0)',
      zoompan=z='min(1.24,0.76+0.018*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=270:s=310x310:fps=30,
      fade=t=in:st=0:d=0.28:alpha=1,setpts=PTS+3.1/TB[p2];

    [3:v]crop=250:250:885:275,format=rgba,
      geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2),(W/2-5)*(W/2-5)),255,0)',
      zoompan=z='min(1.24,0.76+0.018*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=222:s=310x310:fps=30,
      fade=t=in:st=0:d=0.28:alpha=1,setpts=PTS+4.7/TB[p3];

    [4:v]crop=250:250:1145:275,format=rgba,
      geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-W/2)*(X-W/2)+(Y-H/2)*(Y-H/2),(W/2-5)*(W/2-5)),255,0)',
      zoompan=z='min(1.24,0.76+0.018*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=174:s=310x310:fps=30,
      fade=t=in:st=0:d=0.28:alpha=1,setpts=PTS+6.3/TB[p4];

    [5:v]format=rgba,fade=t=in:st=0.25:d=0.55:alpha=1[copy];
    [base][copy]overlay=0:0[tmp0];
    [tmp0][p1]overlay=345:327:eof_action=pass[tmp1];
    [tmp1][p2]overlay=630:327:eof_action=pass[tmp2];
    [tmp2][p3]overlay=915:327:eof_action=pass[tmp3];
    [tmp3][p4]overlay=1200:327:eof_action=pass,
      fade=t=in:st=0:d=0.35,fade=t=out:st=11.45:d=0.55[v];

    [6:a]volume=0.28[bass];
    [7:a]volume=0.09[mid];
    [8:a]volume=0.04[high];
    [9:a]highpass=f=1200,lowpass=f=6000,volume=0.22[air];
    [bass][mid][high][air]amix=inputs=4:normalize=0,
      afade=t=in:st=0:d=0.8,afade=t=out:st=11:d=1,
      alimiter=limit=0.82[a]" \
  -map "[v]" -map "[a]" -t 12 -r 30 \
  -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$OUTPUT_FILE"

printf '%s\n' "$OUTPUT_FILE"
