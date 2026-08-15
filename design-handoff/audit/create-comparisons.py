from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent
REFERENCE = ROOT / "claude-reference-2026-08-02"
CURRENT = ROOT / "claude-style-current-2026-08-02"


def compose(left_path: Path, right_path: Path, output_path: Path, left_label: str, right_label: str) -> None:
    left = Image.open(left_path).convert("RGB")
    right = Image.open(right_path).convert("RGB")
    if left.size != right.size:
        raise ValueError(f"Comparison inputs must share a viewport: {left.size} != {right.size}")

    label_height = 36
    gutter = 12
    canvas = Image.new("RGB", (left.width * 2 + gutter, left.height + label_height), "white")
    canvas.paste(left, (0, label_height))
    canvas.paste(right, (left.width + gutter, label_height))

    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, left.width, label_height), fill="#111827")
    draw.rectangle((left.width + gutter, 0, canvas.width, label_height), fill="#111827")
    draw.text((14, 11), left_label, fill="white")
    draw.text((left.width + gutter + 14, 11), right_label, fill="white")
    canvas.save(output_path)


compose(
    REFERENCE / "01-workbench-reference.png",
    CURRENT / "01-workbench.png",
    CURRENT / "compare-workbench-reference-current.png",
    "Claude Design reference — workbench",
    "Current implementation — workbench",
)

compose(
    REFERENCE / "02-strategy-reference.png",
    CURRENT / "03-strategy-top.png",
    CURRENT / "compare-strategy-reference-current.png",
    "Claude Design reference — strategy",
    "Current implementation — strategy",
)
