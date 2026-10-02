#!/usr/bin/env python3
"""media-bridge: download the media listed in requests/*.txt into out/.

Line formats:  "<name> <https url>"  or  "@manifest <https url>" (a JSON list of {"name", "url"}).
Only allow-listed hosts, https only, 40 MB per file; files already in out/ are skipped.
"""
import json
import pathlib
import urllib.parse
import urllib.request

ALLOWED = {
    "images.pexels.com",
    "images.unsplash.com",
    "orvionis.com",
    "www.orvionis.com",
    "d8j0ntlcm91z4.cloudfront.net",
    "d2ol7oe51mr4n9.cloudfront.net",
}
MAX_BYTES = 40 * 1024 * 1024
UA = "Mozilla/5.0 (compatible; orvionis-media-bridge/1.0)"


def fetch(url: str) -> tuple[bytes, str]:
    u = urllib.parse.urlparse(url)
    if u.scheme != "https" or (u.hostname or "") not in ALLOWED:
        raise ValueError(f"not allowed: {u.scheme}://{u.hostname}")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        data = r.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("file too large")
        return data, r.headers.get("Content-Type", "")


def safe(name: str) -> str:
    parts = [p for p in name.strip().replace("\\", "/").split("/") if p not in ("", ".", "..")]
    return "/".join(parts)


def main() -> None:
    out = pathlib.Path("out")
    out.mkdir(exist_ok=True)
    items: list[tuple[str, str]] = []
    for f in sorted(pathlib.Path("requests").glob("*.txt")):
        for raw in f.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            head, _, rest = line.partition(" ")
            rest = rest.strip()
            if head == "@manifest":
                data, _ = fetch(rest)
                items += [(str(i["name"]), str(i["url"])) for i in json.loads(data)]
            else:
                items.append((head, rest))
    ok = fail = 0
    for name, url in items:
        dst = out / safe(name)
        if dst.exists():
            continue
        try:
            data, ctype = fetch(url)
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(data)
            ok += 1
            print(f"ok   {name}  {len(data)} B  {ctype}")
        except Exception as e:  # keep going; the log says what failed
            fail += 1
            print(f"FAIL {name}  {url}  {e}")
    print(f"fetched {ok}, failed {fail}")


if __name__ == "__main__":
    main()
