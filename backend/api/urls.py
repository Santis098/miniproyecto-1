from django.urls import path
from .views import (
    AsignaturaListCreateAPIView, AsignaturaRetrieveUpdateDestroyAPIView,
    ActivityListCreateAPIView, ActivityRetrieveUpdateDestroyAPIView,
    SubtaskListCreateAPIView, SubtaskRetrieveUpdateDestroyAPIView,
    RegisterView, LoginView, TareasHoyView, ReprogramarActividadView,
    LimiteHorasDiariasView, ValidarLimiteHorasView,
    SubtaskPatchView,  # Sprint 2
    # Sprint 3
    RegisterV2View, LoginV2View,
    ActivityCreateV2View, SubtaskCreateV2View,
    ReprogramarActividadV2View,
    # Sprint 4
    ValidarLimiteHorasV2View, SubtaskPatchV2View,
    ActivityDistribuirView,  # Sprint 4b
    # Sprint 5
    ActivityListV2View, TareasHoyV2View,
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

    # Sprint 2 — PATCH parcial de subtarea con re-validacion y concurrencia
    path('subtasks/<int:pk>/patch/', SubtaskPatchView.as_view(), name='subtask-patch'),

    # Sprint 3 — Respuestas unificadas, códigos HTTP semánticos e idempotencia
    path('v2/auth/register/', RegisterV2View.as_view(), name='v2-register'),
    path('v2/auth/login/', LoginV2View.as_view(), name='v2-login'),
    path('v2/activities/', ActivityCreateV2View.as_view(), name='v2-activity-create'),
    path('v2/subtasks/', SubtaskCreateV2View.as_view(), name='v2-subtask-create'),
    path('v2/activities/<int:pk>/reprogramar/', ReprogramarActividadV2View.as_view(), name='v2-activity-reprogramar'),

    # Sprint 5 — Exclusión de actividades completadas
    path('v2/activities/', ActivityListV2View.as_view(), name='v2-activity-list'),
    path('v2/tasks/hoy/', TareasHoyV2View.as_view(), name='v2-tasks-hoy'),

    # Sprint 4b — Distribución automática de actividades
    path('v2/activities/distribuir/', ActivityDistribuirView.as_view(), name='v2-activity-distribuir'),

    # Sprint 4 — Cálculos precisos, payload math y sanitización de tipos
    path('v2/validar/limite-horas/', ValidarLimiteHorasV2View.as_view(), name='v2-validar-limite'),
    path('v2/subtasks/<int:pk>/patch/', SubtaskPatchV2View.as_view(), name='v2-subtask-patch'),

    # Swagger
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]