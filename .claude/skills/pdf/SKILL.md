---
name: pdf
description: Use this skill whenever the user wants to generate, read, or manipulate PDF files — booking confirmation PDFs, session receipts, earnings invoices, or combining/splitting documents. Triggers on: "PDF", ".pdf file", "booking receipt", "confirmation document", "invoice", "generate PDF".
---

# PDF Skill — Nail Salon Platform

## When to use
- `GET /sessions/:id/confirmation.pdf` — booking confirmation letter for client
- `GET /reports/master/me/invoice` — monthly earnings statement PDF
- `GET /reports/salon/:id/report.pdf` — salon analytics PDF report

## Libraries

```bash
pip install reportlab pypdf
# add to backend/requirements.txt
```

- **reportlab** — create PDFs from scratch (confirmations, receipts)
- **pypdf** — merge/split existing PDFs

## FastAPI streaming response pattern

```python
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import io

@router.get("/{session_id}/confirmation.pdf")
async def booking_confirmation_pdf(session_id: int, ...):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    story = build_confirmation_story(session, styles)
    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="confirmation-{session_id}.pdf"'},
    )
```

## Booking confirmation layout

```
[Salon Logo placeholder]
─────────────────────────────────────
        BOOKING CONFIRMATION
─────────────────────────────────────
Confirmation Code:   A1B2C3D4
Client:              Jane Doe
Service:             Manicure (60 min)
Master:              Anna K.
Date & Time:         March 15, 2026 at 10:00 AM
Salon:               My Nail Salon
Address:             123 Main St
Price:               $30.00
─────────────────────────────────────
Please arrive 5 minutes early.
Questions? Call us at +1 (555) 123-4567
```

## IMPORTANT: No Unicode sub/superscripts

Never use Unicode chars like ₀₁₂ or ⁰¹² in ReportLab — they render as black boxes.
Use XML tags in Paragraph objects instead: `<sub>2</sub>`, `<super>2</super>`.

## Styles

```python
styles = getSampleStyleSheet()
title_style = ParagraphStyle('Title', parent=styles['Heading1'],
    fontSize=20, textColor=colors.HexColor('#ec4899'), spaceAfter=12)
```

## Table styling (for data tables in PDF)

```python
table_style = TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#fce7f3')),  # pink header
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#831843')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fdf2f8')]),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f9a8d4')),
])
```

## File locations

```
backend/app/modules/sessions/router.py   # add /{id}/confirmation.pdf
backend/app/modules/sessions/services.py # add get_session_confirmation_pdf()
backend/app/modules/reports/router.py    # add /master/me/invoice PDF
```
