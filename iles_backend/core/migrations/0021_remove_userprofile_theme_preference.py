# Generated manually to drop an obsolete schema column.

from django.db import migrations


def remove_theme_preference(apps, schema_editor):
    """Drop the legacy theme_preference column on supported databases."""
    vendor = schema_editor.connection.vendor
    if vendor == 'sqlite':
        # SQLite does not support ALTER TABLE DROP COLUMN. The test database
        # uses SQLite, so skip this no-op cleanup there.
        return
    schema_editor.execute(
        "ALTER TABLE core_userprofile DROP COLUMN IF EXISTS theme_preference;"
    )


def add_theme_preference(apps, schema_editor):
    """Add back the legacy theme_preference column for reverse migrations."""
    vendor = schema_editor.connection.vendor
    if vendor == 'sqlite':
        return
    schema_editor.execute(
        "ALTER TABLE core_userprofile ADD COLUMN theme_preference varchar(50) NOT NULL DEFAULT 'light';"
    )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_alter_evaluation_unique_together_and_more'),
    ]

    operations = [
        migrations.RunPython(
            remove_theme_preference,
            add_theme_preference,
        ),
    ]
