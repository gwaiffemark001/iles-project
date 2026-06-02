from django.core.management.base import BaseCommand
from django.test.client import RequestFactory
import json
from typing import Any, cast

from django.contrib.auth import get_user_model

from core.views import ChatContactsView


class Command(BaseCommand):
    help = 'Dump serialized chat contacts for a given user id (prints JSON)'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=int, default=1, help='User ID to dump contacts for')

    def handle(self, *args, **options):
        User = get_user_model()
        user_id = options.get('user_id')
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f'User with id={user_id} not found'))
            return

        factory = RequestFactory()
        request = factory.get('/api/chat/contacts/')
        # attach user and basic META so serializers can build absolute URLs if needed
        request.user = user
        # Build a minimal request object with build_absolute_uri
        def build_absolute_uri(location: str | None = None) -> str:
            # Attempt to use SITE env or localhost default
            if not location:
                return 'http://localhost:8000/'
            if location.startswith('http'):
                return location
            return f'http://localhost:8000{location}'

        request_with_uri_builder = cast(Any, request)
        request_with_uri_builder.build_absolute_uri = build_absolute_uri

        view = ChatContactsView.as_view()
        response = view(request)

        # response can be a DRF Response; its .data contains serialized payload
        data = getattr(response, 'data', None)
        self.stdout.write(json.dumps(data, default=str, indent=2))
