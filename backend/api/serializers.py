from rest_framework import serializers
from .models import Asignatura, Activity, Subtask
from django.utils import timezone

# Serializador de Asignaturas
class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'

# Serializador de Subtareas
class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = '__all__'


# Serializador de Actividades
class ActivitySerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, required=False, write_only=True)  # Permitir agregar subtareas al crear la actividad, y hacerlo opcional

    title = serializers.CharField(required=True)
    due_date = serializers.DateField(required=True)
    description = serializers.CharField(required=True)   # ahora es obligatoria
    start_date = serializers.DateField(required=True)
    difficulty = serializers.CharField(required=True)
    activity_type = serializers.CharField(required=True)

    class Meta:
        model = Activity
        fields = '__all__'

    # Validación personalizada de la fecha de vencimiento
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

    # Validación personalizada del título
    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres.")
        return value

    # Sobrescribir el método `create` para manejar la creación de la actividad y sus subtareas
    def create(self, validated_data):
        subtasks_data = validated_data.pop('subtasks', [])  # Extraemos las subtareas de los datos
        activity = Activity.objects.create(**validated_data)  # Creamos la actividad

        # Creamos las subtareas relacionadas con la actividad
        for subtask_data in subtasks_data:
            Subtask.objects.create(activity=activity, **subtask_data)
        
        return activity

    # Validación de la descripción
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