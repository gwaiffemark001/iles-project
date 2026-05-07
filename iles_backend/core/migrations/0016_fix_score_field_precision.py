# Generated migration to fix score field precision
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_fix_score_field_precision'),
    ]

    operations = [
        migrations.AlterField(
            model_name='evaluation',
            name='weighted_score',
            field=models.DecimalField(decimal_places=2, max_digits=8, null=True),
        ),
    ]
