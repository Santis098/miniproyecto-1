from rest_framework import viewsets
from .models import Asignatura, Activity, Subtask
from .serializers import AsignaturaSerializer, ActivitySerializer, SubtaskSerializer
from rest_framework.response import Response
from rest_framework import status


class AsignaturaViewSet(viewsets.ModelViewSet):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

    def create(self, request, *args, **kwargs):
        # Sobrescribimos el método create para que pueda manejar las subtareas
        activity_data = request.data
        subtasks_data = activity_data.pop('subtasks', [])

        # Creamos la actividad
        activity = Activity.objects.create(**activity_data)

        # Creamos las subtareas asociadas a la actividad
        for subtask_data in subtasks_data:
            Subtask.objects.create(activity=activity, **subtask_data)

        # Retornamos la respuesta con los datos de la actividad recién creada
        serializer = self.get_serializer(activity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubtaskViewSet(viewsets.ModelViewSet):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer