"""Render original palette/layout design cards, not screenshots of WorkBuddy.

Requires Python 3 and Pillow. No network access, artwork or fonts are downloaded.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

manifest_path = Path(sys.argv[1])
theme = json.loads(manifest_path.read_text())
p = theme['palette']
image = Image.new('RGB', (1200, 750), p['canvas'])
draw = ImageDraw.Draw(image)
fonts = [Path('/System/Library/Fonts/Supplemental/Arial.ttf'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]
font_path = next((str(path) for path in fonts if path.exists()), None)

def font(size):
    return ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default(size=size)

def label(x, y, text, size=20, color=None):
    draw.text((x, y), text, fill=color or p['text'], font=font(size))

draw.rectangle((0, 0, 1200, 54), fill=p['surface'])
draw.line((0, 54, 1200, 54), fill=p['border'], width=2)
for x in (26, 48, 70):
    draw.ellipse((x, 22, x+10, 32), fill=p['accent'])
label(110, 17, 'WorkBuddy / 2ARAN MOOD EDITION', 18)
draw.rectangle((0, 55, 220, 750), fill=p['surface'])
draw.line((220, 55, 220, 750), fill=p['border'], width=2)
label(28, 90, 'W.', 42)
draw.rounded_rectangle((22, 174, 196, 220), radius=8, outline=p['border'], width=2)
label(35, 187, '+ New task', 18)
for index, text in enumerate(('WORKSPACE', 'My tasks', 'Skills', 'Files')):
    label(30, 260+index*52, text, 15 if index == 0 else 19, p['muted'] if index == 0 else p['text'])
label(28, 688, 'Made for your day.', 14, p['muted'])
label(255, 83, 'Your workspace', 18)
draw.ellipse((652, 180, 734, 262), fill=p['accent'])
label(680, 191, '~', 45, p['surface'])
label(552, 292, theme['id'].upper().replace('2ARAN-', ''), 42)
label(516, 356, 'GOOD MOOD, GOOD WORK.', 18, p['muted'])
draw.rounded_rectangle((348, 430, 1040, 536), radius=14, fill=p['surface'], outline=p['border'], width=2)
label(374, 466, 'What would you like to work on?', 21, p['muted'])
draw.rounded_rectangle((978, 458, 1020, 500), radius=8, fill=p['accent'])
label(992, 465, '^', 23, p['surface'])
for x, text in ((444, 'Write'), (604, 'Organize'), (764, 'Create')):
    draw.rounded_rectangle((x, 560, x+128, 600), radius=6, outline=p['border'])
    label(x+20, 569, text, 16)
label(250, 695, 'DESIGN PREVIEW / NOT AN APP SCREENSHOT', 17, p['muted'])
image.save(manifest_path.parent / 'preview.png', optimize=True)
