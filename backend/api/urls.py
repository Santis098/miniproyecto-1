from django.urls import path
from .views import (
    AsignaturaListCreateAPIView, AsignaturaRetrieveUpdateDestroyAPIView,
    ActivityListCreateAPIView, ActivityRetrieveUpdateDestroyAPIView,
    SubtaskListCreateAPIView, SubtaskRetrieveUpdateDestroyAPIView,
    RegisterView, LoginView, TareasHoyView, ReprogramarActividadView,
    LimiteHorasDiariasView, ValidarLimiteHorasView
)
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),

    # Asignaturas
    path('asignaturas/', AsignaturaListCreateAPIView.as_view(), name='asignatura-list-create'),
    path('asignaturas/<int:pk>/', AsignaturaRetrieveUpdateDestroyAPIView.as_view(), name='asignatura-detail'),

    # Actividades
    path('activities/', ActivityListCreateAPIView.as_view(), name='activity-list-create'),
    path('activities/<int:pk>/', ActivityRetrieveUpdateDestroyAPIView.as_view(), name='activity-detail'),
    path('activities/<int:pk>/reprogramar/', ReprogramarActividadView.as_view(), name='activity-reprogramar'),

    # Subtareas
    path('subtasks/', SubtaskListCreateAPIView.as_view(), name='subtask-list-create'),
    path('subtasks/<int:pk>/', SubtaskRetrieveUpdateDestroyAPIView.as_view(), name='subtask-detail'),
    path('tasks/hoy/', TareasHoyView.as_view(), name='tasks-hoy'),

    # Limite horas y validacion
    path('usuario/limite-horas/', LimiteHorasDiariasView.as_view(), name='limite-horas'),
    path('validar/limite-horas/', ValidarLimiteHorasView.as_view(), name='validar-limite-horas'),

    # Swagger
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]