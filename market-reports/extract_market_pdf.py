"""
Pull the SCWMLS Housing Market Snapshot PDF into structured JSON.

One PDF = one area = one report month. Run it on each city PDF, review the JSON,
then push to Airtable.

    python extract_market_pdf.py "<path to pdf>" [--area "Madison"]
    python extract_market_pdf.py "<folder>" --all

Needs pdftotext (poppler) on PATH.
"""

import json
import os
import re
import subprocess
import sys

MONEY = re.compile(r"^\$[\d,]+$")
INTEGER = re.compile(r"^[\d,]+$")
DECIMAL = re.compile(r"^\d+\.\d+$")
PERCENT = re.compile(r"^-?[\d.]+%$")
YOY_PCT = re.compile(r"^(-?[\d.]+)% from previous year$")
YOY_NUM = re.compile(r"^(-?[\d.]+) from previous year$")
SNAPSHOT = re.compile(r"taken on:\s*([A-Z][a-z]{2} \d{1,2}, \d{4})")
ZIP_ROW = re.compile(r"^\d+\.\s*(\d{5})$")
ANY_INT = re.compile(r"^-?[\d,]+$")


def _is_pct_cell(tok):
    """A percent cell carries a % sign, or was truncated before reaching one."""
    return "%" in tok or tok.endswith("...")

MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]


def page_lines(pdf, page, layout=False):
    """Raw text of one page as a list of non-empty stripped lines."""
    cmd = ["pdftotext", "-f", str(page), "-l", str(page)]
    if layout:
        cmd.append("-layout")
    cmd += [pdf, "-"]
    out = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                         errors="replace").stdout
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def to_number(raw):
    """'$100,374,371' -> 100374371 ; '1.96' -> 1.96 ; '203' -> 203"""
    if raw is None:
        return None
    cleaned = raw.replace("$", "").replace(",", "").replace("%", "")
    try:
        return float(cleaned) if "." in cleaned else int(cleaned)
    except ValueError:
        return None


def find_stat(lines, label, valuepat, start=0):
    """
    Find `label` on its own line, take the next line matching `valuepat` as the
    value, and a following '... from previous year' line as the change.

    The dashboard repeats some labels as bare chart axis titles, so a label only
    counts when a matching value actually follows it.
    """
    def yoy_after(j):
        for k in range(j + 1, min(j + 3, len(lines))):
            m = YOY_PCT.match(lines[k])
            if m:
                return {"value": float(m.group(1)), "unit": "percent"}
            m = YOY_NUM.match(lines[k])
            if m:
                return {"value": float(m.group(1)), "unit": "absolute"}
        return None

    for i, line in enumerate(lines[start:], start=start):
        if line != label:
            continue
        window = range(i + 1, min(i + 4, len(lines)))
        # Preferred: the value sits alone on its own line.
        for j in window:
            if valuepat.match(lines[j]):
                return {"value": to_number(lines[j]), "raw": lines[j],
                        "yoy": yoy_after(j)}
        # Fallback: a chart bar label collided with the value on one line
        # (e.g. Dane County's '1,265 $469,900'). Only trust it when exactly
        # one token on the line can be the value.
        for j in window:
            toks = [t for t in lines[j].split() if valuepat.match(t)]
            if len(toks) == 1:
                return {"value": to_number(toks[0]), "raw": toks[0],
                        "yoy": yoy_after(j)}
    return None


def report_month(lines):
    """The closing month is printed as a bare month name on the stat pages."""
    for line in lines:
        if line in MONTHS:
            return line
    return None


def parse_monthly(pdf):
    """Page 1 (Sales & Pricing) and page 2 (Buyer Demand)."""
    p1 = page_lines(pdf, 1)
    p2 = page_lines(pdf, 2)
    return {
        "closing_month": report_month(p1),
        "sales_count": find_stat(p1, "# of Sales", INTEGER),
        "total_volume": find_stat(p1, "Total Volume", MONEY),
        "median_sale": find_stat(p1, "Median Sale", MONEY),
        "average_sale": find_stat(p1, "Average Sale", MONEY),
        "median_dom": find_stat(p1, "Median DOM", INTEGER),
        "avg_price_per_sqft": find_stat(p1, "$/Sqft (ave)", MONEY),
        "average_sqft": find_stat(p1, "Average Sqft", INTEGER),
        "average_dom": find_stat(p2, "Average DOM", INTEGER),
        "avg_pct_over_asking": find_stat(p2, "Average % Over Asking", PERCENT),
    }


