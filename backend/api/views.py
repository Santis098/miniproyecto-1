from rest_framework import viewsets
from rest_framework import generics
from .models import Asignatura, Activity, Subtask
from .serializers import AsignaturaSerializer, ActivitySerializer, SubtaskSerializer



class AsignaturaViewSet(viewsets.ModelViewSet):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer
    
# Vista para crear una nueva Actividad
class ActivityCreateAPIView(generics.CreateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer


# Vista para listar todas las Actividades
class ActivityListAPIView(generics.ListAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer


# Vista para crear una nueva Subtarea
class SubtaskCreateAPIView(generics.CreateAPIView):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer


# Vista para listar todas las Subtareas
class SubtaskListAPIView(generics.ListAPIView):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer