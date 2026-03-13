# Generated manually to fix migration conflict on Render
# Adds asignatura, usuario, horas_estimadas, horas_trabajadas to Activity
# Uses conditional checks to avoid "column already exists" errors

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def add_fields_if_not_exist(apps, schema_editor):
    """Manually add columns only if they don't already exist."""
    db_alias = schema_editor.connection.alias
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        # Get existing columns for api_activity
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'api_activity'
        """)
        existing_columns = {row[0] for row in cursor.fetchall()}

    # Add asignatura_id if missing
    if 'asignatura_id' not in existing_columns:
        schema_editor.execute(
            "ALTER TABLE api_activity ADD COLUMN asignatura_id bigint NULL "
            "REFERENCES api_asignatura(id) ON DELETE SET NULL"
        )

    # Add usuario_id if missing
    if 'usuario_id' not in existing_columns:
        schema_editor.execute(
            "ALTER TABLE api_activity ADD COLUMN usuario_id bigint NULL "
            "REFERENCES api_usuario(id) ON DELETE CASCADE"
        )

    # Add horas_estimadas if missing
    if 'horas_estimadas' not in existing_columns:
        schema_editor.execute(
            "ALTER TABLE api_activity ADD COLUMN horas_estimadas double precision NOT NULL DEFAULT 0"
        )

    # Add horas_trabajadas if missing
    if 'horas_trabajadas' not in existing_columns:
        schema_editor.execute(
            "ALTER TABLE api_activity ADD COLUMN horas_trabajadas double precision NOT NULL DEFAULT 0"
        )


def reverse_fields(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_activity_activity_type_activity_difficulty_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(add_fields_if_not_exist, reverse_fields),

        # Let Django know about the fields in its migration state
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='activity',
                    name='asignatura',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='actividades',
                        to='api.asignatura',
                    ),
                ),
                migrations.AddField(
                    model_name='activity',
                    name='usuario',
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='actividades',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name='activity',
                    name='horas_estimadas',
                    field=models.FloatField(default=0),
                ),
                migrations.AddField(
                    model_name='activity',
                    name='horas_trabajadas',
                    field=models.FloatField(default=0),
                ),
            ],
            database_operations=[],  # Already handled by RunPython above
        ),
    ]