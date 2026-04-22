from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_subtask_fecha_horas'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='limite_horas_diarias',
            field=models.FloatField(default=6),
        ),
        migrations.AddField(
            model_name='activity',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]