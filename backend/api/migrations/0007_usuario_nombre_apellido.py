from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_activity_fix'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='nombre',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='usuario',
            name='apellido',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]