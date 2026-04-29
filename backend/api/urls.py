from django.urls import path
from .views import (
    AsignaturaListCreateAPIView, AsignaturaRetrieveUpdateDestroyAPIView,
    ActivityListCreateAPIView, ActivityRetrieveUpdateDestroyAPIView,
    SubtaskListCreateAPIView, SubtaskRetrieveUpdateDestroyAPIView,
    RegisterView, LoginView, TareasHoyView, ReprogramarActividadView,
    LimiteHorasDiariasView, ValidarLimiteHorasView,
    SubtaskPatchView,
    RegisterV2View, LoginV2View,
    ActivityCreateV2View, SubtaskCreateV2View,
    ReprogramarActividadV2View,
    ValidarLimiteHorasV2View, SubtaskPatchV2View,
    ActivityDistribuirView,
    # FIX: ActivityListV2View se une con ActivityCreateV2View en una sola vista
    ActivityV2View,
    TareasHoyV2View,
    SubtaskEstadoView,
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

    # Sprint 2
    path('subtasks/<int:pk>/patch/', SubtaskPatchView.as_view(), name='subtask-patch'),

    # Sprint 3
    path('v2/auth/register/', RegisterV2View.as_view(), name='v2-register'),
    path('v2/auth/login/', LoginV2View.as_view(), name='v2-login'),
    # FIX: una sola ruta v2/activities/ que maneja GET y POST
    path('v2/activities/', ActivityV2View.as_view(), name='v2-activities'),
    path('v2/subtasks/', SubtaskCreateV2View.as_view(), name='v2-subtask-create'),
    path('v2/activities/<int:pk>/reprogramar/', ReprogramarActividadV2View.as_view(), name='v2-activity-reprogramar'),

    # Sprint 4
    path('v2/validar/limite-horas/', ValidarLimiteHorasV2View.as_view(), name='v2-validar-limite'),
    path('v2/subtasks/<int:pk>/patch/', SubtaskPatchV2View.as_view(), name='v2-subtask-patch'),

    # Sprint 4b
    path('v2/activities/distribuir/', ActivityDistribuirView.as_view(), name='v2-activity-distribuir'),

    # Sprint 5
    path('v2/tasks/hoy/', TareasHoyV2View.as_view(), name='v2-tasks-hoy'),

    # Sprint 6 — Estado de subtarea
    path('v2/subtasks/<int:pk>/estado/', SubtaskEstadoView.as_view(), name='v2-subtask-estado'),

    # Swagger
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]