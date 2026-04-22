from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Asignatura, Activity, Subtask, Usuario
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .serializers import (
    AsignaturaSerializer, ActivitySerializer, SubtaskSerializer,
    RegisterSerializer, LoginSerializer, TareaHoySerializer
)


# ==============================
# CLASE BASE
# ==============================

class BaseView:
    def success(self, data, message="OK", status_code=status.HTTP_200_OK):
        return Response({"status": "success", "message": message, "data": data}, status=status_code)

    def error(self, message, data=None, status_code=status.HTTP_400_BAD_REQUEST):
        return Response({"status": "error", "message": message, "data": data}, status=status_code)


# ==============================
# AUTH
# ==============================

class RegisterView(BaseView, APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return self.success({
            "username": user.username,
            "email": user.email,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, "Usuario registrado exitosamente.", status.HTTP_201_CREATED)


class LoginView(BaseView, APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Verificar si el email existe
        try:
            user_obj = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return self.error(
                f"No existe una cuenta con el correo '{email}'.",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Verificar si la contrasena es correcta
        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return self.error(
                "La contrasena es incorrecta. Intentalo de nuevo.",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        if not user.activo:
            return self.error("Tu cuenta esta desactivada. Contacta al administrador.", status_code=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return self.success({
            "nombre": user.nombre,
            "apellido": user.apellido,
            "email": user.email,
            "rol": user.rol,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, "Login exitoso.")


# ==============================
# ASIGNATURAS
# ==============================

class AsignaturaListCreateAPIView(BaseView, generics.ListCreateAPIView):
    serializer_class = AsignaturaSerializer
    permission_classes = [IsAuthenticated]
    queryset = Asignatura.objects.all()

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return self.success(serializer.data, "Asignaturas obtenidas correctamente.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        serializer.save()
        return self.success(serializer.data, "Asignatura creada exitosamente.", status.HTTP_201_CREATED)


class AsignaturaRetrieveUpdateDestroyAPIView(BaseView, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AsignaturaSerializer
    permission_classes = [IsAuthenticated]
    queryset = Asignatura.objects.all()

    def get_object(self):
        try:
            return super().get_object()
        except Exception:
            raise NotFound(detail="Asignatura no encontrada.")

    def retrieve(self, request, *args, **kwargs):
        return self.success(self.get_serializer(self.get_object()).data, "Asignatura obtenida correctamente.")

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=kwargs.pop('partial', False))
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        serializer.save()
        return self.success(serializer.data, "Asignatura actualizada correctamente.")

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return self.success(None, "Asignatura eliminada correctamente.")


# ==============================
# ACTIVIDADES
# ==============================

class ActivityListCreateAPIView(BaseView, generics.ListCreateAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(usuario=self.request.user)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return self.success(serializer.data, "Actividades obtenidas correctamente.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        serializer.save(usuario=request.user)
        return self.success(serializer.data, "Actividad creada exitosamente.", status.HTTP_201_CREATED)


class ActivityRetrieveUpdateDestroyAPIView(BaseView, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(usuario=self.request.user)

    def get_object(self):
        try:
            return super().get_object()
        except Exception:
            raise NotFound(detail="Actividad no encontrada.")

    def retrieve(self, request, *args, **kwargs):
        return self.success(self.get_serializer(self.get_object()).data, "Actividad obtenida correctamente.")

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=kwargs.pop('partial', False))
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        serializer.save()
        return self.success(serializer.data, "Actividad actualizada correctamente.")

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return self.success(None, "Actividad eliminada correctamente.")


# ==============================
# SUBTAREAS
# ==============================

class SubtaskListCreateAPIView(BaseView, generics.ListCreateAPIView):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.filter(activity__usuario=self.request.user)

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return self.success(serializer.data, "Subtareas obtenidas correctamente.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        activity = serializer.validated_data.get('activity')
        if activity and activity.usuario != request.user:
            return self.error("No tienes permiso para agregar subtareas a esta actividad.", status_code=status.HTTP_403_FORBIDDEN)
        serializer.save()
        return self.success(serializer.data, "Subtarea creada exitosamente.", status.HTTP_201_CREATED)


class SubtaskRetrieveUpdateDestroyAPIView(BaseView, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.filter(activity__usuario=self.request.user)

    def get_object(self):
        try:
            return super().get_object()
        except Exception:
            raise NotFound(detail="Subtarea no encontrada.")

    def retrieve(self, request, *args, **kwargs):
        return self.success(self.get_serializer(self.get_object()).data, "Subtarea obtenida correctamente.")

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=kwargs.pop('partial', False))
        if not serializer.is_valid():
            return self.error("Datos invalidos.", serializer.errors)
        serializer.save()
        return self.success(serializer.data, "Subtarea actualizada correctamente.")

    def destroy(self, request, *args, **kwargs):
        self.get_object().delete()
        return self.success(None, "Subtarea eliminada correctamente.")


# ==============================
# REPROGRAMAR ACTIVIDAD
# ==============================

class ReprogramarActividadView(BaseView, APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        # Verificar que la actividad existe y pertenece al usuario
        try:
            actividad = Activity.objects.get(pk=pk, usuario=request.user)
        except Activity.DoesNotExist:
            return self.error(
                "Actividad no encontrada o no tienes permiso para modificarla.",
                status_code=status.HTTP_404_NOT_FOUND
            )

        nueva_fecha = request.data.get('due_date')

        # Validar que se envio la fecha
        if not nueva_fecha:
            return self.error("El campo due_date es requerido.", status_code=status.HTTP_400_BAD_REQUEST)

        # Validar formato de fecha
        from datetime import date
        try:
            from datetime import datetime
            fecha_parsed = datetime.strptime(nueva_fecha, '%Y-%m-%d').date()
        except ValueError:
            return self.error(
                "Formato de fecha incorrecto. Use el formato YYYY-MM-DD.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Validar que no sea fecha pasada
        if fecha_parsed < timezone.localdate():
            return self.error(
                "La fecha no puede ser anterior a la fecha actual.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Actualizar la fecha y updated_at
        actividad.due_date = fecha_parsed
        actividad.save()

        return self.success({
            "id": actividad.id,
            "title": actividad.title,
            "due_date": str(actividad.due_date),
            "updated_at": str(actividad.updated_at),
        }, "Actividad reprogramada correctamente.")


# ==============================
# TAREAS DE HOY
# ==============================

class TareasHoyView(BaseView, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.localdate()
        fin_semana = hoy + timezone.timedelta(days=7)
        tareas = Activity.objects.filter(usuario=request.user)

        # Escenario 3: estado vacio
        if not tareas.exists():
            return self.success({
                "empty": True,
                "mensaje": "No tienes tareas pendientes.",
                "contadores": {"hoy": 0, "esta_semana": 0, "atrasadas": 0},
                "vencidas": [],
                "hoy": [],
                "proximas": [],
            }, "No tienes tareas pendientes.")

        # Filtros opcionales: ?filtrar_por=dificultad|asignatura|horas_estimadas|progreso|fecha
        filtrar_por = request.query_params.get('filtrar_por', None)
        orden = 'horas_estimadas'  # orden por defecto (menor esfuerzo primero)

        if filtrar_por == 'dificultad':
            orden = 'difficulty'
        elif filtrar_por == 'asignatura':
            orden = 'asignatura'
        elif filtrar_por == 'horas_estimadas':
            orden = 'horas_estimadas'
        elif filtrar_por == 'fecha':
            orden = 'due_date'

        # Agrupacion y ordenamiento
        vencidas  = tareas.filter(due_date__lt=hoy).order_by(orden)
        hoy_tareas = tareas.filter(due_date=hoy).order_by(orden)
        proximas  = tareas.filter(due_date__gt=hoy).order_by(orden)

        # Contadores para el panel
        contadores = {
            "hoy": hoy_tareas.count(),
            "esta_semana": tareas.filter(due_date__gt=hoy, due_date__lte=fin_semana).count(),
            "atrasadas": vencidas.count(),
        }

        return self.success({
            "empty": False,
            "contadores": contadores,
            "vencidas": TareaHoySerializer(vencidas, many=True).data,
            "hoy": TareaHoySerializer(hoy_tareas, many=True).data,
            "proximas": TareaHoySerializer(proximas, many=True).data,
        }, "Tareas obtenidas correctamente.")