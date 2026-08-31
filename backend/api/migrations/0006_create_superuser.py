from django.db import migrations

def create_default_superuser(apps, schema_editor):
    # Retrieve the User model from the historical state of the database
    User = apps.get_model('auth', 'User')
    if not User.objects.filter(is_superuser=True).exists():
        # Using a custom creation since create_superuser is not directly available on historical model manager
        from django.contrib.auth.hashers import make_password
        admin_user = User(
            username='admin',
            email='admin@uzimahisab.com',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            password=make_password('adminpassword123')
        )
        admin_user.save()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_transaction_date'),
    ]

    operations = [
        migrations.RunPython(create_default_superuser),
    ]
