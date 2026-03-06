from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import AsignaturaViewSet
from .views import ActivityCreateAPIView, ActivityListAPIView, SubtaskCreateAPIView, SubtaskListAPIView

router = DefaultRouter()
router.register(r'asignaturas', AsignaturaViewSet)

urlpatterns = [
    # Rutas para Activities
    path('api/activities/', ActivityListAPIView.as_view(), name='activity-list'),  # Listar todas las actividades
    path('api/activities/create/', ActivityCreateAPIView.as_view(), name='activity-create'),  # Crear una nueva actividad

    # Rutas para Subtasks
    path('api/subtasks/', SubtaskListAPIView.as_view(), name='subtask-list'),  # Listar todas las subtareas
    path('api/subtasks/create/', SubtaskCreateAPIView.as_view(), name='subtask-create'),  # Crear una nueva subtarea
]