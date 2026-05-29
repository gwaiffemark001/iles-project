from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = "core"

    def ready(self):
        from . import signals  # noqa: F401
"""
a
b
c
d
e
f
g
h
i
globalj
k
t
f
e
y
j
u
kg
r
t
h
h
"""        