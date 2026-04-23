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


# ==============================
# SPRINT 3 — ESTANDARIZACIÓN DE RESPUESTAS, CÓDIGOS HTTP Y IDEMPOTENCIA
# ==============================

# ── Helper global de respuesta unificada ──────────────────────────────────────
# Estructura fija que el Front SIEMPRE puede esperar:
#   Éxito:  { success: true,  message: "...", data: {...} }
#   Error:  { success: false, message: "...", error_code: "CODIGO_INTERNO", data: {...} }
#
# Códigos HTTP usados semánticamente:
#   200  OK
#   201  Created
#   400  BAD_REQUEST        — campo faltante o formato inválido
#   401  UNAUTHORIZED       — token expirado / credenciales incorrectas
#   403  FORBIDDEN          — sin permiso sobre el recurso
#   404  NOT_FOUND          — recurso no existe
#   409  CONFLICT           — idempotencia: petición duplicada detectada
#   422  UNPROCESSABLE      — límite de horas excedido
# ─────────────────────────────────────────────────────────────────────────────

def std_success(data, message="OK", status_code=200):
    """Respuesta de éxito unificada para el Sprint 3."""
    return Response(
        {"success": True, "message": message, "data": data},
        status=status_code
    )


def std_error(message, error_code="ERROR", data=None, status_code=400):
    """
    Respuesta de error unificada para el Sprint 3.
    error_code es un string interno que el Front puede usar para lógica:
      VALIDATION_ERROR, AUTH_FAILED, ACCOUNT_DISABLED, NOT_FOUND,
      FORBIDDEN, LIMIT_EXCEEDED, DUPLICATE_REQUEST, SERVER_ERROR
    """
    return Response(
        {"success": False, "message": message, "error_code": error_code, "data": data},
        status=status_code
    )


# ── Idempotencia ──────────────────────────────────────────────────────────────
# Cache en memoria (Django cache framework) con TTL de 5 segundos.
# Si llegan dos peticiones idénticas del mismo usuario en ese ventana,
# la segunda recibe 409 CONFLICT sin tocar la base de datos.
# Clave: "idempotency:<user_id>:<hash_del_body>"
# ─────────────────────────────────────────────────────────────────────────────

def _idempotency_key(user_id, data: dict) -> str:
    import hashlib, json
    payload = json.dumps(data, sort_keys=True, default=str)
    digest = hashlib.sha256(payload.encode()).hexdigest()[:16]
    return f"idempotency:{user_id}:{digest}"


def _check_idempotency(user_id, data: dict):
    """
    Retorna True si la petición ya fue procesada recientemente (duplicada).
    Retorna False si es nueva y la registra en caché.
    """
    from django.core.cache import cache
    key = _idempotency_key(user_id, data)
    if cache.get(key):
        return True          # duplicada
    cache.set(key, True, timeout=5)   # TTL 5 segundos
    return False             # nueva — procesada normalmente


# ==============================
# SPRINT 3 — REGISTRO (con respuesta unificada + idempotencia)
# POST /api/v2/auth/register/
# ==============================

