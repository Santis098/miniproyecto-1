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
    username = serializers.CharField(required=True)

    class Meta:
        model = Usuario
        fields = ('username', 'email', 'password', 'password2')
        extra_kwargs = {
            'username': {'validators': []},  # desactivar validador por defecto de Django
        }

    def validate_username(self, value):
        if Usuario.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya esta registrado.")
        return value

    def validate_email(self, value):
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electronico ya esta registrado.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contrasenas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = Usuario.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
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
    class Meta:
        model = Subtask
        fields = '__all__'

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "El título debe tener al menos 3 caracteres."
            )
        return value


# ==============================
# ACTIVIDADES
# ==============================

class ActivitySerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, required=False, write_only=True)

    title = serializers.CharField(required=True)
    due_date = serializers.DateField(required=True)
    description = serializers.CharField(required=True)
    start_date = serializers.DateField(required=True)
    difficulty = serializers.CharField(required=True)
    activity_type = serializers.CharField(required=True)

    class Meta:
        model = Activity
        fields = '__all__'

    def validate_due_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("La fecha de vencimiento no puede ser anterior a la fecha actual.")
        return value

    def validate_start_date(self, value):
        if value < timezone.now().date():
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
    progreso = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ['id', 'title', 'due_date', 'horas_estimadas', 'horas_trabajadas', 'progreso', 'difficulty', 'activity_type']

    def get_progreso(self, obj):
        if obj.horas_estimadas and obj.horas_estimadas > 0:
            return round((obj.horas_trabajadas / obj.horas_estimadas) * 100, 1)
        return 0