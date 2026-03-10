from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Asignatura, Activity, Subtask
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .serializers import (
    AsignaturaSerializer, ActivitySerializer, SubtaskSerializer,
    RegisterSerializer, LoginSerializer, TareaHoySerializer  # ← agregar este
)

# ==============================
# AUTH VIEWS  ← NUEVO
# ==============================

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "mensaje": "Usuario registrado exitosamente.",
                "username": user.username,
                "email": user.email,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    "mensaje": "Login exitoso.",
                    "username": user.username,
                    "email": user.email,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=status.HTTP_200_OK)
            return Response(
                {"error": "Credenciales incorrectas."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==============================
# ASIGNATURAS
# ==============================

class AsignaturaListCreateAPIView(generics.ListCreateAPIView):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer

class AsignaturaRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer


# ==============================
# ACTIVIDADES
# ==============================

class ActivityListCreateAPIView(generics.ListCreateAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

class ActivityRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer


# ==============================
# SUBTAREAS
# ==============================

class SubtaskListCreateAPIView(generics.ListCreateAPIView):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer

class SubtaskRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subtask.objects.all()
    serializer_class = SubtaskSerializer
class TareasHoyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.now().date()
        tareas = Activity.objects.filter(usuario=request.user)

        vencidas = tareas.filter(due_date__lt=hoy)
        hoy_tareas = tareas.filter(due_date=hoy)
        proximas = tareas.filter(due_date__gt=hoy)

        return Response({
            "vencidas": TareaHoySerializer(vencidas, many=True).data,
            "hoy": TareaHoySerializer(hoy_tareas, many=True).data,
            "proximas": TareaHoySerializer(proximas, many=True).data,
        })