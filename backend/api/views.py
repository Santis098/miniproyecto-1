from rest_framework import generics
from .models import Asignatura, Activity, Subtask
from .serializers import AsignaturaSerializer, ActivitySerializer, SubtaskSerializer

# Vista para listar y crear Asignaturas
class AsignaturaListCreateAPIView(generics.ListCreateAPIView):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer

# Vista para ver, actualizar y eliminar una Asignatura
class AsignaturaRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer

# Vista para listar y crear Actividades
class ActivityListCreateAPIView(generics.ListCreateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

# Vista para ver, actualizar y eliminar una Actividad
class ActivityRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

# Vista para listar y crear Subtareas
class SubtaskListCreateAPIView(generics.ListCreateAPIView):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer

# Vista para ver, actualizar y eliminar una Subtarea
class SubtaskRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer