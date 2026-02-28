from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import AsignaturaViewSet

router = DefaultRouter()
router.register(r'asignaturas', AsignaturaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]