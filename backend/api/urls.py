from django.urls import path
from .views import AsignaturaListCreateAPIView, AsignaturaRetrieveUpdateDestroyAPIView, ActivityListCreateAPIView, ActivityRetrieveUpdateDestroyAPIView, SubtaskListCreateAPIView, SubtaskRetrieveUpdateDestroyAPIView

urlpatterns = [
    # Rutas para Asignaturas
    path('api/asignaturas/', AsignaturaListCreateAPIView.as_view(), name='asignatura-list-create'),  # Listar y crear asignaturas
    path('api/asignaturas/<int:pk>/', AsignaturaRetrieveUpdateDestroyAPIView.as_view(), name='asignatura-retrieve-update-destroy'),  # Ver, actualizar y eliminar asignaturas

    # Rutas para Actividades
    path('api/activities/', ActivityListCreateAPIView.as_view(), name='activity-list-create'),  # Listar y crear actividades
    path('api/activities/<int:pk>/', ActivityRetrieveUpdateDestroyAPIView.as_view(), name='activity-retrieve-update-destroy'),  # Ver, actualizar y eliminar actividades

    # Rutas para Subtareas
    path('api/subtasks/', SubtaskListCreateAPIView.as_view(), name='subtask-list-create'),  # Listar y crear subtareas
    path('api/subtasks/<int:pk>/', SubtaskRetrieveUpdateDestroyAPIView.as_view(), name='subtask-retrieve-update-destroy'),  # Ver, actualizar y eliminar subtareas
]