# v7 composite (runs in the Higgsfield sandbox): the AI staging shot (MiniMax H3, start = real empty photo,
# end = real staged photo) is time-remapped onto beats 4..10 and laid into the photo band of the rendered plate.
#   python3 tools_v7_composite.py <ai.mp4> <plate.mp4> <out.mp4>
import subprocess, sys, numpy as np
OFF, PER, FPS = 0.00149, 0.468752, 60
W, H = 1080, 1920
BX, BY, BW, BH = 0, 700, 1080, 731
# beat -> clip seconds; each piece lands on a half beat (same table as AIMAP in film.js)
AIMAP = [(4.0, 0.25), (6.0, 1.80), (6.5, 2.40), (7.0, 2.80), (7.5, 3.22), (8.0, 3.58), (8.5, 4.05), (9.0, 4.38), (9.5, 4.75), (10.0, 5.12)]
def clip_t(u):
    for (u0, c0), (u1, c1) in zip(AIMAP, AIMAP[1:]):
        if u <= u1: return c0 + (c1 - c0) * (u - u0) / (u1 - u0)
    return AIMAP[-1][1]
src, plate, out = sys.argv[1:4]
IN709 = 'scale=in_color_matrix=bt709:in_range=tv'
ai = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'{IN709}:w={BW + 9}:h={BH}:flags=lanczos,crop={BW}:{BH},format=rgb24',
                     '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
ai = np.frombuffer(ai, np.uint8).reshape(-1, BH, BW, 3).astype(np.float32)
NAI = len(ai)
dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', plate, '-vf', f'{IN709},format=rgb24', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        '-i', plate, '-map', '0:v', '-map', '1:a', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-colorspace', 'bt709',
                        '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'copy', '-movflags', '+faststart', out],
                       stdin=subprocess.PIPE)
FS = W * H * 3
f = 0
while True:
    buf = dec.stdout.read(FS)
    if len(buf) < FS: break
    u = (f / FPS + 0.5 / FPS - OFF) / PER
    if 4 <= u < 10:
        fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
        fi = clip_t(u) * 24.0
        i0 = min(max(int(np.floor(fi)), 0), NAI - 1); i1 = min(i0 + 1, NAI - 1); a = fi - np.floor(fi)
        band = ai[i0] * (1 - a) + ai[i1] * a
        s = int(round(22 * np.exp(-(u - 4) / 0.35)))          # the drop's RGB split, decaying
        if s >= 1:
            b2 = band.copy()
            b2[:, :-s, 0] = band[:, s:, 0]                    # red pulled left
            b2[:, s:, 1:] = band[:, :-s, 1:]                  # green/blue pushed right
            band = b2
        fr[BY:BY + BH, BX:BX + BW] = np.clip(band, 0, 255).astype(np.uint8)
        x = min(1.0, max(0.0, (u - 4) / 0.16)); fl = 0.6 * (1 - x) ** 3   # white flash on the cut
        if fl > 0.002:
            fr = (fr.astype(np.float32) * (1 - fl) + 255 * fl).astype(np.uint8)
        buf = fr.tobytes()
    enc.stdin.write(buf)
    f += 1
enc.stdin.close(); enc.wait(); dec.wait()
print('frames', f, 'ai frames', NAI, '->', out)
