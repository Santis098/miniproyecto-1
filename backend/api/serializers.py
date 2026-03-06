from rest_framework import serializers
from .models import Asignatura, Activity, Subtask


class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'
        
from rest_framework import serializers
from .models import Activity, Subtask


# Serializador de Subtareas
class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = '__all__'


# Serializador de Actividades
class ActivitySerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)

    # Validación del título: es obligatorio
    title = serializers.CharField(required=True)

    # Validación de due_date: es obligatorio y debe ser una fecha futura
    due_date = serializers.DateField(required=True)

    class Meta:
        model = Activity
        fields = '__all__'

    # Validación personalizada si necesitas más control sobre la fecha (opcional)
    def validate_due_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("La fecha de vencimiento no puede ser anterior a la fecha actual.")
        return value

    # Validación personalizada del título (por si necesitas alguna condición extra)
    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres.")
        return value