"""add coverage mapping table

Revision ID: a7d4c2e91b06
Revises: 8509ef619368
Create Date: 2026-11-05 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7d4c2e91b06"
down_revision: Union[str, None] = "8509ef619368"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "coverage_mapping",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("market", sa.String(length=100), nullable=False),
        sa.Column("parent_type", sa.String(length=32), nullable=False),
        sa.Column("parent_value", sa.String(length=255), nullable=False),
        sa.Column("child_value", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "market",
            "parent_type",
            "parent_value",
            "child_value",
            name="uq_coverage_mapping_market_parent_child",
        ),
    )
    op.create_index("ix_coverage_mapping_market", "coverage_mapping", ["market"], unique=False)
    op.create_index(
        "ix_coverage_mapping_parent_type",
        "coverage_mapping",
        ["parent_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_coverage_mapping_parent_type", table_name="coverage_mapping")
    op.drop_index("ix_coverage_mapping_market", table_name="coverage_mapping")
    op.drop_table("coverage_mapping")
