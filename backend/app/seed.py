"""
Seed script for development data.

Creates:
- Metadata rows (market/retailer/channel/category/campaign combinations)
"""

from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models.metadata import Metadata
from app.models.metadata_item import MetadataItem
from app.db import SessionLocal  # assumes you have a db.py with SessionLocal

METADATA_ROWS = [
    {
        "market": "US",
        "retailer": {
            "Kroger": "Kroger",
            "Giant Eagle": "Giant Eagle",
            "Wegmans": "Wegmans",
            "Wakefern": "Wakefern",
            "Meijer": "Meijer",
            "BJs Wholesale": "BJs Wholesale",
            "Dollar Tree": "Dollar Tree",
            "Family Dollar": "Family Dollar",
            "Publix": "Publix",
            "Albertsons": "Albertsons",
            "Walgreens": "Walgreens",
            "Ahold": "Ahold",
            "CVS": "CVS",
            "Sam's Club": "Sam's Club",
            "Dollar General": "Dollar General",
            "Target": "Target",
            "Walmart": "Walmart",
            "Amazon": "Amazon",
        },
        "channel": {
            "Grocery": "Grocery",
            "Value": "Value",
            "Drug": "Drug",
            "Club": "Club",
            "Mass": "Mass",
            "Dcomm": "Dcomm",
            "Total Market": "Total Market",
        },
        "category": {
            "Hair Care": "Hair Care",
            "Skin Care": "Skin Care",
            "Skin Cleansing": "Skin Cleansing",
            "Deodorants": "Deodorants",
            "Laundry": "Laundry",
            "Cleaners": "Cleaners",
            "Dish": "Dish",
            "Savoury": "Savoury",
            "Meal Makers": "Meal Makers",
            "Condiments": "Condiments",
            "Broth / Bouillon": "Broth / Bouillon",
        },
        "accountable_team": {
            "CSP": "CSP",
            "CBD": "CBD",
            "DRT": "DRT",
            "CO": "CO",
            "MKTG": "MKTG",
        },
        "pillar_kpi_1": {
            "Linear Share of Shelf": "Linear Share of Shelf",
            "SPI": "SPI",
            "Share at eye-level": "Share at eye-level",
            "TDP Share": "% TO winning TDP Share",
            "Share of Assortment": "Share of Assortment",
        },
        "pillar_kpi_2": {
            "Share of POSM at Home Shelf": "Share of POSM at Home Shelf",
            "Unmissable asset design score": "POSM design score",
        },
        "pillar_kpi_3": {
            "# Features and Displays": "% of Visited Stores having Secondary Placements",
            "Promo Execution": "Promo Execution",
        },
        "pillar_kpi_4": {
            "Content Compliance": "Content Compliance",
            "First-Page Search Result": "First-Page Search Result",
        },
        "pillar_kpi_5": {
            "OSA": "OSA",
            "OLA": "OLA",
        },
        "business_group": {
            "Beauty & Wellbeing": "Beauty & Wellbeing",
            "Personal Care": "Personal Care",
            "Foods": "Foods",
            "Home Care": "Home Care",
        },
        "year": {
            "2026": "2026",
            "2027": "2027",
        },
    },
    {
        "market": "Netherlands",
        "retailer": {
            "Albert Heijn": "Albert Heijn",
            "Jumbo": "Jumbo",
            "AS Watson": "AS Watson",
            "Aldi": "Aldi",
            "Lidl": "Lidl",
            "Plus": "Plus",
            "Dirk": "Dirk",
            "Hoogvliet": "Hoogvliet",
            "Bol": "Bol",
            "Albert Heijn eCom": "Albert Heijn eCom",
            "Jumbo eCom": "Jumbo eCom",
            "Plus eCom": "Plus eCom",
            "Nettorama": "Nettorama",
            "Deka Markt": "Deka Markt",
            "Picnic": "Picnic",
            "Spar": "Spar",
            "Vomar": "Vomar",
            "Boon": "Boon",
            "Kruidvat": "Kruidvat",
            "Poiesz": "Poiesz",
            "Amazon": "Amazon",
            "Etos": "Etos",
        },
        "channel": {
            "Total Market": "Total Market",
            "Drug": "Drug",
            "Value": "Value",
            "E-Commerce Pureplay": "E-Commerce Pureplay",
            "Supermarket": "Supermarket",
        },
        "category": {
            "Cleaners": "Cleaners",
            "Condiments": "Condiments",
            "Deodorants": "Deodorants",
            "Dish": "Dish",
            "Dressings & Spreads": "Dressings & Spreads",
            "Hair Care": "Hair Care",
            "Home Care": "Home Care",
            "Laundry": "Laundry",
            "Meal Makers": "Meal Makers",
            "Oral Care": "Oral Care",
            "Savoury": "Savoury",
            "Skin Care": "Skin Care",
            "Skin Cleansing": "Skin Cleansing",
            "Cooking Aids": "Cooking Aids",
            "Breakfast": "Breakfast",
            "Mini Meals": "Mini Meals",
            "Softdrinks": "Softdrinks",
            "Ready to drink Tea": "Ready to drink Tea",
            "Kombucha": "Kombucha",
        },
        "accountable_team": {
            "CSP": "CSP",
            "CBD": "CBD",
            "MKT": "MKT",
            "Field Sales": "Field Sales",
            "SC": "SC",
            "FIN": "FIN",
        },
        "pillar_kpi_1": {
            "Linear Share of Shelf": "Linear Share of Shelf",
            "SPI": "SPI",
            "Share at eye-level": "Share at eye-level",
            "TDP Share": "% TO winning TDP Share",
            "Share of Assortment": "Share of Assortment",
        },
        "pillar_kpi_2": {
            "Share of POSM at Home Shelf": "Share of POSM at Home Shelf",
            "Unmissable asset design score": "POSM design score",
        },
        "pillar_kpi_3": {
            "# Features and Displays": "% of Visited Stores having Secondary Placements",
            "Promo Execution": "Promo Execution",
        },
        "pillar_kpi_4": {
            "Content Compliance": "Content Compliance",
            "First-Page Search Result": "First-Page Search Result",
        },
        "pillar_kpi_5": {
            "OSA": "OSA",
            "OLA": "OLA",
        },
        "business_group": {
            "Beauty & Wellbeing": "Beauty & Wellbeing",
            "Personal Care": "Personal Care",
            "Foods": "Foods",
            "Home Care": "Home Care",
        },
        "year": {
            "2026": "2026",
            "2027": "2027",
        },
    },
    {
        "market": "Belgium",
        "retailer": {
            "Carrefour": "Carrefour",
            "Delhaize": "Delhaize",
            "Intermarché": "Intermarché",
            "Spar": "Spar",
            "Colruyt": "Colruyt",
            "Kruidvat": "Kruidvat",
        },
        "channel": {
            "Total Market": "Total Market",
            "Supermarket": "Supermarket",
            "Drugstore": "Drugstore",
            "Soft discount": "Soft discount",
        },
        "category": {
            "Bouillon": "Bouillon",
            "Beverages ( Lipton )": "Beverages ( Lipton )",
            "Deodorant": "Deodorant",
            "Oral Care": "Oral Care",
            "Shower": "Shower",
        },
        "accountable_team": {
            "CSP": "CSP",
            "CBD": "CBD",
            "MKT": "MKT",
            "FIELD": "FIELD",
            "SC": "SC",
            "FIN": "FIN",
        },
        "pillar_kpi_1": {
            "Linear Share of Shelf": "Linear Share of Shelf",
            "SPI": "SPI",
            "Share at eye-level": "Share at eye-level",
            "TDP Share": "% TO winning TDP Share",
            "Share of Assortment": "Share of Assortment",
        },
        "pillar_kpi_2": {
            "Share of POSM at Home Shelf": "Share of POSM at Home Shelf",
            "Unmissable asset design score": "POSM design score",
        },
        "pillar_kpi_3": {
            "# Features and Displays": "% of Visited Stores having Secondary Placements",
            "Promo Execution": "Promo Execution",
        },
        "pillar_kpi_4": {
            "Content Compliance": "Content Compliance",
            "First-Page Search Result": "First-Page Search Result",
        },
        "pillar_kpi_5": {
            "OSA": "OSA",
            "OLA": "OLA",
        },
        "business_group": {
            "Personal Care": "Personal Care",
            "Foods": "Foods",
        },
        "year": {
            "2026": "2026",
            "2027": "2027",
        },
    },
    {
        "market": "Turkey",
        "retailer": {
            "Migros": "Migros",
            "BIM": "BIM",
            "A101": "A101",
            "SOK": "SOK",
            "Watsons": "Watsons",
            "Gratis": "Gratis",
        },
        "channel": {
            "Total Market": "Total Market",
            "Discounter": "Discounter",
            "National Account": "National Account",
            "SPM Direct": "SPM Direct",
            "SPM Indirect": "SPM Indirect",
            "H&B": "H&B",
            "C&C": "C&C",
            "DCOM": "DCOM",
        },
        "category": {
            "Fabclean": "Fabclean",
            "FabEnh": "FabEnh",
            "Surface Cleaners": "Surface Cleaners",
            "T&B": "T&B",
            "Hair": "Hair",
            "Hand & Body": "Hand & Body",
            "Deo": "Deo",
            "Oral": "Oral",
            "SCL": "SCL",
            "Ketchup": "Ketchup",
            "Mayonnaise": "Mayonnaise",
            "CMS": "CMS",
            "SOUP": "SOUP",
            "BOUILLION": "BOUILLION",
        },
        "accountable_team": {
            "CSP": "CSP",
            "CBD": "CBD",
            "FIELD": "FIELD",
            "CS": "CS",
            "MKTG": "MKTG",
            "TCM": "TCM",
        },
        "pillar_kpi_1": {
            "Linear Share of Shelf": "Linear Share of Shelf",
            "SPI": "SPI",
            "Share at eye-level": "Share at eye-level",
            "TDP Share": "% TO winning TDP Share",
            "Share of Assortment": "Share of Assortment",
        },
        "pillar_kpi_2": {
            "Share of POSM at Home Shelf": "Share of POSM at Home Shelf",
            "Unmissable asset design score": "POSM design score",
        },
        "pillar_kpi_3": {
            "# Features and Displays": "% of Visited Stores having Secondary Placements",
            "Promo Execution": "Promo Execution",
        },
        "pillar_kpi_4": {
            "Content Compliance": "Content Compliance",
            "First-Page Search Result": "First-Page Search Result",
        },
        "pillar_kpi_5": {
            "OSA": "OSA",
            "OLA": "OLA",
        },
        "business_group": {
            "Beauty & Wellbeing": "Beauty & Wellbeing",
            "Personal Care": "Personal Care",
            "Foods": "Foods",
            "Home Care": "Home Care",
        },
        "year": {
            "2026": "2026",
            "2027": "2027",
        },
    },
]


