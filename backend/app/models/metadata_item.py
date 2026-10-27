"""
Normalized metadata option table.

Each row represents one selectable metadata value for a market and a metadata group.
This is the canonical table for UI label/value pairs, while the legacy `metadata`
table remains for backward compatibility during migration.
"""

from datetime import datetime

from sqlalchemy import Integer, String, Boolean, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class MetadataItem(Base):
    __tablename__ = "metadata_items"
    __table_args__ = (
        UniqueConstraint(
            "market",
            "group_name",
            "key_name",
            "value",
            name="uq_metadata_items_market_group_key_value",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    market: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    group_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    key_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
