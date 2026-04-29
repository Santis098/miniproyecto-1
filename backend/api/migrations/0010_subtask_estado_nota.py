from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_activity_updated_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='subtask',
            name='estado',
            field=models.CharField(
                choices=[('hecha', 'Hecha'), ('pospuesta', 'Pospuesta')],
                default='hecha',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='subtask',
            name='nota',
            field=models.TextField(blank=True, null=True),
        ),
    ]