def parse_inventory(pdf):
    """Page 3 (Inventory) headline numbers."""
    p3 = page_lines(pdf, 3)
    return {
        "months_of_supply": find_stat(p3, "Months of Supply", DECIMAL),
        "active_listings": find_stat(p3, "Active Listings Now", INTEGER),
        "pending_listings": find_stat(p3, "Pending Listings Now", INTEGER),
        "days_until_pending_median": find_stat(p3, "<Days Until Pending (med)", INTEGER),
        "average_asking_price": find_stat(p3, "Average Asking Price", MONEY),
        "new_listings": find_stat(p3, "# of New Listings", INTEGER),
        "new_pendings": find_stat(p3, "# of New Pendings", INTEGER),
    }


def parse_ytd(pdf):
    """Pages 4 and 5 (Yearly / year-to-date)."""
    p4 = page_lines(pdf, 4)
    p5 = page_lines(pdf, 5)
    return {
        "ytd_sales_count": find_stat(p4, "# of Sales", INTEGER),
        "ytd_total_volume": find_stat(p4, "Total Volume", MONEY),
        "ytd_median_sale": find_stat(p4, "Median Sale Price", MONEY),
        "ytd_average_sale": find_stat(p4, "Average Sale Price", MONEY),
        "ytd_new_listings": find_stat(p4, "New Listings Delivered", INTEGER),
        "ytd_median_dom": find_stat(p4, "Median Days on Market", INTEGER),
        "ytd_new_pendings": find_stat(p5, "New Pendings", INTEGER),
        "ytd_avg_pct_over_asking": find_stat(p5, "Average % Over Asking", PERCENT),
    }


def parse_supply_by_price(pdf):
    """
    Page 3's 'Months of Supply By Price Range' table.

    Ranges and supply figures each arrive on a single space-joined line. The
    Active Now / Ave #Sales per month figures arrive interleaved, one pair per
    bracket, with the grand total pair last.
    """
    lines = page_lines(pdf, 3)
    try:
        head = lines.index("Months of Supply By Price Range")
    except ValueError:
        return []

    ranges, supply = [], []
    for i in range(head, len(lines)):
        if lines[i] == "Asking Price" and not ranges:
            ranges = lines[i + 1].split()
        if lines[i] == "Months of Supply" and not supply and ranges:
            supply = [to_number(v) for v in lines[i + 1].split()]
        if ranges and supply:
            break
    if not ranges:
        return []

    pairs = []
    for i in range(head, len(lines)):
        if lines[i] == "Ave #Sales/Month (last 12 mo)":
            nums = []
            for ln in lines[i + 1:]:
                if INTEGER.match(ln):
                    nums.append(to_number(ln))
                elif nums:
                    break
            # The first bracket's 'Active Now' value sits just above the label.
            if INTEGER.match(lines[i - 1]):
                nums.insert(0, to_number(lines[i - 1]))
            pairs = list(zip(nums[0::2], nums[1::2]))
            break

    rows = []
    for idx, label in enumerate(ranges):
        if label in ("Grand", "total"):
            continue
        rows.append({
            "price_range": label,
            "months_of_supply": supply[idx] if idx < len(supply) else None,
            "active_now": pairs[idx][0] if idx < len(pairs) else None,
            "avg_sales_per_month": pairs[idx][1] if idx < len(pairs) else None,
        })
    return rows


