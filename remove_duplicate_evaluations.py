import os
import sys
import django

# Ensure the project's iles_backend directory is on sys.path so
# `iles_backend.settings` can be imported when running from project root.
BASE_DIR = os.path.dirname(__file__)
PROJECT_SETTINGS_PATH = os.path.join(BASE_DIR, 'iles_backend')
if PROJECT_SETTINGS_PATH not in sys.path:
    sys.path.insert(0, PROJECT_SETTINGS_PATH)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iles_backend.settings')
django.setup()

from core.models import Evaluation
from django.db.models import Count

duplicates = (
    Evaluation.objects.values('placement_id', 'evaluation_type')
    .annotate(c=Count('id'))
    .filter(c__gt=1)
)

if not duplicates:
    print('No duplicate evaluations found.')

for d in duplicates:
    qs = (
        Evaluation.objects
        .filter(placement_id=d['placement_id'], evaluation_type=d['evaluation_type'])
        .order_by('id')
    )
    keep = qs.first()
    to_delete = qs.exclude(pk=keep.pk)
    print(f"Found {d['c']} duplicates for placement {d['placement_id']} type {d['evaluation_type']}, deleting {to_delete.count()} rows")
    to_delete.delete()

print('Duplicate cleanup complete.')
