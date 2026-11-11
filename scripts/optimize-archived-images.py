"""Optional one-time lossless PNG to WebP conversion (requires Pillow)."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
from io import BytesIO
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FILE = ROOT / 'assets/localized/manifest.json'
manifest = json.loads(FILE.read_text())
sources = sorted({r['path'] for r in manifest.values() if r['path'].endswith('.png') and r['bytes'] > 250_000})


def convert(source):
    file = ROOT / source
    with Image.open(file) as image:
        if getattr(image, 'is_animated', False):
            return None
        image = image.convert('RGBA') if 'A' in image.getbands() else image.convert('RGB')
        output = BytesIO()
        image.save(output, format='WEBP', lossless=True, exact=True, method=4)
        data = output.getvalue()
        if len(data) >= file.stat().st_size:
            return None
        # Verify pixel equality before accepting the replacement.
        with Image.open(BytesIO(data)) as decoded:
            assert decoded.convert(image.mode).tobytes() == image.tobytes(), source
    digest = sha256(data).hexdigest()
    target = 'assets/localized/' + digest[:24] + '.webp'
    (ROOT / target).write_bytes(data)
    return source, {'path': target, 'bytes': len(data), 'sha256': digest, 'type': 'image/webp', 'lossless': True}


saved = 0
with ThreadPoolExecutor(max_workers=2) as pool:
    futures = [pool.submit(convert, source) for source in sources]
    for index, future in enumerate(as_completed(futures), 1):
        result = future.result()
        if result:
            source, record = result
            for url, old in list(manifest.items()):
                if old['path'] == source:
                    saved += old['bytes'] - record['bytes']
                    manifest[url] = {**record, 'originalSha256': old['sha256'], 'originalBytes': old['bytes']}
            FILE.write_text(json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + '\n')
            (ROOT / source).unlink()
        if index % 10 == 0:
            print(f'{index}/{len(sources)} images checked; saved {saved / 1024**2:.1f} MiB.', flush=True)
print(f'Finished lossless optimization; saved {saved / 1024**2:.1f} MiB.', flush=True)