class RegisterV2View(APIView):
    """
    Misma lógica que RegisterView pero con:
    - Respuesta { success, message, error_code, data }
    - Idempotencia: doble clic no crea dos usuarios
    - Mensajes de error orientados a la solución
    """
    def post(self, request):
        # Idempotencia — detecta doble envío en < 5 seg
        if _check_idempotency(request.data.get('email', 'anon'), request.data):
            return std_error(
                "Esta solicitud ya fue procesada. Si no recibiste confirmación, espera unos segundos e intenta de nuevo.",
                error_code="DUPLICATE_REQUEST",
                status_code=409
            )

        from .serializers import RegisterSerializer
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return std_error(
                "Revisa los datos ingresados e intenta de nuevo.",
                error_code="VALIDATION_ERROR",
                data=serializer.errors,
                status_code=400
            )
        user = serializer.save()
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return std_success({
            "email": user.email,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, "Cuenta creada exitosamente. Bienvenido.", status_code=201)


# ==============================
# SPRINT 3 — LOGIN (con respuesta unificada + códigos HTTP semánticos)
# POST /api/v2/auth/login/
# ==============================

class LoginV2View(APIView):
    """
    Misma lógica que LoginView pero con:
    - 401 para credenciales incorrectas (token expirado lo maneja SimpleJWT automáticamente)
    - 403 para cuenta desactivada
    - error_code interno para que el Front distinga el caso
    """
    def post(self, request):
        from .serializers import LoginSerializer
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return std_error(
                "El correo y la contraseña son obligatorios.",
                error_code="VALIDATION_ERROR",
                data=serializer.errors,
                status_code=400
            )

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user_obj = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return std_error(
                f"No encontramos una cuenta asociada al correo '{email}'. Verifica el correo o regístrate.",
                error_code="AUTH_FAILED",
                status_code=401
            )

        from django.contrib.auth import authenticate
        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return std_error(
                "La contraseña es incorrecta. Inténtalo de nuevo o usa '¿Olvidaste tu contraseña?'.",
                error_code="AUTH_FAILED",
                status_code=401
            )

        if not user.activo:
            return std_error(
                "Tu cuenta está desactivada. Contacta al administrador para reactivarla.",
                error_code="ACCOUNT_DISABLED",
                status_code=403
            )

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return std_success({
            "nombre": user.nombre,
            "apellido": user.apellido,
            "email": user.email,
            "rol": user.rol,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, "Sesión iniciada correctamente.")


# ==============================
# SPRINT 3 — CREAR ACTIVIDAD (con idempotencia + respuesta unificada)
# POST /api/v2/activities/
# ==============================

class ActivityCreateV2View(APIView):
    """
    Crea una actividad con:
    - Idempotencia: si el mismo usuario envía el mismo título+fecha dos veces
      en < 5 seg, la segunda petición devuelve 409 sin crear duplicado.
    - Mensajes de error orientados a la solución.
    - Respuesta unificada { success, message, error_code, data }.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Idempotencia por usuario + payload completo
        if _check_idempotency(request.user.id, request.data):
            return std_error(
                "Detectamos una solicitud duplicada. La actividad puede haberse creado ya; revisa tu lista antes de intentar de nuevo.",
                error_code="DUPLICATE_REQUEST",
                status_code=409
            )

        from .serializers import ActivitySerializer
        serializer = ActivitySerializer(data=request.data)
        if not serializer.is_valid():
            # Mapear errores de campo a mensajes orientados a la solución
            errors = serializer.errors
            message = _humanize_activity_errors(errors)
            return std_error(message, error_code="VALIDATION_ERROR", data=errors, status_code=400)

        serializer.save(usuario=request.user)
        return std_success(serializer.data, "Actividad creada correctamente.", status_code=201)


def _humanize_activity_errors(errors: dict) -> str:
    """
    Convierte los errores del serializer en un mensaje humano único
    orientado a la solución, en lugar de mostrar el dict técnico.
    """
    priority = [
        ('title',         "El título debe tener al menos 3 caracteres."),
        ('due_date',      "La fecha de entrega no puede ser en el pasado. Usa una fecha futura."),
        ('start_date',    "La fecha de inicio no puede ser en el pasado."),
        ('difficulty',    "La dificultad debe ser: baja, media, alta o crítica."),
        ('activity_type', "El tipo debe ser: exam, project, presentation o homework."),
        ('description',   "La descripción debe tener al menos 3 caracteres."),
    ]
    for field, msg in priority:
        if field in errors:
            return msg
    return "Revisa los datos del formulario e intenta de nuevo."


# ==============================
# SPRINT 3 — CREAR SUBTAREA (con idempotencia + respuesta unificada)
# POST /api/v2/subtasks/
# ==============================

class SubtaskCreateV2View(APIView):
    """
    Crea una subtarea con:
    - Idempotencia: evita duplicados por doble clic.
    - 403 si el usuario no es dueño de la actividad padre.
    - Mensajes de error claros.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _check_idempotency(request.user.id, request.data):
            return std_error(
                "Detectamos una solicitud duplicada. La subtarea puede haberse creado ya; revisa la actividad antes de intentar de nuevo.",
                error_code="DUPLICATE_REQUEST",
                status_code=409
            )

        from .serializers import SubtaskSerializer
        serializer = SubtaskSerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            message = _humanize_subtask_errors(errors)
            return std_error(message, error_code="VALIDATION_ERROR", data=errors, status_code=400)

        activity = serializer.validated_data.get('activity')
        if activity and activity.usuario != request.user:
            return std_error(
                "No tienes permiso para agregar subtareas a esta actividad.",
                error_code="FORBIDDEN",
                status_code=403
            )

        serializer.save()
        return std_success(serializer.data, "Subtarea creada correctamente.", status_code=201)


def _humanize_subtask_errors(errors: dict) -> str:
    priority = [
        ('title',           "El título debe tener al menos 3 caracteres."),
        ('fecha',           "La fecha de la subtarea no puede superar la fecha de entrega de la actividad."),
        ('horas_estimadas', "Las horas estimadas no pueden superar las horas totales de la actividad."),
        ('activity',        "Debes indicar a qué actividad pertenece esta subtarea."),
    ]
    for field, msg in priority:
        if field in errors:
            return msg
    return "Revisa los datos de la subtarea e intenta de nuevo."


# ==============================
# SPRINT 3 — REPROGRAMAR ACTIVIDAD V2 (mensajes orientados a la solución)
# PATCH /api/v2/activities/<pk>/reprogramar/
# ==============================

class ReprogramarActividadV2View(APIView):
    """
    Igual que ReprogramarActividadView pero con:
    - Mensajes de error orientados a la solución (no mensajes técnicos).
    - Respuesta unificada { success, message, error_code, data }.
    - Códigos HTTP semánticos.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            actividad = Activity.objects.get(pk=pk, usuario=request.user)
        except Activity.DoesNotExist:
            return std_error(
                "No encontramos esta actividad o no tienes permiso para modificarla.",
                error_code="NOT_FOUND",
                status_code=404
            )

        nueva_fecha = request.data.get('due_date')

        if not nueva_fecha:
            return std_error(
                "Debes enviar el campo 'due_date' con la nueva fecha de entrega.",
                error_code="VALIDATION_ERROR",
                status_code=400
            )

        try:
            from datetime import datetime
            fecha_parsed = datetime.strptime(nueva_fecha, '%Y-%m-%d').date()
        except ValueError:
            return std_error(
                "El formato de fecha no es válido. Usa el formato YYYY-MM-DD (ej: 2026-05-30).",
                error_code="VALIDATION_ERROR",
                status_code=400
            )

        if fecha_parsed < timezone.localdate():
            return std_error(
                "La fecha de reprogramación no puede ser en el pasado. Elige una fecha igual o posterior a hoy.",
                error_code="VALIDATION_ERROR",
                status_code=400
            )

        actividad.due_date = fecha_parsed
        actividad.save()

        return std_success({
            "id": actividad.id,
            "title": actividad.title,
            "due_date": str(actividad.due_date),
            "updated_at": str(actividad.updated_at),
        }, "Actividad reprogramada correctamente.")


# ==============================
# SPRINT 4 — CÁLCULOS PRECISOS, PAYLOAD ENRIQUECIDO Y VALIDACIÓN MATEMÁTICA
# ==============================

# ── Función centralizada de cálculo real desde BD ────────────────────────────
# Un único punto de verdad para el SUM de horas.
# Todos los endpoints que necesiten saber cuántas horas hay en un día
# deben llamar a esta función — nunca hacer el cálculo inline.
# ─────────────────────────────────────────────────────────────────────────────

def _calcular_horas_dia(user, fecha, excluir_subtarea_id=None) -> dict:
    """
    Hace el SUM real contra la BD para la fecha dada.
    Devuelve un dict con el desglose completo para poder armar el payload math.

    Retorna:
        {
            "horas_actividades": float,   — SUM(horas_estimadas) de Activity en esa fecha
            "horas_subtareas":   float,   — SUM(horas_estimadas) de Subtask en esa fecha
            "total":             float,   — suma de ambos
        }
    """
    from django.db.models import Sum

    # SUM real de actividades del usuario en esa fecha
    horas_actividades = round(float(
        Activity.objects.filter(
            usuario=user,
            due_date=fecha
        ).aggregate(total=Sum('horas_estimadas'))['total'] or 0
    ), 2)

    # SUM real de subtareas del usuario en esa fecha
    subtareas_qs = Subtask.objects.filter(
        activity__usuario=user,
        fecha=fecha
    )
    if excluir_subtarea_id:
        subtareas_qs = subtareas_qs.exclude(id=excluir_subtarea_id)

    horas_subtareas = round(float(
        subtareas_qs.aggregate(total=Sum('horas_estimadas'))['total'] or 0
    ), 2)

    return {
        "horas_actividades": horas_actividades,
        "horas_subtareas":   horas_subtareas,
        "total":             round(horas_actividades + horas_subtareas, 2),
    }


# ── Sanitizador estricto de horas ────────────────────────────────────────────
# Previene que un string, None, negativo o valor absurdo rompa el SUM.
# ─────────────────────────────────────────────────────────────────────────────

def _sanitizar_horas(valor) -> float:
    """
    Convierte el valor recibido del request a float válido.
    Lanza ValueError con mensaje claro si el tipo o rango es inválido.

    Reglas:
      - Debe ser convertible a float (no strings arbitrarios)
      - No puede ser negativo
      - No puede superar 24 (más de un día completo no tiene sentido)
      - No puede ser NaN ni infinito
    """
    import math
    try:
        valor_float = float(valor)
    except (TypeError, ValueError):
        raise ValueError("El campo horas_estimadas debe ser un número (ej: 1.5). No se aceptan texto ni nulos.")

    if math.isnan(valor_float) or math.isinf(valor_float):
        raise ValueError("El valor de horas no puede ser NaN ni infinito.")

    if valor_float < 0:
        raise ValueError("Las horas estimadas no pueden ser negativas.")

    if valor_float > 24:
        raise ValueError("Las horas estimadas no pueden superar 24h (un día completo).")

    return round(valor_float, 2)


# ── Constructor del payload math ─────────────────────────────────────────────
# Centraliza el armado del JSON de conflicto para que todos los endpoints
# devuelvan exactamente la misma estructura cuando el límite se excede.
# ─────────────────────────────────────────────────────────────────────────────

def _payload_limite_excedido(limite: float, desglose: dict, horas_intentadas: float, sugerencia=None) -> dict:
    """
    Construye el payload estándar de conflicto con la matemática desglosada.

    Ejemplo de respuesta resultante:
    {
        "success": false,
        "error": "limite_excedido",
        "message": "Superas el límite diario de 6h.",
        "math": {
            "limite_diario":    6.0,
            "horas_actividades": 2.0,   — aporte de actividades ese día
            "horas_subtareas":   3.0,   — aporte de subtareas ese día
            "horas_asignadas":   5.0,   — total ya ocupado
            "horas_intentadas":  2.0,   — lo que se está intentando agregar
            "total_resultante":  7.0,   — cómo quedaría si se permitiera
            "exceso_horas":      1.0,   — cuánto sobra
            "horas_disponibles": 1.0    — cuánto queda libre actualmente
        },
        "suggestion": { ... }           — día alternativo sugerido (puede ser null)
    }
    """
    horas_asignadas   = desglose["total"]
    total_resultante  = round(horas_asignadas + horas_intentadas, 2)
    exceso            = round(total_resultante - limite, 2)
    disponibles       = round(limite - horas_asignadas, 2)

    return {
        "success":  False,
        "error":    "limite_excedido",
        "message":  (
            f"Superas el límite diario de {limite}h. "
            f"Ya tienes {horas_asignadas}h asignadas e intentas agregar {horas_intentadas}h "
            f"(total: {total_resultante}h, exceso: {exceso}h)."
        ),
        "math": {
            "limite_diario":     limite,
            "horas_actividades": desglose["horas_actividades"],
            "horas_subtareas":   desglose["horas_subtareas"],
            "horas_asignadas":   horas_asignadas,
            "horas_intentadas":  horas_intentadas,
            "total_resultante":  total_resultante,
            "exceso_horas":      exceso,
            "horas_disponibles": disponibles,
        },
        "suggestion": sugerencia,
    }


# ==============================
# SPRINT 4 — VALIDAR LÍMITE V2
# POST /api/v2/validar/limite-horas/
#
# Igual que ValidarLimiteHorasView pero con:
#   - SUM real desde BD (no estimación inline)
#   - Sanitización estricta del campo horas_estimadas
#   - Payload math desglosado cuando hay conflicto
#   - Respuesta unificada { success, error, math, suggestion }
# ==============================

class ValidarLimiteHorasV2View(APIView):
    permission_classes = [IsAuthenticated]

    def _buscar_dia_disponible(self, user, desde_fecha, horas_necesarias):
        from datetime import timedelta
        limite = float(getattr(user, 'limite_horas_diarias', 6))
        fecha = desde_fecha
        for _ in range(30):
            fecha = fecha + timedelta(days=1)
            if fecha.weekday() >= 5:
                continue
            desglose = _calcular_horas_dia(user, fecha)
            if (limite - desglose["total"]) >= horas_necesarias:
                return fecha
        return None

    def post(self, request):
        from datetime import datetime

        tipo  = request.data.get('tipo')
        fecha = request.data.get('fecha')
        horas_raw = request.data.get('horas_estimadas', 0)

        # ── Validación de campos obligatorios
        if not fecha or not tipo:
            return Response({
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": "Los campos 'tipo' y 'fecha' son obligatorios.",
            }, status=400)

        # ── Sanitización estricta del tipo de dato horas
        try:
            horas = _sanitizar_horas(horas_raw)
        except ValueError as e:
            return Response({
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": str(e),
            }, status=400)

        # ── Validación del formato de fecha
        try:
            fecha_parsed = datetime.strptime(fecha, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": "Formato de fecha inválido. Usa YYYY-MM-DD (ej: 2026-05-30).",
            }, status=400)

        limite = float(getattr(request.user, 'limite_horas_diarias', 6))

        # ── SUM real desde BD con desglose completo
        desglose = _calcular_horas_dia(request.user, fecha_parsed)

        # ── Permite: devolver el desglose aunque no haya conflicto
        if desglose["total"] + horas <= limite:
            return Response({
                "success": True,
                "message": "Dentro del límite de horas diarias.",
                "math": {
                    "limite_diario":     limite,
                    "horas_actividades": desglose["horas_actividades"],
                    "horas_subtareas":   desglose["horas_subtareas"],
                    "horas_asignadas":   desglose["total"],
                    "horas_intentadas":  horas,
                    "total_resultante":  round(desglose["total"] + horas, 2),
                    "horas_disponibles": round(limite - desglose["total"] - horas, 2),
                },
            }, status=200)

        # ── Conflicto: buscar sugerencia y devolver payload enriquecido
        subtareas_del_dia = Subtask.objects.filter(
            activity__usuario=request.user,
            fecha=fecha_parsed
        ).select_related('activity').order_by('-activity__due_date')

        tarea_a_mover = subtareas_del_dia.first() if subtareas_del_dia.exists() else None
        dia_sugerido  = self._buscar_dia_disponible(request.user, fecha_parsed, horas)

        sugerencia = None
        if tarea_a_mover and dia_sugerido:
            sugerencia = {
                "task_to_move_id":    tarea_a_mover.id,
                "task_to_move_title": tarea_a_mover.title,
                "suggested_date":     str(dia_sugerido),
                "mensaje": f"Te sugerimos mover '{tarea_a_mover.title}' al {dia_sugerido.strftime('%d/%m/%Y')}.",
            }
        elif dia_sugerido:
            sugerencia = {
                "suggested_date": str(dia_sugerido),
                "mensaje": f"Te sugerimos programar esta tarea para el {dia_sugerido.strftime('%d/%m/%Y')}.",
            }

        payload = _payload_limite_excedido(limite, desglose, horas, sugerencia)
        return Response(payload, status=422)


# ==============================
# SPRINT 4 — SUBTASK PATCH V2
# PATCH /api/v2/subtasks/<pk>/patch/
#
# Igual que SubtaskPatchView pero con:
#   - _calcular_horas_dia() en lugar de cálculo inline
#   - _sanitizar_horas() para prevenir desbordamiento de tipos
#   - _payload_limite_excedido() para el math desglosado
# ==============================

class SubtaskPatchV2View(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from django.db import transaction
        from .serializers import SubtaskPatchSerializer, SubtaskSerializer

        try:
            with transaction.atomic():
                subtarea = (
                    Subtask.objects
                    .select_for_update()
                    .select_related('activity')
                    .get(pk=pk, activity__usuario=request.user)
                )

                # ── Sanitizar horas si vienen en el payload
                if 'horas_estimadas' in request.data:
                    try:
                        _sanitizar_horas(request.data['horas_estimadas'])
                    except ValueError as e:
                        return Response({
                            "success": False,
                            "error": "VALIDATION_ERROR",
                            "message": str(e),
                        }, status=400)

                serializer = SubtaskPatchSerializer(subtarea, data=request.data, partial=True)
                if not serializer.is_valid():
                    return Response({
                        "success": False,
                        "error": "VALIDATION_ERROR",
                        "message": "Revisa los datos enviados.",
                        "data": serializer.errors,
                    }, status=400)

                nueva_fecha   = serializer.validated_data.get('fecha', subtarea.fecha)
                nuevas_horas  = serializer.validated_data.get('horas_estimadas', subtarea.horas_estimadas or 0)
                limite        = float(getattr(request.user, 'limite_horas_diarias', 6))

                # ── Re-validar cambio de horas en el mismo día (SUM real)
                if 'horas_estimadas' in serializer.validated_data and nueva_fecha == subtarea.fecha:
                    desglose = _calcular_horas_dia(
                        request.user, nueva_fecha or subtarea.fecha,
                        excluir_subtarea_id=subtarea.id
                    )
                    if desglose["total"] + nuevas_horas > limite:
                        payload = _payload_limite_excedido(limite, desglose, nuevas_horas)
                        return Response(payload, status=422)

                # ── Re-validar mover de día (SUM real en el nuevo día)
                if 'fecha' in serializer.validated_data and nueva_fecha != subtarea.fecha:
                    desglose = _calcular_horas_dia(request.user, nueva_fecha)
                    if desglose["total"] + nuevas_horas > limite:
                        payload = _payload_limite_excedido(limite, desglose, nuevas_horas)
                        return Response(payload, status=422)

                serializer.save()

                return Response({
                    "success": True,
                    "message": "Subtarea actualizada correctamente.",
                    "data": SubtaskSerializer(subtarea).data,
                }, status=200)

        except Subtask.DoesNotExist:
            return Response({
                "success": False,
                "error": "NOT_FOUND",
                "message": "Subtarea no encontrada o no tienes permiso para modificarla.",
            }, status=404)