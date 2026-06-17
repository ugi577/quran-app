import json, os, sys

data_dir = "assets/gt.r/data"
out_dir  = "assets/gt.r/data/pg"
os.makedirs(out_dir, exist_ok=True)

pages = {}  # page_num -> [entry, ...]

for sn in range(1, 115):
    pad = "00" if sn < 10 else "0" if sn < 100 else ""
    with open(f"{data_dir}/s{pad}{sn}.json", encoding="utf-8") as f:
        surah = json.load(f)

    surah_ar = surah["ar"]
    seen_pages = set()  # pages where we already added ar for this surah

    for ayat in surah["ayat"]:
        p = ayat["p"]
        if p not in pages:
            pages[p] = []

        entry = {"s": sn, "n": ayat["n"], "t": ayat["t"], "j": ayat["j"]}

        # ar hanya pada kemunculan pertama surah di halaman ini
        if p not in seen_pages:
            entry["ar"] = surah_ar
            seen_pages.add(p)

        pages[p].append(entry)

# Tulis 604 file
written = 0
for pn in range(1, 605):
    pad = "00" if pn < 10 else "0" if pn < 100 else ""
    entries = pages.get(pn, [])
    path = f"{out_dir}/p{pad}{pn}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=True, separators=(",", ":"))
    written += 1

print(f"Ditulis: {written} file halaman")
print(f"Halaman ada data: {len(pages)}")

# Verifikasi sampel
for pn in [1, 2, 49, 50, 604]:
    pad = "00" if pn < 10 else "0" if pn < 100 else ""
    with open(f"{out_dir}/p{pad}{pn}.json") as f:
        d = json.load(f)
    size = os.path.getsize(f"{out_dir}/p{pad}{pn}.json")
    print(f"  p{pn:03d}: {len(d)} ayat, {size} bytes, surah={d[0]['s']} ayat={d[0]['n']}")
