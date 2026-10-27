"""Update resume PDF to match portfolio."""
import os
import sys

SRC = r"c:\Users\kaveh 9140202497\Downloads\kayhan-motaseb-resume.pdf"
OUT = r"C:\Users\kaveh 9140202497\Downloads\kayhan-motaseb-portfolio-with-campaignrider\editorial-ux-portfolio\assets\kayhan-resume.pdf"

REMOVE = ("Motaseb", "INSTAGRAM", "@Kay.kojaw")
REPLACE = {
    "Kaykxyzz@gmail.com": "kxy0kxy@gmail.com",
    "Kayhan Motaseb": "Kayhan",
    "KAYHAN MOTASEB  /  AI-DRIVEN UX DESIGN": "KAYHAN  /  AI-DRIVEN UX DESIGN",
    "03 YEARS": "04 YEARS",
    "03 YRS": "04 YRS",
}


def spans(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line["spans"]:
                out.append(span)
    return out


def find(spans, needle):
    for s in spans:
        if s["text"] == needle:
            return s
    for s in spans:
        if needle in s["text"]:
            return s
    return None


def insert_like(page, span, text, Rect):
    rect = Rect(span["bbox"])
    size = span["size"]
    color = span.get("color", 0)
    if isinstance(color, int):
        color = (
            ((color >> 16) & 255) / 255,
            ((color >> 8) & 255) / 255,
            (color & 255) / 255,
        )
    font = "hebo" if span.get("flags", 0) & 2 else "helv"
    page.insert_text(
        (rect.x0, rect.y1 - size * 0.22),
        text,
        fontsize=size,
        fontname=font,
        color=color,
    )


def main():
    try:
        import pymupdf as fitz
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf", "-q"])
        import pymupdf as fitz

    doc = fitz.open(SRC)
    page = doc[0]
    Rect = fitz.Rect
    all_spans = spans(page)
    inserts = []

    for old, new in REPLACE.items():
        s = find(all_spans, old)
        if not s:
            print("missing replace:", old)
            continue
        inserts.append((s, new))
        r = Rect(s["bbox"])
        page.add_redact_annot(Rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1))

    for old in REMOVE:
        s = find(all_spans, old)
        if not s:
            print("missing remove:", old)
            continue
        r = Rect(s["bbox"])
        page.add_redact_annot(Rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1))

    page.apply_redactions()

    for span, text in inserts:
        insert_like(page, span, text, Rect)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc.save(OUT, garbage=4, deflate=True)
    doc.close()
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
