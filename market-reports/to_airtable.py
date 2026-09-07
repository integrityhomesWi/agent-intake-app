"""
Turn extract_market_pdf.py output into Airtable record payloads for the
Marketing Command Center base (appTtFjtIHkZZYtgY).

    python to_airtable.py "<folder of city PDFs>" <snapshot YYYY-MM-DD>

Writes three JSON files next to this script: reports.json, supply.json,
zips.json. Each is an array ready to hand to create_records_for_table.

Both the record key and the Report Month field use the SNAPSHOT month, so a
Sep 1 2026 snapshot is "Madison - Sep 2026" with Report Month 2026-09-01. The
closing month it actually covers is stated in Report Label.
"""

import json
import os
import sys
from datetime import date

from extract_market_pdf import extract

MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"]

# Market Reports
F_REPORT = {
    "key": "fldfbeZl96YiKSV1y", "city": "fld6uV21Vdzw1kvTy",
    "report_month": "fldjjMywmFmokuicu", "label": "fldBmLG421c7pHmoG",
    "snapshot": "fldMAWHAx2e5LQRd6", "market_type": "fldKE2VNPBwKT46UL",
    "median": "fldx1MCRnHtF0tUPr", "median_yoy": "fldCsFl2ylObxT4iy",
    "prior_median": "fldCu7mYyOyittIbf", "avg_sale": "fldlVNKgsmL1jkjTL",
    "avg_sale_yoy": "fldquR8t2IFNrnIz7", "median_dom": "fldfIYGUobnZB64Iw",
    "median_dom_yoy": "fldK27oYrdjoP6KPQ", "prior_median_dom": "fldULDuYimgRsH0st",
    "avg_dom": "fldqkdaVxmriiiT67", "avg_dom_yoy": "fld84I4gBGm6VZX2T",
    "supply": "fldCOcUF4MXLUgoYI", "active": "fldTWovQ0R4rbAPUZ",
    "pending": "fld7SgjV2NqGSzJTF", "avg_sales_mo": "fldWUhOah8axWvHSX",
    "sales": "fldj295U8Mq8lcVBi", "sales_yoy": "fld727DGjfg3prlKw",
    "prior_sales": "fld3QRLEYIPEx137Q", "psf": "fld5FazXEmSsSvCYj",
    "psf_yoy": "flddDwWPAIC6gd2vY", "over_ask": "fldEJ4ogbLJgcIvXX",
    "over_ask_yoy": "fldLw9KdDKenu1Rxo", "volume": "fldjS2sn3PjaRc7Fx",
    "volume_yoy": "fldJ10buIaHoujHML", "new_listings": "fldtt6vtimV5dgtES",
    "new_listings_yoy": "fldb4JxTowAfDTGQs", "new_pendings": "fldzAjwVGyuUbmWS3",
    "new_pendings_yoy": "fldBrBrAvgQSLseFj", "avg_asking": "flddBCGu8iHMnQEgl",
    "days_to_pending": "fldjigpO5Tmyhtbg3", "avg_sqft": "fldxxbqBPr8oAo7Pr",
    "ytd_sales": "fldRv6NnrClKxn40i", "ytd_sales_yoy": "fldQWztWaySLmxw3A",
    "ytd_median": "fldox6YsQf5lI0qRA", "ytd_median_yoy": "fldLFYetpeIfhy8rb",
    "ytd_avg": "fldvhtHhxWBcsPHMb", "ytd_volume": "fldYe4Uul6pFjhqFZ",
    "ytd_new_listings": "fldf94hWV5JR5VxRV", "ytd_median_dom": "fldqo7ThYibcJ9BvH",
    "tightest": "fldsbyzpkASzdtq3r", "tightest_supply": "fldObYEAnBaLqTCw9",
    "status": "fldFWpGSobqGiDlsM", "source": "fldGw95ryMXUlchsN",
}

# Price Range Supply
F_SUPPLY = {
    "key": "fldz9IjB3NRD0iYDI", "city": "fld3pdOsBL7oiz6C0",
    "report_month": "fldkxzkAgRPdvVVCg", "bracket": "fld1sNZ1T3Kxm16Tk",
    "supply": "fldzYcmi9lfido89K", "active": "fldQj8fl3XZ6PljaN",
    "avg_sales_mo": "fldHIqoqbRB5zMDCY", "confidence": "fldWE7J5z5G76nowh",
    "signal": "fld7yybC8YwCf4k06",
}

