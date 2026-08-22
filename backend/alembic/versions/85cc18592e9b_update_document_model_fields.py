"""Update Document model fields

Revision ID: 85cc18592e9b
Revises: 77a94cc1d2a7
Create Date: 2026-08-22 10:47:09.205156

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85cc18592e9b'
down_revision: Union[str, Sequence[str], None] = '77a94cc1d2a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('documents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name', sa.String(), nullable=False, server_default='Document'))
        batch_op.add_column(sa.Column('file_size', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('uploaded_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_documents_uploaded_by_users', 'users', ['uploaded_by'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('documents', schema=None) as batch_op:
        batch_op.drop_constraint('fk_documents_uploaded_by_users', type_='foreignkey')
        batch_op.drop_column('uploaded_by')
        batch_op.drop_column('file_size')
        batch_op.drop_column('name')
