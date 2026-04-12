from rest_framework import serializers
from .models import Asignatura, Activity, Subtask, Usuario
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password

# ==============================
# AUTH SERIALIZERS  ← NUEVO
# ==============================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    nombre = serializers.CharField(required=True)
    apellido = serializers.CharField(required=True)

    class Meta:
        model = Usuario
        fields = ('nombre', 'apellido', 'email', 'password', 'password2')

    def validate_nombre(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Ingresa tu nombre.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
        return value.strip()

    def validate_apellido(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Ingresa tu apellido.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("El apellido debe tener al menos 2 caracteres.")
        return value.strip()

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Ingresa tu correo electronico.")
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electronico ya esta registrado.")
        return value

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Minimo 6 caracteres para contrasena.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contrasenas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        import uuid
        # Generar username unico a partir del email
        username = validated_data['email'].split('@')[0] + '_' + str(uuid.uuid4())[:4]
        user = Usuario.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            nombre=validated_data['nombre'],
            apellido=validated_data['apellido'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


# ==============================
# ASIGNATURAS
# ==============================

class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'


# ==============================
# SUBTAREAS
# ==============================

class SubtaskSerializer(serializers.ModelSerializer):
    fecha = serializers.DateField(required=False, allow_null=True)
    horas_estimadas = serializers.FloatField(required=False, allow_null=True, default=0)

    class Meta:
        model = Subtask
        fields = '__all__'

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "El titulo debe tener al menos 3 caracteres."
            )
        return value


# ==============================
# ACTIVIDADES
# ==============================

class ActivitySerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, required=False, write_only=True)
    asignatura_nombre = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        write_only=True
    )
    asignatura_detalle = serializers.SerializerMethodField()

    title = serializers.CharField(required=True)
    due_date = serializers.DateField(required=True)
    description = serializers.CharField(required=True)
    start_date = serializers.DateField(required=True)
    difficulty = serializers.CharField(required=True)
    activity_type = serializers.CharField(required=True)

    class Meta:
        model = Activity
        fields = '__all__'

    def get_asignatura_detalle(self, obj):
        if obj.asignatura:
            return obj.asignatura.nombre
        return None

    def validate_due_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("La fecha de vencimiento no puede ser anterior a la fecha actual.")
        return value

    def validate_start_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError(
            "La fecha de inicio no puede ser anterior a la fecha actual."
        )
        return value

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres.")
        return value

    def create(self, validated_data):
        subtasks_data = validated_data.pop('subtasks', [])
        asignatura_nombre = validated_data.pop('asignatura_nombre', None)

        # Si viene nombre de asignatura, buscarla o crearla automaticamente
        if asignatura_nombre and asignatura_nombre.strip():
            asignatura_obj = Asignatura.objects.filter(nombre__iexact=asignatura_nombre.strip()).first()
            if not asignatura_obj:
                # Generar codigo unico basado en el nombre
                import re, uuid
                codigo_base = re.sub(r'[^a-zA-Z0-9]', '', asignatura_nombre).upper()[:10]
                codigo = f"{codigo_base}_{str(uuid.uuid4())[:4].upper()}"
                asignatura_obj = Asignatura.objects.create(
                    nombre=asignatura_nombre.strip(),
                    codigo=codigo,
                    creditos=0
                )
            validated_data['asignatura'] = asignatura_obj

        activity = Activity.objects.create(**validated_data)
        for subtask_data in subtasks_data:
            Subtask.objects.create(activity=activity, **subtask_data)
        return activity

    def validate_description(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "La descripción debe tener al menos 3 caracteres.."
            )
        return value

    def validate_difficulty(self, value):
        opciones = ["baja", "media", "alta", "critica"]
        if value.lower() not in opciones:
            raise serializers.ValidationError(
            "La dificultad debe ser: baja, media, alta o critica."
        )
        return value

    def validate_activity_type(self, value):
        tipos = ["exam", "project", "presentation", "homework"]
        if value.lower() not in tipos:
            raise serializers.ValidationError(
            "El tipo de actividad debe ser: exam, project, presentation o homework."
        )
        return value
class TareaHoySerializer(serializers.ModelSerializer):
    progreso_horas = serializers.SerializerMethodField()
    progreso_subtareas = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id', 'title', 'description', 'due_date', 'start_date',
            'horas_estimadas', 'horas_trabajadas', 'progreso_horas',
            'progreso_subtareas', 'difficulty', 'activity_type', 'asignatura'
        ]

    def get_progreso_horas(self, obj):
        # Progreso basado en horas trabajadas vs estimadas
        if obj.horas_estimadas and obj.horas_estimadas > 0:
            return round((obj.horas_trabajadas / obj.horas_estimadas) * 100, 1)
        return 0

    def get_progreso_subtareas(self, obj):
        # Progreso basado en subtareas completadas vs total
        total = obj.subtasks.count()
        if total == 0:
            return {"completadas": 0, "total": 0, "porcentaje": 0}
        completadas = obj.subtasks.filter(is_completed=True).count()
        return {
            "completadas": completadas,
            "total": total,
            "porcentaje": round((completadas / total) * 100, 1)
        }