# Generated manually to drop an obsolete schema column.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_alter_evaluation_unique_together_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE core_userprofile DROP COLUMN IF EXISTS theme_preference;",
            reverse_sql="ALTER TABLE core_userprofile ADD COLUMN theme_preference varchar(50) NOT NULL DEFAULT 'light';",
        ),
    ]