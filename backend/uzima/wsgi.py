"""
WSGI config for uzima project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'uzima.settings')

application = get_wsgi_application()

# Automatically apply migrations on serverless startup when connected to NeonDB
if os.environ.get('DATABASE_URL'):
    try:
        from django.core.management import call_command
        call_command('migrate', interactive=False)
    except Exception as e:
        print("Online auto-migrate note:", e)

app = application
