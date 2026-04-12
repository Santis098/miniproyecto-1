from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_usuario_nombre_apellido'),
    ]

    operations = [
        migrations.AddField(
            model_name='subtask',
            name='fecha',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='subtask',
            name='horas_estimadas',
            field=models.FloatField(blank=True, default=0, null=True),
        ),
    ]