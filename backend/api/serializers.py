from rest_framework import serializers
from .models import Asignatura, Activity, Subtask


class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'
        
class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = '__all__'

class ActivitySerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, read_only=True)
    class Meta:
        model = Activity
        fields = '__all__'