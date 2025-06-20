"""Add recurring schedule fields

Revision ID: 44479a729e0c
Revises: d22eb937f665
Create Date: 2025-06-20 15:05:55.816657

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44479a729e0c'
down_revision: Union[str, None] = 'd22eb937f665'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
