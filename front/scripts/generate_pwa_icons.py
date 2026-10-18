"""Render the existing book icon geometry to installable PNG sizes (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw

OUTPUT = Path(__file__).resolve().parent.parent / 'public' / 'icons'
OUTPUT.mkdir(parents=True, exist_ok=True)

def curve(start, first, second, end):
    return [tuple((1-t)**3 * start[i] + 3*(1-t)**2*t*first[i] + 3*(1-t)*t*t*second[i] + t**3*end[i] for i in (0, 1)) for t in (j / 80 for j in range(81))]

for name, size, maskable in [('app-192.png', 192, False), ('app-512.png', 512, False), ('apple-touch-icon.png', 180, False), ('app-maskable-512.png', 512, True)]:
    scale = 3
    canvas = Image.new('RGB', (512 * scale, 512 * scale), '#15161f')
    draw = ImageDraw.Draw(canvas)
    inset = 0 if maskable else 64
    draw.rounded_rectangle((inset*scale, inset*scale, (512-inset)*scale, (512-inset)*scale), radius=(0 if maskable else 96)*scale, fill='#3d3f72')
    book = curve((256, 173), (225, 147), (175, 141), (128, 159))
    book += [(128, 333)] + curve((128, 333), (175, 315), (225, 321), (256, 347))
    book += curve((256, 347), (287, 321), (337, 315), (384, 333))
    book += [(384, 159)] + curve((384, 159), (337, 141), (287, 147), (256, 173))
    draw.line([(round(x*scale), round(y*scale)) for x, y in book], fill='white', width=18*scale, joint='curve')
    draw.line((256*scale, 173*scale, 256*scale, 347*scale), fill='white', width=18*scale)
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(OUTPUT / name)
print('Generated four LifeHub install icons.')