def parse_zips(pdf):
    """
    Page 13 (Zip Code Comparison).

    Each dollar column arrives as one space-joined line holding one value per
    zip, in the same order the zip rows are listed.

    Do not cross-check this against `pdftotext -layout`: that view draws the
    number columns one row higher than their zip labels, which makes every row
    look shifted by one. The raw order is the correct one. Verified on Madison
    Sept 2026, where the 13 zip volumes sum to $98,332,371 against a city total
    of $100,374,371, the exact gap for the 5 of 203 sales with no zip listed.
    """
    lines = page_lines(pdf, 13)

    zips, sales = [], []
    for i, line in enumerate(lines):
        m = ZIP_ROW.match(line)
        if m and i + 1 < len(lines) and INTEGER.match(lines[i + 1]):
            zips.append(m.group(1))
            sales.append(to_number(lines[i + 1]))

    def column_values(prefix, pattern):
        """One value per zip, in zip order."""
        # Require a value immediately after the label so the map legend's
        # 'Median Sale (last 365 days) $350,000' caption cannot shadow the row.
        for line in lines:
            if line.startswith(prefix + " $"):
                toks = [t for t in line[len(prefix):].split() if pattern.match(t)]
                return [to_number(t) for t in toks]
        return []

    volume = column_values("Total Volume", MONEY)
    persqft = column_values("$/sqft", MONEY)
    median = column_values("Median Sale", MONEY)

    # The '%' lines carry the year-over-year change for the column above them,
    # in the same zip order. A token ending in '...' was visually truncated in
    # the export, so its digits cannot be trusted and it is dropped.
    def pct_after(anchor_prefix):
        for i, line in enumerate(lines):
            if line.startswith(anchor_prefix):
                for ln in lines[i + 1:]:
                    if ln.startswith("%") and not ln.startswith("% Over"):
                        return [None if t.endswith("...") else to_number(t)
                                for t in ln.lstrip("%").split()]
                    if ln.startswith("Median DOM"):
                        break
        return []

    sales_yoy = pct_after("Zip Code # of Sales")
    median_yoy, dom, over_asking = [], [], []
    for i, line in enumerate(lines):
        if not line.startswith("Median DOM"):
            continue
        # Values arrive as repeating [median YoY %, median DOM, DOM change].
        trailing = []
        for j in range(i + 1, len(lines)):
            # '% Over' also appears as a column header at the top of the page,
            # so index off the real position here, never lines.index().
            if lines[j].startswith("% Over"):
                # Unlike the DOM block above, this one is column-major: the
                # first N values are the figures themselves, and the remainder
                # is the year-over-year column.
                # The figures share the line with the label, then spill over
                # onto the following lines.
                toks = (lines[j][len("% Over"):].split()
                        + _flat(lines, j + 1))[:len(zips)]
                over_asking = [None if t.endswith("...") else to_number(t)
                               for t in toks]
                break
            trailing.append(lines[j])
        # Per zip the block holds [median YoY %] [median DOM] [DOM change], but
        # the first cell is sometimes omitted entirely rather than rendered as
        # "-" (Middleton's top zip does this), so fixed triples desynchronise.
        # Walk the tokens instead and only consume a cell when it is really
        # there. A DOM value is always a bare non-negative integer, while the
        # percent cell always carries a "%" or a truncating "...", or is "-".
        idx = 0
        for _ in zips:
            if idx < len(trailing) and _is_pct_cell(trailing[idx]):
                tok = trailing[idx]
                median_yoy.append(None if tok.endswith("...") else to_number(tok))
                idx += 1
            elif (idx + 1 < len(trailing) and trailing[idx] == "-"
                    and INTEGER.match(trailing[idx + 1])):
                median_yoy.append(None)
                idx += 1
            else:
                median_yoy.append(None)

            if idx < len(trailing) and INTEGER.match(trailing[idx]):
                dom.append(to_number(trailing[idx]))
                idx += 1
            else:
                dom.append(None)

            # The change column is consumed but not stored. It can be positive,
            # negative, or "-" when the PDF has nothing to show.
            if idx < len(trailing) and (trailing[idx] == "-"
                                        or ANY_INT.match(trailing[idx])):
                idx += 1
        break

    def at(seq, idx):
        return seq[idx] if idx < len(seq) else None

    rows = []
    for idx, zc in enumerate(zips):
        rows.append({
            "zip": zc,
            "sales_count": sales[idx],
            "sales_yoy_pct": at(sales_yoy, idx),
            "total_volume": at(volume, idx),
            "price_per_sqft": at(persqft, idx),
            "median_sale": at(median, idx),
            "median_sale_yoy_pct": at(median_yoy, idx),
            "median_dom": at(dom, idx),
            "pct_over_asking": at(over_asking, idx),
        })
    return rows


def _flat(lines, start):
    """Tokens from `start` until the paging footer, for the trailing % column."""
    out = []
    for ln in lines[start:]:
        if ln.startswith("1-") or "<" in ln and ">" in ln:
            break
        out.extend(ln.split())
    return out


def area_from_pdf(pdf):
    """Prefer the filename; the PDF's own filter chip truncates long names."""
    stem = os.path.splitext(os.path.basename(pdf))[0]
    return re.sub(
        r"[-_ ]*(Sept?|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Oct|Nov|Dec)[a-z]*[-_ ]*\d{4}$",
        "", stem).replace("-", " ").strip()


def extract(pdf, area=None):
    p1 = page_lines(pdf, 1)
    snapshot = None
    for line in p1:
        m = SNAPSHOT.search(line)
        if m:
            snapshot = m.group(1)
            break

    data = {
        "area": area or area_from_pdf(pdf),
        "snapshot_date": snapshot,
        "source_file": os.path.basename(pdf),
    }
    data.update(parse_monthly(pdf))
    data.update(parse_inventory(pdf))
    data.update(parse_ytd(pdf))
    data["supply_by_price_range"] = parse_supply_by_price(pdf)
    data["zip_comparison"] = parse_zips(pdf)
    return data


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        sys.exit(1)

    target = args[0]
    area = None
    if "--area" in sys.argv:
        area = sys.argv[sys.argv.index("--area") + 1]

    if "--all" in sys.argv and os.path.isdir(target):
        pdfs = []
        for name in sorted(os.listdir(target)):
            path = os.path.join(target, name)
            if os.path.isfile(path) and name.lower() != "desktop.ini":
                with open(path, "rb") as fh:
                    if fh.read(4) == b"%PDF":
                        pdfs.append(path)
        print(json.dumps([extract(p) for p in pdfs], indent=2))
    else:
        print(json.dumps(extract(target, area), indent=2))


if __name__ == "__main__":
    main()
