"""
Parent-to-child map for the User Adoption coverage grid.

One row per child. `parent_type` is `channel` (child is a retailer) or
`business_group` (child is a category). This table only builds the empty
grid. Published cells still come from `pager`.
"""

from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CoverageMapping(Base):
    __tablename__ = "coverage_mapping"
    __table_args__ = (
        UniqueConstraint(
            "market",
            "parent_type",
            "parent_value",
            "child_value",
            name="uq_coverage_mapping_market_parent_child",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    market: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    parent_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    parent_value: Mapped[str] = mapped_column(String(255), nullable=False)
    child_value: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