# Zip Code Trends
F_ZIP = {
    "key": "fldDsJozLkcUFMhce", "city": "fld6mzpn10hqAiLS7",
    "report_month": "fld4pwwbp7ktlgxot", "zip": "fldP4O1XFRn90Ijx2",
    "primary": "fldHQpmwpLxe1gvxw", "sales": "fldiRWNsVIjdbvn8n",
    "sales_yoy": "fldMLhGwSsT6fkRiW", "psf": "fldtNPdJsNEw53Ql5",
    "median": "fldhe8RDn9B2qjFCc", "median_yoy": "fldnsCDtKFxUWZnR1",
    "median_dom": "fldrX1WeXlcsMZJIL", "over_ask": "fldktfF9aqhm5lM8V",
}

# PDF bracket label -> the base's Price Bracket choice. The PDF splits the
# bottom of the market into 0-99,999 and 100,000-199,999; the base has a single
# "Under $200K", so those two are merged.
BRACKET_MAP = {
    "0-$99,999": "Under $200K",
    "$100,000-$199,999": "Under $200K",
    "$200,000-$299,999": "$200K-$299K",
    "$300,000-$399,999": "$300K-$399K",
    "$400,000-$499,999": "$400K-$499K",
    "$500,000-$599,999": "$500K-$599K",
    "$600,000-$699,999": "$600K-$699K",
    "$700,000-$799,999": "$700K-$799K",
    "$800,000-$899,999": "$800K-$899K",
    "$900,000-$999,999": "$900K-$999K",
    "$1,000,000+": "$1,000,000+",
}

BRACKET_ORDER = ["Under $200K", "$200K-$299K", "$300K-$399K", "$400K-$499K",
                 "$500K-$599K", "$600K-$699K", "$700K-$799K", "$800K-$899K",
                 "$900K-$999K", "$1,000,000+"]

# The area name comes from the filename, which is hand-typed and drifts. Map the
# spellings seen in the wild onto the base's City choices.
AREA_ALIASES = {
    "deforst": "DeForest",
    "deforest": "DeForest",
    "dane county": "Dane County",
    "sun prairie": "Sun Prairie",
}

# The market-report-page skill's ladder. Values on a boundary classify into the
# higher (more buyer-favorable) tier.
def market_type(supply):
    if supply is None:
        return None
    if supply < 2:
        return "Extreme Seller's Market"
    if supply < 4:
        return "Strong Seller's Market"
    if supply < 5:
        return "Seller's Market"
    if supply < 6:
        return "Leaning Toward Buyer's Market"
    return "Buyer's Market"


# Choices that actually exist on the base's Market Type field today.
MARKET_TYPE_AVAILABLE = {"Strong Seller's Market", "Seller's Market",
                         "Balanced Market", "Buyer's Market",
                         "Strong Buyer's Market"}


def val(rec, key):
    node = rec.get(key)
    return node["value"] if node else None


def yoy(rec, key):
    node = rec.get(key)
    return node["yoy"]["value"] if node and node["yoy"] else None


def pct(raw):
    """Airtable percent fields hold decimals: 8.6% is stored as 0.086."""
    return None if raw is None else round(raw / 100.0, 6)


def prior_from_pct(current, change_pct):
    """Back out last year's figure from this year's value and its YoY %."""
    if current is None or change_pct is None or change_pct == -100:
        return None
    return round(current / (1 + change_pct / 100.0))


def drop_empty(fields):
    return {k: v for k, v in fields.items() if v is not None}


