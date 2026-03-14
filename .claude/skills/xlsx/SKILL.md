---
name: xlsx
description: Use this skill any time a spreadsheet file is the primary input or output — creating Excel exports of salon/master reports, reading uploaded CSV schedules, or generating analytics workbooks. Triggers on: "export to Excel", "download report", "xlsx", "spreadsheet", "CSV export", ".xlsx file".
---

# XLSX / Spreadsheet Skill — Nail Salon Platform

## When to use
- Generating `GET /reports/salon/:id/export` Excel analytics workbook
- Generating `GET /reports/master/me/export` earnings export
- Reading CSV uploads (e.g. bulk service import)

## Libraries
- **pandas** — data manipulation and CSV/Excel read
- **openpyxl** — Excel formulas, styles, multiple sheets

```bash
pip install openpyxl pandas
# already in backend/requirements.txt
```

## FastAPI streaming response pattern

```python
from fastapi.responses import StreamingResponse
import io, openpyxl

@router.get("/salon/{salon_id}/export")
async def export_salon_report(...):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Summary"
    # ... fill cells ...
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="report.xlsx"'},
    )
```

## Styling conventions (financial reports)

| Data type | Format |
|-----------|--------|
| Currency | `"$#,##0.00"` |
| Percentage | `"0.0%"` |
| Date | `"YYYY-MM-DD"` |
| Input cells | Blue fill (`"4472C4"`) |
| Formula cells | Black text (default) |
| Header row | Bold, light gray fill |

## Salon report workbook structure

Sheet 1 — **Summary**: total revenue, sessions, avg ticket, top master
Sheet 2 — **Daily Earnings**: date, sessions, revenue (bar chart)
Sheet 3 — **Masters Breakdown**: each master row with sessions + earnings
Sheet 4 — **Services Breakdown**: per-service counts + revenue

## Master report workbook structure

Sheet 1 — **Summary**: total sessions, earnings, avg per session
Sheet 2 — **Daily Earnings**: date → earnings time series

## Never hardcode calculated values

Use Excel formulas so the workbook stays dynamic:
```python
ws["C2"] = "=SUM(C3:C100)"  # formula, not hardcoded Python sum
```

## Export endpoint location

```
backend/app/modules/reports/router.py
backend/app/modules/reports/services.py  # add export_salon_report_xlsx()
```
