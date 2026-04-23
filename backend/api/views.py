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

# ==============================
# LIMITE HORAS DIARIAS
# ==============================

class LimiteHorasDiariasView(BaseView, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Devolver el limite actual del usuario (default 6)
        limite = getattr(request.user, 'limite_horas_diarias', 6)
        return self.success({
            "limite_horas_diarias": limite
        }, "Limite de horas diarias obtenido correctamente.")

    def put(self, request):
        limite = request.data.get('limite_horas_diarias')
        if limite is None:
            return self.error("El campo limite_horas_diarias es requerido.")
        try:
            limite = float(limite)
            if limite <= 0 or limite > 24:
                return self.error("El limite debe ser entre 1 y 24 horas.")
        except (ValueError, TypeError):
            return self.error("El limite debe ser un numero valido.")

        request.user.limite_horas_diarias = limite
        request.user.save()
        return self.success({
            "limite_horas_diarias": limite
        }, "Limite de horas diarias actualizado correctamente.")


# ==============================
# VALIDACION LIMITE Y SUGERENCIA
# ==============================

class ValidarLimiteHorasView(BaseView, APIView):
    permission_classes = [IsAuthenticated]

    def _get_limite(self, user):
        return getattr(user, 'limite_horas_diarias', 6)

    def _horas_usadas_en_dia(self, user, fecha, excluir_subtarea_id=None):
        from django.db.models import Sum
        # Horas de actividades en ese dia
        horas_actividades = Activity.objects.filter(
            usuario=user,
            due_date=fecha
        ).aggregate(total=Sum('horas_estimadas'))['total'] or 0

        # Horas de subtareas en ese dia
        subtareas = Subtask.objects.filter(
            activity__usuario=user,
            fecha=fecha
        )
        if excluir_subtarea_id:
            subtareas = subtareas.exclude(id=excluir_subtarea_id)
        horas_subtareas = subtareas.aggregate(total=Sum('horas_estimadas'))['total'] or 0

        return horas_actividades + horas_subtareas

    def _buscar_dia_disponible(self, user, desde_fecha, horas_necesarias):
        from datetime import timedelta
        limite = self._get_limite(user)
        fecha = desde_fecha
        # Buscar en los proximos 30 dias
        for _ in range(30):
            fecha = fecha + timedelta(days=1)
            # Saltar fines de semana
            if fecha.weekday() >= 5:
                continue
            horas_usadas = self._horas_usadas_en_dia(user, fecha)
            if (limite - horas_usadas) >= horas_necesarias:
                return fecha
        return None

    def post(self, request):
        from datetime import timedelta
        from django.db.models import Sum

        tipo = request.data.get('tipo')  # 'actividad' o 'subtarea'
        fecha = request.data.get('fecha')
        horas = request.data.get('horas_estimadas', 0)

        if not fecha or not tipo:
            return self.error("Los campos tipo y fecha son requeridos.")

        try:
            from datetime import datetime
            fecha_parsed = datetime.strptime(fecha, '%Y-%m-%d').date()
            horas = float(horas)
        except (ValueError, TypeError):
            return self.error("Formato de fecha o horas incorrecto.")

        limite = self._get_limite(request.user)
        horas_usadas = self._horas_usadas_en_dia(request.user, fecha_parsed)
        horas_disponibles = limite - horas_usadas

        # Si no excede el limite, permitir
        if horas_usadas + horas <= limite:
            return self.success({
                "permite": True,
                "horas_usadas": horas_usadas,
                "horas_disponibles": horas_disponibles,
                "limite": limite
            }, "Dentro del limite de horas diarias.")

        # Excede el limite — calcular sugerencia
        # Buscar subtarea del dia con actividad de entrega mas lejana
        subtareas_del_dia = Subtask.objects.filter(
            activity__usuario=request.user,
            fecha=fecha_parsed
        ).select_related('activity').order_by('-activity__due_date')

        tarea_a_mover = None
        if subtareas_del_dia.exists():
            tarea_a_mover = subtareas_del_dia.first()

        # Buscar dia disponible
        dia_sugerido = self._buscar_dia_disponible(request.user, fecha_parsed, horas)

        sugerencia = None
        if tarea_a_mover and dia_sugerido:
            sugerencia = {
                "task_to_move_id": tarea_a_mover.id,
                "task_to_move_title": tarea_a_mover.title,
                "suggested_date": str(dia_sugerido),
                "mensaje": f"Te sugerimos mover '{tarea_a_mover.title}' al {dia_sugerido.strftime('%d/%m/%Y')} que tiene capacidad disponible."
            }
        elif dia_sugerido:
            sugerencia = {
                "suggested_date": str(dia_sugerido),
                "mensaje": f"Te sugerimos programar esta tarea para el {dia_sugerido.strftime('%d/%m/%Y')}."
            }

        return Response({
            "status": "limit_exceeded",
            "message": f"Supera el limite de {limite}h diarias. Horas usadas: {horas_usadas}h, disponibles: {horas_disponibles}h.",
            "horas_usadas": horas_usadas,
            "horas_disponibles": horas_disponibles,
            "limite": limite,
            "suggestion": sugerencia
        }, status=422)

# ==============================
# SPRINT 2 — PATCH PARCIAL DE SUBTAREA
# PATCH /subtasks/{id}/patch/
#
# Permite actualizar solo fecha, solo horas_estimadas, solo is_completed,
# o cualquier combinacion de ellos sin enviar el objeto completo.
#
# Re-validaciones que hace este endpoint (no confia en el Front):
#   1. Si cambian las horas: total_horas_del_dia + nuevas_horas <= limite_diario
#   2. Si cambia la fecha:  total_horas_del_nuevo_dia + horas_tarea <= limite_diario
#   3. Concurrencia: usa select_for_update() dentro de una transaccion atomica
#      para que otra sesion no llene el espacio libre entre la validacion y el guardado.
# ==============================

class SubtaskPatchView(BaseView, APIView):
    permission_classes = [IsAuthenticated]

    def _horas_usadas_en_dia(self, user, fecha, excluir_subtarea_id=None):
        """Reutiliza la misma logica de calculo de horas que ValidarLimiteHorasView."""
        from django.db.models import Sum
        horas_actividades = Activity.objects.filter(
            usuario=user,
            due_date=fecha
        ).aggregate(total=Sum('horas_estimadas'))['total'] or 0

        subtareas = Subtask.objects.filter(
            activity__usuario=user,
            fecha=fecha
        )
        if excluir_subtarea_id:
            subtareas = subtareas.exclude(id=excluir_subtarea_id)
        horas_subtareas = subtareas.aggregate(total=Sum('horas_estimadas'))['total'] or 0

        return horas_actividades + horas_subtareas

    def patch(self, request, pk):
        from django.db import transaction
        from .serializers import SubtaskPatchSerializer

        # ── 1. Obtener la subtarea con bloqueo de fila (concurrencia)
        #    select_for_update() bloquea el registro hasta que la transaccion termine,
        #    evitando que otra sesion simultanea ocupe el mismo espacio de horas.
        try:
            with transaction.atomic():
                subtarea = (
                    Subtask.objects
                    .select_for_update()
                    .select_related('activity')
                    .get(pk=pk, activity__usuario=request.user)
                )

                # ── 2. Deserializar y validar campos recibidos (parcial=True)
                serializer = SubtaskPatchSerializer(
                    subtarea,
                    data=request.data,
                    partial=True
                )
                if not serializer.is_valid():
                    return self.error("Datos invalidos.", serializer.errors)

                nueva_fecha = serializer.validated_data.get('fecha', subtarea.fecha)
                nuevas_horas = serializer.validated_data.get('horas_estimadas', subtarea.horas_estimadas or 0)
                limite = getattr(request.user, 'limite_horas_diarias', 6)

                # ── 3a. Re-validar si cambian las horas en el mismo dia
                if 'horas_estimadas' in serializer.validated_data and nueva_fecha == subtarea.fecha:
                    horas_usadas = self._horas_usadas_en_dia(
                        request.user,
                        nueva_fecha or subtarea.fecha,
                        excluir_subtarea_id=subtarea.id
                    )
                    if horas_usadas + nuevas_horas > limite:
                        return Response({
                            "status": "limit_exceeded",
                            "message": (
                                f"Las nuevas horas ({nuevas_horas}h) superan el limite diario. "
                                f"Horas usadas ese dia: {horas_usadas}h, limite: {limite}h."
                            ),
                            "horas_usadas": horas_usadas,
                            "horas_disponibles": round(limite - horas_usadas, 2),
                            "limite": limite,
                        }, status=422)

                # ── 3b. Re-validar si cambia la fecha (mover de dia)
                if 'fecha' in serializer.validated_data and nueva_fecha != subtarea.fecha:
                    horas_nuevo_dia = self._horas_usadas_en_dia(
                        request.user,
                        nueva_fecha,
                        # No excluir: la tarea aun no esta en ese dia
                    )
                    horas_tarea = nuevas_horas
                    if horas_nuevo_dia + horas_tarea > limite:
                        return Response({
                            "status": "limit_exceeded",
                            "message": (
                                f"Mover la tarea al {nueva_fecha} superaria el limite diario. "
                                f"Horas ocupadas ese dia: {horas_nuevo_dia}h, "
                                f"horas de la tarea: {horas_tarea}h, limite: {limite}h."
                            ),
                            "horas_usadas": horas_nuevo_dia,
                            "horas_disponibles": round(limite - horas_nuevo_dia, 2),
                            "limite": limite,
                        }, status=422)

                # ── 4. Guardar — dentro de la misma transaccion atomica
                serializer.save()

                # ── 5. Respuesta estandar con el modelo actualizado
                from .serializers import SubtaskSerializer
                return self.success(
                    SubtaskSerializer(subtarea).data,
                    "Subtarea actualizada correctamente."
                )

        except Subtask.DoesNotExist:
            return self.error(
                "Subtarea no encontrada o no tienes permiso para modificarla.",
                status_code=status.HTTP_404_NOT_FOUND
            )