"""
Alembic migration: Add i18n tables
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers
revision = 'add_i18n_tables'
down_revision = None  # Update with your last migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create languages table
    op.create_table(
        'languages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('native_name', sa.String(length=100), nullable=False),
        sa.Column('direction', sa.Enum('LTR', 'RTL', name='direction'), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('flag_emoji', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_languages_code', 'languages', ['code'])
    op.create_index('idx_languages_active', 'languages', ['is_active'])

    # Create post_translations table
    op.create_table(
        'post_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('language_code', sa.String(length=10), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('slug', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('meta_title', sa.String(length=200), nullable=True),
        sa.Column('meta_description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['language_code'], ['languages.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('post_id', 'language_code', name='uq_post_language'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_post_translations_post', 'post_translations', ['post_id'])
    op.create_index('idx_post_translations_lang', 'post_translations', ['language_code'])

    # Create category_translations table
    op.create_table(
        'category_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('language_code', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['language_code'], ['languages.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('category_id', 'language_code', name='uq_category_language'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_category_translations_category', 'category_translations', ['category_id'])
    op.create_index('idx_category_translations_lang', 'category_translations', ['language_code'])

    # Create page_translations table
    op.create_table(
        'page_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('page_id', sa.Integer(), nullable=False),
        sa.Column('language_code', sa.String(length=10), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('slug', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('meta_title', sa.String(length=200), nullable=True),
        sa.Column('meta_description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['language_code'], ['languages.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('page_id', 'language_code', name='uq_page_language'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_page_translations_page', 'page_translations', ['page_id'])
    op.create_index('idx_page_translations_lang', 'page_translations', ['language_code'])

    # Create translations table (for UI strings)
    op.create_table(
        'translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=200), nullable=False),
        sa.Column('language_code', sa.String(length=10), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('namespace', sa.String(length=50), nullable=False, server_default='common'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['language_code'], ['languages.code'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key', 'language_code', 'namespace', name='uq_translation_key_lang_ns'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_translations_lang', 'translations', ['language_code'])
    op.create_index('idx_translations_namespace', 'translations', ['namespace'])

    # Create currency_rates table
    op.create_table(
        'currency_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('from_currency', sa.String(length=3), nullable=False),
        sa.Column('to_currency', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('from_currency', 'to_currency', name='uq_currency_pair'),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    op.create_index('idx_currency_from', 'currency_rates', ['from_currency'])
    op.create_index('idx_currency_to', 'currency_rates', ['to_currency'])


def downgrade() -> None:
    op.drop_table('currency_rates')
    op.drop_table('translations')
    op.drop_table('page_translations')
    op.drop_table('category_translations')
    op.drop_table('post_translations')
    op.drop_table('languages')
    op.execute('DROP TYPE IF EXISTS direction')
