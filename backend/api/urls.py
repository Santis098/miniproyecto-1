from django.urls import path
from .views import (
    AsignaturaListCreateAPIView, AsignaturaRetrieveUpdateDestroyAPIView,
    ActivityListCreateAPIView, ActivityRetrieveUpdateDestroyAPIView,
    SubtaskListCreateAPIView, SubtaskRetrieveUpdateDestroyAPIView,
    RegisterView, LoginView, TareasHoyView  # ← agregar TareasHoyView
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerUIView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),

    # Asignaturas
    path('asignaturas/', AsignaturaListCreateAPIView.as_view(), name='asignatura-list-create'),
    path('asignaturas/<int:pk>/', AsignaturaRetrieveUpdateDestroyAPIView.as_view(), name='asignatura-detail'),

    # Actividades
    path('activities/', ActivityListCreateAPIView.as_view(), name='activity-list-create'),
    path('activities/<int:pk>/', ActivityRetrieveUpdateDestroyAPIView.as_view(), name='activity-detail'),

    # Subtareas
    path('subtasks/', SubtaskListCreateAPIView.as_view(), name='subtask-list-create'),
    path('subtasks/<int:pk>/', SubtaskRetrieveUpdateDestroyAPIView.as_view(), name='subtask-detail'),
    path('tasks/hoy/', TareasHoyView.as_view(), name='tasks-hoy'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerUIView.as_view(url_name='schema'), name='swagger-ui'),
]