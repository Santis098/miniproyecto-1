from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import AsignaturaViewSet, ActivityViewSet, SubtaskViewSet

router = DefaultRouter()
router.register(r'asignaturas', AsignaturaViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'subtasks', SubtaskViewSet)
urlpatterns = [
    path('', include(router.urls)),
]
