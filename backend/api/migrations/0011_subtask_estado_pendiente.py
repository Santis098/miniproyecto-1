from django.db import migrations, models


def set_pendiente_para_no_chuleadas(apps, schema_editor):
    """
    Las subtareas que no han sido chuleadas (is_completed=False) y estaban
    con el default viejo 'hecha' deben pasar a 'pendiente' para que el
    progreso refleje correctamente lo que el usuario ya marco como hecho.
    """
    Subtask = apps.get_model('api', 'Subtask')
    Subtask.objects.filter(is_completed=False, estado='hecha').update(estado='pendiente')


def revert_pendiente(apps, schema_editor):
    """Reversa la migracion de datos: deja todo como 'hecha' (default viejo)."""
    Subtask = apps.get_model('api', 'Subtask')
    Subtask.objects.filter(estado='pendiente').update(estado='hecha')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_subtask_estado_nota'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subtask',
            name='estado',
            field=models.CharField(
                choices=[
                    ('pendiente', 'Pendiente'),
                    ('hecha', 'Hecha'),
                    ('pospuesta', 'Pospuesta'),
                ],
                default='pendiente',
                max_length=10,
            ),
        ),
        migrations.RunPython(set_pendiente_para_no_chuleadas, revert_pendiente),
    ]