def build(pdf_dir, snapshot_iso):
    snap = date.fromisoformat(snapshot_iso)
    # The snapshot is taken on the 1st and reflects the prior month's closings.
    close_year = snap.year if snap.month > 1 else snap.year - 1
    close_month = snap.month - 1 if snap.month > 1 else 12
    snap_tag = f"{MONTH_ABBR[snap.month - 1]} {snap.year}"

    # Report Month holds the SNAPSHOT month, per John 2026-09-01. This overrides
    # the field's own description in Airtable, which says to store the closing
    # month, and differs from the five rows that predate that call. The closing
    # month is still stated in Report Label.
    report_month_iso = snapshot_iso
    label = (f"{MONTH_FULL[snap.month - 1]} {snap.year} Report"
             f" · Based on {MONTH_FULL[close_month - 1]} {close_year} Closings")

    pdfs = []
    for name in sorted(os.listdir(pdf_dir)):
        path = os.path.join(pdf_dir, name)
        if os.path.isfile(path) and name.lower() != "desktop.ini":
            with open(path, "rb") as fh:
                if fh.read(4) == b"%PDF":
                    pdfs.append(path)

    reports, supply_rows, zip_rows, warnings = [], [], [], []

    for path in pdfs:
        r = extract(path)
        area = AREA_ALIASES.get(r["area"].lower(), r["area"])

        # Collapse the PDF's brackets onto the base's bracket vocabulary.
        merged = {}
        for row in r["supply_by_price_range"]:
            name = BRACKET_MAP.get(row["price_range"])
            if not name:
                warnings.append(f"{area}: unmapped bracket {row['price_range']}")
                continue
            acc = merged.setdefault(name, {"active": 0, "sales": 0})
            acc["active"] += row["active_now"] or 0
            acc["sales"] += row["avg_sales_per_month"] or 0

        for name, acc in merged.items():
            acc["supply"] = (round(acc["active"] / acc["sales"], 2)
                             if acc["sales"] else None)

        ranked = [(n, a) for n, a in merged.items() if a["supply"] is not None]
        tightest = min(ranked, key=lambda x: x[1]["supply"])[0] if ranked else None
        busiest = max(merged.items(), key=lambda x: x[1]["sales"])[0] if merged else None

        for name in BRACKET_ORDER:
            if name not in merged:
                continue
            acc = merged[name]
            signal = None
            if name == tightest:
                signal = "Tightest"
            elif name == busiest:
                signal = "Most Active"
            elif acc["sales"] == 0:
                signal = "Low Volume"
            supply_rows.append({"fields": drop_empty({
                F_SUPPLY["key"]: f"{area} {snap_tag} — {name}",
                F_SUPPLY["city"]: area,
                F_SUPPLY["report_month"]: report_month_iso,
                F_SUPPLY["bracket"]: name,
                F_SUPPLY["supply"]: acc["supply"],
                F_SUPPLY["active"]: acc["active"],
                F_SUPPLY["avg_sales_mo"]: acc["sales"],
                F_SUPPLY["confidence"]: "Confirmed (SCWMLS)",
                F_SUPPLY["signal"]: signal,
            })})

        city_active = val(r, "active_listings")
        city_supply = val(r, "months_of_supply")
        city_avg_sales = (round(city_active / city_supply)
                          if city_active and city_supply else None)

        supply_rows.append({"fields": drop_empty({
            F_SUPPLY["key"]: f"{area} {snap_tag} — Grand Total",
            F_SUPPLY["city"]: area,
            F_SUPPLY["report_month"]: report_month_iso,
            F_SUPPLY["bracket"]: "Grand Total",
            F_SUPPLY["supply"]: city_supply,
            F_SUPPLY["active"]: city_active,
            F_SUPPLY["avg_sales_mo"]: city_avg_sales,
            F_SUPPLY["confidence"]: "Confirmed (SCWMLS)",
        })})

        zips = r["zip_comparison"]
        top_zip = max(zips, key=lambda z: z["sales_count"] or 0)["zip"] if zips else None
        for z in zips:
            zip_rows.append({"fields": drop_empty({
                F_ZIP["key"]: f"{area} {snap_tag} — {z['zip']}",
                F_ZIP["city"]: area,
                F_ZIP["report_month"]: report_month_iso,
                F_ZIP["zip"]: z["zip"],
                F_ZIP["primary"]: True if z["zip"] == top_zip else None,
                F_ZIP["sales"]: z["sales_count"],
                F_ZIP["sales_yoy"]: pct(z["sales_yoy_pct"]),
                F_ZIP["psf"]: z["price_per_sqft"],
                F_ZIP["median"]: z["median_sale"],
                F_ZIP["median_yoy"]: pct(z["median_sale_yoy_pct"]),
                F_ZIP["median_dom"]: z["median_dom"],
                F_ZIP["over_ask"]: pct(z["pct_over_asking"]),
            })})

        mtype = market_type(city_supply)
        if mtype not in MARKET_TYPE_AVAILABLE:
            warnings.append(
                f"{area}: months of supply {city_supply} classifies as "
                f"\"{mtype}\", which is not a choice on the Market Type field. "
                f"Left blank.")
            mtype = None

        median_dom_yoy = yoy(r, "median_dom")
        reports.append({"fields": drop_empty({
            F_REPORT["key"]: f"{area} — {snap_tag}",
            F_REPORT["city"]: area,
            F_REPORT["report_month"]: report_month_iso,
            F_REPORT["label"]: label,
            F_REPORT["snapshot"]: snapshot_iso,
            F_REPORT["market_type"]: mtype,
            F_REPORT["median"]: val(r, "median_sale"),
            F_REPORT["median_yoy"]: pct(yoy(r, "median_sale")),
            F_REPORT["prior_median"]: prior_from_pct(val(r, "median_sale"),
                                                     yoy(r, "median_sale")),
            F_REPORT["avg_sale"]: val(r, "average_sale"),
            F_REPORT["avg_sale_yoy"]: pct(yoy(r, "average_sale")),
            F_REPORT["median_dom"]: val(r, "median_dom"),
            F_REPORT["median_dom_yoy"]: median_dom_yoy,
            F_REPORT["prior_median_dom"]: (
                val(r, "median_dom") - median_dom_yoy
                if val(r, "median_dom") is not None and median_dom_yoy is not None
                else None),
            F_REPORT["avg_dom"]: val(r, "average_dom"),
            F_REPORT["avg_dom_yoy"]: yoy(r, "average_dom"),
            F_REPORT["supply"]: city_supply,
            F_REPORT["active"]: city_active,
            F_REPORT["pending"]: val(r, "pending_listings"),
            F_REPORT["avg_sales_mo"]: city_avg_sales,
            F_REPORT["sales"]: val(r, "sales_count"),
            F_REPORT["sales_yoy"]: pct(yoy(r, "sales_count")),
            F_REPORT["prior_sales"]: prior_from_pct(val(r, "sales_count"),
                                                    yoy(r, "sales_count")),
            F_REPORT["psf"]: val(r, "avg_price_per_sqft"),
            F_REPORT["psf_yoy"]: pct(yoy(r, "avg_price_per_sqft")),
            F_REPORT["over_ask"]: pct(val(r, "avg_pct_over_asking")),
            F_REPORT["over_ask_yoy"]: pct(yoy(r, "avg_pct_over_asking")),
            F_REPORT["volume"]: val(r, "total_volume"),
            F_REPORT["volume_yoy"]: pct(yoy(r, "total_volume")),
            F_REPORT["new_listings"]: val(r, "new_listings"),
            F_REPORT["new_listings_yoy"]: pct(yoy(r, "new_listings")),
            F_REPORT["new_pendings"]: val(r, "new_pendings"),
            F_REPORT["new_pendings_yoy"]: pct(yoy(r, "new_pendings")),
            F_REPORT["avg_asking"]: val(r, "average_asking_price"),
            F_REPORT["days_to_pending"]: val(r, "days_until_pending_median"),
            F_REPORT["avg_sqft"]: val(r, "average_sqft"),
            F_REPORT["ytd_sales"]: val(r, "ytd_sales_count"),
            F_REPORT["ytd_sales_yoy"]: pct(yoy(r, "ytd_sales_count")),
            F_REPORT["ytd_median"]: val(r, "ytd_median_sale"),
            F_REPORT["ytd_median_yoy"]: pct(yoy(r, "ytd_median_sale")),
            F_REPORT["ytd_avg"]: val(r, "ytd_average_sale"),
            F_REPORT["ytd_volume"]: val(r, "ytd_total_volume"),
            F_REPORT["ytd_new_listings"]: val(r, "ytd_new_listings"),
            F_REPORT["ytd_median_dom"]: val(r, "ytd_median_dom"),
            F_REPORT["tightest"]: tightest,
            F_REPORT["tightest_supply"]: (merged[tightest]["supply"]
                                          if tightest else None),
            F_REPORT["status"]: "Data Entered",
            F_REPORT["source"]: r["source_file"],
        })})

    return reports, supply_rows, zip_rows, warnings


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    reports, supply_rows, zip_rows, warnings = build(sys.argv[1], sys.argv[2])
    here = os.path.dirname(os.path.abspath(__file__))
    for name, payload in (("reports", reports), ("supply", supply_rows),
                          ("zips", zip_rows)):
        with open(os.path.join(here, name + ".json"), "w", encoding="utf-8") as fh:
            json.dump(payload, fh, separators=(",", ":"))
    print(f"reports {len(reports)}  supply {len(supply_rows)}  zips {len(zip_rows)}")
    for w in warnings:
        print("WARNING:", w)


if __name__ == "__main__":
    main()
