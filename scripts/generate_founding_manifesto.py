from pathlib import Path
from textwrap import wrap

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "AORB_Founding_Manifesto.pdf"

W, H = A4
M = 52
BLACK = HexColor("#0A0A0D")
INK = HexColor("#17171C")
MUTED = HexColor("#666670")
PAPER = HexColor("#F7F6F2")
VIOLET = HexColor("#7C3AED")
PALE = HexColor("#ECE7FF")

pdfmetrics.registerFont(TTFont("AORB", "/System/Library/Fonts/Supplemental/Arial.ttf"))
pdfmetrics.registerFont(TTFont("AORB-Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("AORB-Black", "/System/Library/Fonts/Supplemental/Arial Black.ttf"))


def lines_for(text, font, size, width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def paragraph(c, text, x, y, width, size=10.6, leading=15.2, color=INK, font="AORB"):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines_for(text, font, size, width):
        c.drawString(x, y, line)
        y -= leading
    return y


def label(c, text, x, y, color=VIOLET):
    c.setFillColor(color)
    c.setFont("AORB-Bold", 8.2)
    c.drawString(x, y, text.upper())


def heading(c, text, x, y, width, size=26, color=BLACK):
    c.setFillColor(color)
    c.setFont("AORB-Black", size)
    for line in lines_for(text, "AORB-Black", size, width):
        c.drawString(x, y, line)
        y -= size * 1.05
    return y


def footer(c, page):
    c.setStrokeColor(HexColor("#D9D7D1"))
    c.setLineWidth(0.5)
    c.line(M, 35, W - M, 35)
    c.setFont("AORB-Bold", 7.6)
    c.setFillColor(MUTED)
    c.drawString(M, 21, "AORB - ALLIANCE OF REBELS EUROPE")
    c.drawRightString(W - M, 21, f"FOUNDING MANIFESTO  /  {page:02d}")


def new_page(c, page, section):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    label(c, section, M, H - 42)
    footer(c, page)


def commitment(c, number, title, body, x, y, width):
    c.setFillColor(PALE)
    c.roundRect(x, y - 22, 33, 22, 4, fill=1, stroke=0)
    c.setFillColor(VIOLET)
    c.setFont("AORB-Bold", 10)
    c.drawCentredString(x + 16.5, y - 15, f"{number:02d}")
    c.setFillColor(BLACK)
    c.setFont("AORB-Bold", 11.5)
    c.drawString(x + 44, y - 15, title)
    y = paragraph(c, body, x + 44, y - 34, width - 44, size=9.2, leading=12.6, color=INK)
    return y - 18


def principle(c, title, body, x, y, width):
    c.setFillColor(VIOLET)
    c.circle(x + 4, y - 5, 3.2, fill=1, stroke=0)
    c.setFillColor(BLACK)
    c.setFont("AORB-Bold", 11.5)
    c.drawString(x + 17, y, title)
    y = paragraph(c, body, x + 17, y - 18, width - 17, size=9.4, leading=13.2, color=MUTED)
    return y - 16


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("AORB - Founding Manifesto")
    c.setAuthor("Alliance of Rebels Europe")
    c.setSubject("Public founding manifesto of the Alliance of Rebels Europe")
    c.setKeywords("AORB, Alliance of Rebels Europe, Europe, manifesto, democracy")

    # Cover
    c.setFillColor(BLACK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(VIOLET)
    c.rect(0, H - 13, W, 13, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("AORB-Black", 28)
    c.drawString(M, H - 86, "AORB.")
    c.setFont("AORB-Bold", 10)
    c.setFillColor(HexColor("#B8B8C2"))
    c.drawString(M, H - 109, "ALLIANCE OF REBELS EUROPE")
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("AORB-Black", 47)
    c.drawString(M, H - 255, "FOUNDING")
    c.drawString(M, H - 307, "MANIFESTO")
    c.setFillColor(VIOLET)
    c.rect(M, H - 337, 77, 5, fill=1, stroke=0)
    y = paragraph(c, "A democratic political movement for the generation that will inherit what comes next.", M, H - 385, 390, size=16, leading=22, color=HexColor("#F4F4F7"), font="AORB-Bold")
    y -= 32
    paragraph(c, "Rebellion is the courage to reject what no longer works - and the discipline to construct something better.", M, y, 410, size=11.5, leading=17, color=HexColor("#B8B8C2"))
    c.setFont("AORB-Bold", 8.5)
    c.setFillColor(HexColor("#8D8D98"))
    c.drawString(M, 55, "PUBLIC EDITION  /  2026")
    c.drawRightString(W - M, 55, "AORB.EU")
    c.showPage()

    # Preamble
    new_page(c, 2, "01 / Why we exist")
    y = heading(c, "Europe must evolve.", M, H - 105, W - 2 * M, 30)
    y -= 18
    y = paragraph(c, "Europe was designed for another era. Decisions affecting millions are too often distant, slow and difficult to understand. Meanwhile, the cost of living rises, housing becomes unreachable, technology concentrates power and confidence in democracy weakens.", M, y, W - 2 * M, size=13, leading=19, font="AORB-Bold")
    y -= 21
    y = paragraph(c, "The Alliance of Rebels Europe exists to challenge this stagnation through peaceful democratic participation, public experimentation and measurable reform.", M, y, W - 2 * M, size=11, leading=16)
    y -= 26
    c.setFillColor(PALE)
    c.roundRect(M, y - 116, W - 2 * M, 116, 8, fill=1, stroke=0)
    label(c, "Our purpose", M + 22, y - 25)
    paragraph(c, "Redesign Europe so democratic power, prosperity and technological progress serve people.", M + 22, y - 55, W - 2 * M - 44, size=18, leading=23, color=BLACK, font="AORB-Bold")
    y -= 152
    label(c, "Our position", M, y)
    y -= 29
    y = paragraph(c, "We are not rebelling against Europe. We are rebelling for the Europe that has not yet been built.", M, y, W - 2 * M, size=20, leading=26, color=VIOLET, font="AORB-Bold")
    y -= 24
    paragraph(c, "Our rebellion is constructive: fearless in ambition, democratic in method and accountable in practice.", M, y, W - 2 * M, size=11, leading=16)
    c.showPage()

    # Principles
    new_page(c, 3, "02 / Democratic principles")
    y = heading(c, "The standards we hold ourselves to.", M, H - 105, W - 2 * M, 27)
    y -= 24
    items = [
        ("Human dignity", "Every person has equal worth. Politics must improve daily life without turning people into enemies or abstractions."),
        ("Democratic power", "Public authority must be understandable, accountable and open to meaningful participation between elections."),
        ("Freedom and pluralism", "Civil liberties, equality before the law and peaceful disagreement are foundations, not inconveniences."),
        ("Transparency", "Political funding, lobbying, evidence, public contracts and conflicts of interest must be visible to the public."),
        ("Intergenerational justice", "Decisions must account for the debt, climate, infrastructure and institutions inherited by future generations."),
        ("Evidence and revision", "We will publish assumptions, measure outcomes and change policies that do not work."),
    ]
    for title, body in items:
        y = principle(c, title, body, M, y, W - 2 * M)
    c.showPage()

    # Commitments 1-5
    new_page(c, 4, "03 / Ten commitments")
    y = heading(c, "A democratic reconstruction agenda.", M, H - 105, W - 2 * M, 26)
    y -= 22
    items = [
        (1, "Democracy people can control", "Public decisions must be transparent, understandable and accountable. People need meaningful ways to participate between elections."),
        (2, "A dignified life for everyone", "Housing, healthcare, education, food, energy and mobility must remain accessible. Progress means little when ordinary life becomes unaffordable."),
        (3, "Government without hidden influence", "Political funding, lobbying and public contracts must be radically transparent. Corruption and conflicts of interest require real consequences."),
        (4, "A fair economy", "Work should provide dignity, security and fair compensation. Economic rules should reward productive contribution and prevent extreme concentrations of power."),
        (5, "Housing is a foundation", "Europe needs more affordable homes, stronger protection against exploitation and policies that discourage residential property being held empty for speculation."),
    ]
    for n, title, body in items:
        y = commitment(c, n, title, body, M, y, W - 2 * M)
    c.showPage()

    # Commitments 6-10
    new_page(c, 5, "03 / Ten commitments")
    y = heading(c, "Freedom, capability and responsibility.", M, H - 105, W - 2 * M, 26)
    y -= 22
    items = [
        (6, "Technology under democratic control", "AI and digital platforms must serve human freedom. People should control their data, understand automated decisions and benefit from effective public digital infrastructure."),
        (7, "Education for a changing world", "Education must remain accessible throughout life. It should cultivate creativity, practical capability, critical thinking and democratic understanding."),
        (8, "Climate action that improves daily life", "The ecological transition must produce cleaner cities, reliable transport, resilient energy and skilled employment, with costs and benefits distributed fairly."),
        (9, "A Europe that protects freedom", "Europe must defend human dignity, civil liberties, equality before the law and the right to disagree peacefully. Security cannot excuse permanent surveillance."),
        (10, "Responsibility to the future", "Political decisions must account for long-term effects on public debt, climate, infrastructure, technology and social stability."),
    ]
    for n, title, body in items:
        y = commitment(c, n, title, body, M, y, W - 2 * M)
    c.showPage()

    # Method and safeguards
    new_page(c, 6, "04 / Our method")
    y = heading(c, "Rebellion with a democratic method.", M, H - 105, W - 2 * M, 27)
    y -= 18
    paragraph(c, "AORB will organize peacefully, participate democratically, publish the evidence behind its proposals and measure their results.", M, y, W - 2 * M, size=11, leading=16)
    y -= 67
    methods = [
        ("01", "Participate", "Shape proposals through peaceful democratic action."),
        ("02", "Publish", "Share evidence, assumptions and funding openly."),
        ("03", "Measure", "Track outcomes with clear public data."),
        ("04", "Revise", "Change what fails. Improve what works."),
    ]
    col_w = (W - 2 * M - 14) / 2
    for i, (num, title, body) in enumerate(methods):
        col, row = i % 2, i // 2
        x = M + col * (col_w + 14)
        yy = y - row * 108
        c.setFillColor(PALE)
        c.roundRect(x, yy - 88, col_w, 88, 7, fill=1, stroke=0)
        label(c, num, x + 17, yy - 21)
        c.setFillColor(BLACK)
        c.setFont("AORB-Bold", 13)
        c.drawString(x + 17, yy - 43, title)
        paragraph(c, body, x + 17, yy - 61, col_w - 34, size=8.8, leading=12, color=MUTED)
    y -= 243
    label(c, "Democratic safeguards", M, y)
    y -= 26
    safeguards = "We reject political violence, hate, dehumanization, corruption and authoritarian rule. We defend pluralism, peaceful opposition, independent institutions, honest elections, equal protection under the law and transparent public finance."
    y = paragraph(c, safeguards, M, y, W - 2 * M, size=10.5, leading=15.2)
    y -= 24
    c.setStrokeColor(VIOLET)
    c.setLineWidth(3)
    c.line(M, y + 8, M, y - 62)
    paragraph(c, "Power must always remain accountable to the people it serves.", M + 18, y, W - 2 * M - 18, size=17, leading=22, color=BLACK, font="AORB-Bold")
    c.showPage()

    # Declaration
    new_page(c, 7, "05 / Founding declaration")
    y = heading(c, "Build the Europe that does not yet exist.", M, H - 112, W - 2 * M, 33)
    y -= 25
    y = paragraph(c, "We begin with a simple conviction: Europe can be more democratic, more just and more capable of protecting the future.", M, y, W - 2 * M, size=13, leading=19, font="AORB-Bold")
    y -= 22
    y = paragraph(c, "We invite people across Europe to question inherited systems, propose credible alternatives and take part in peaceful democratic reconstruction. The movement will be judged by the clarity of its commitments, the integrity of its conduct and the results it delivers.", M, y, W - 2 * M, size=11, leading=16)
    y -= 28
    c.setFillColor(BLACK)
    c.roundRect(M, y - 178, W - 2 * M, 178, 9, fill=1, stroke=0)
    label(c, "Our founding commitment", M + 24, y - 30, HexColor("#A78BFA"))
    paragraph(c, "We will be fearless about what must change, disciplined about what we propose and democratic in how we act.", M + 24, y - 67, W - 2 * M - 48, size=19, leading=26, color=HexColor("#FFFFFF"), font="AORB-Bold")
    y -= 218
    label(c, "Join the public conversation", M, y)
    y -= 30
    c.setFillColor(VIOLET)
    c.setFont("AORB-Black", 24)
    c.drawString(M, y, "AORB.EU")
    y -= 42
    paragraph(c, "This manifesto is a public statement of purpose. Country-level programmes, candidate selection and formal party documents must be developed transparently and in accordance with applicable democratic and electoral law.", M, y, W - 2 * M, size=8.7, leading=12.5, color=MUTED)
    c.showPage()

    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
