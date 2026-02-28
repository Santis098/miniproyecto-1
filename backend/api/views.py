from rest_framework import viewsets
from .models import Asignatura
from .serializers import AsignaturaSerializer


class AsignaturaViewSet(viewsets.ModelViewSet):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer