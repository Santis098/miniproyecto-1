from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('USER', 'Usuario'),
    )

    rol = models.CharField(max_length=20, choices=ROLES, default='USER')
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.username


class Asignatura(models.Model):
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)
    creditos = models.IntegerField()
    descripcion = models.TextField(blank=True)

    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='asignaturas_dictadas'
    )

    estudiantes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='asignaturas_inscritas',
        blank=True
    )

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class Activity(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField()
    start_date = models.DateField(null=True, blank=True)
    difficulty = models.CharField(max_length=20, null=True, blank=True)
    activity_type = models.CharField(max_length=20, null=True, blank=True)
    asignatura = models.ForeignKey(        # ← NUEVO
        'Asignatura',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actividades'
    )
    created_at = models.DateTimeField(auto_now_add=True)

class Subtask(models.Model):
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)

    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name="subtasks"
    )

    def __str__(self):
        return self.title