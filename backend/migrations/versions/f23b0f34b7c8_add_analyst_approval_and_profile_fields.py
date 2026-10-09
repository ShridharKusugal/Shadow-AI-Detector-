"""add_analyst_approval_and_profile_fields

Revision ID: f23b0f34b7c8
Revises: 6569f31a1281
Create Date: 2026-10-09 19:57:09.669487

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f23b0f34b7c8'
down_revision: Union[str, Sequence[str], None] = '6569f31a1281'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('full_name', sa.String(length=128), nullable=True))
    op.add_column('users', sa.Column('organization', sa.String(length=128), nullable=True))
    op.add_column('users', sa.Column('account_status', sa.String(length=32), server_default='ACTIVE', nullable=False))
    op.add_column('users', sa.Column('approved_by', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f('ix_users_account_status'), 'users', ['account_status'], unique=False)
    op.create_foreign_key('fk_users_approved_by', 'users', 'users', ['approved_by'], ['id'], ondelete='SET NULL')
    
    # Ensure existing records are ACTIVE
    op.execute("UPDATE users SET account_status = 'ACTIVE' WHERE account_status IS NULL OR account_status = ''")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_users_approved_by', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_account_status'), table_name='users')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'approved_at')
    op.drop_column('users', 'approved_by')
    op.drop_column('users', 'account_status')
    op.drop_column('users', 'organization')
    op.drop_column('users', 'full_name')
    # ### end Alembic commands ###
