"""add_metadata_items_table

Revision ID: 8509ef619368
Revises: 'bb04d93bf861'
Create Date: 2026-10-15 14:23:12.492101

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8509ef619368'
down_revision: Union[str, None] = 'bb04d93bf861'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "metadata_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("market", sa.String(length=100), nullable=False),
        sa.Column("group_name", sa.String(length=100), nullable=False),
        sa.Column("key_name", sa.String(length=100), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("market", "group_name", "key_name", "value", name="uq_metadata_items_market_group_key_value"),
    )
    op.create_index(op.f("ix_metadata_items_market"), "metadata_items", ["market"], unique=False)
    op.create_index(op.f("ix_metadata_items_group_name"), "metadata_items", ["group_name"], unique=False)
    op.create_index(op.f("ix_metadata_items_key_name"), "metadata_items", ["key_name"], unique=False)

def downgrade():
    op.drop_index(op.f("ix_metadata_items_key_name"), table_name="metadata_items")
    op.drop_index(op.f("ix_metadata_items_group_name"), table_name="metadata_items")
    op.drop_index(op.f("ix_metadata_items_market"), table_name="metadata_items")
    op.drop_table("metadata_items")
