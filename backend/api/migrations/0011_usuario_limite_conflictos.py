from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_subtask_estado_nota'),
    ]

    operations = [
        migrations.AddField(
            model_name='usuario',
            name='limite_conflictos_pendientes',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='usuario',
            name='limite_conflictos_valor',
            field=models.FloatField(blank=True, null=True),
        ),
    ]