def seed_metadata(db: Session) -> None:
    existing = db.scalar(select(func.count()).select_from(Metadata))
    if existing and existing > 0:
        print("  - Metadata already seeded, skipping.")
        return

    for row in METADATA_ROWS:
        db.add(Metadata(**row))
    db.flush()
    print(f"  + Seeded {len(METADATA_ROWS)} metadata rows")

def seed_metadata_items(db: Session) -> None:
    group_order = [
        "retailer",
        "channel",
        "category",
        "accountable_team",
        "pillar_kpi_1",
        "pillar_kpi_2",
        "pillar_kpi_3",
        "pillar_kpi_4",
        "pillar_kpi_5",
        "business_group",
        "year",
    ]

    inserted_count = 0
    for row in METADATA_ROWS:
        market = row["market"]
        for group_name in group_order:
            value_label_map = row.get(group_name, {}) or {}
            for sort_order, (value, label) in enumerate(value_label_map.items()):
                existing = db.query(MetadataItem).filter(
                    # unique key for table
                    MetadataItem.market == market,
                    MetadataItem.group_name == group_name,
                    MetadataItem.key_name == group_name,
                    MetadataItem.value == value,
                ).first()
                if existing:
                    if existing.label != label:
                        existing.label = label
                    existing.sort_order = sort_order
                    existing.is_active = True
                    continue

                db.add(
                    MetadataItem(
                        market=market,
                        group_name=group_name,
                        key_name=group_name,
                        value=value,
                        label=label,
                        sort_order=sort_order,
                        is_active=True,
                    )
                )
                inserted_count += 1

    db.flush()
    print(f"  + Seeded {inserted_count} metadata_item rows")


def run_seed() -> None:
    print("Running seed data...")
    db = SessionLocal()
    try:
        seed_metadata(db)
        seed_metadata_items(db)
        db.commit()
        print("Seed complete.")
    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
 