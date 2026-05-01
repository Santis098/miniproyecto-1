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

        # Si la actividad aún no tenía subtareas, esta es la PRIMERA subtarea:
        # se resetean horas_trabajadas a 0 siempre (independientemente de su valor),
        # ya que desde ahora el progreso se gestiona exclusivamente por subtareas.
        is_first_subtask = activity and not activity.subtasks.exists()

        serializer.save()

        if is_first_subtask:
            activity.horas_trabajadas = 0
            activity.save(update_fields=["horas_trabajadas", "updated_at"])

        response_data = dict(serializer.data)
        if is_first_subtask:
            response_data["horas_trabajadas_reseteadas"] = True

        return self.success(response_data, "Subtarea creada exitosamente.", status.HTTP_201_CREATED)


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
        from collections import defaultdict

        user = request.user
        limite = getattr(user, 'limite_horas_diarias', 6)
        conflictos_guardados = getattr(user, 'limite_conflictos_pendientes', []) or []
        limite_conflicto = getattr(user, 'limite_conflictos_valor', None)

        data = {"limite_horas_diarias": limite}

        # Solo recalcular si hay conflictos persistidos — evita queries innecesarias
        if conflictos_guardados and limite_conflicto is not None:
            # Recalcular horas reales por día (misma lógica que el PUT)
            horas_dia = defaultdict(float)

            subtareas = (
                Subtask.objects
                .filter(activity__usuario=user)
                .values('fecha', 'horas_estimadas', 'activity_id')
            )
            actividades_con_subtareas = set()
            for st in subtareas:
                actividades_con_subtareas.add(st['activity_id'])
                if st['fecha'] is not None:
                    horas_dia[st['fecha']] += float(st['horas_estimadas'] or 0)

            for act in Activity.objects.filter(
                usuario=user, due_date__isnull=False
            ).exclude(id__in=actividades_con_subtareas).values('due_date', 'horas_estimadas'):
                horas_dia[act['due_date']] += float(act['horas_estimadas'] or 0)

            conflictos_actuales = [
                {"fecha": str(fecha), "horas": round(total, 2)}
                for fecha, total in sorted(horas_dia.items())
                if total > limite_conflicto
            ]

            if conflictos_actuales:
                # Actualizar con el estado real (pueden haber cambiado las horas)
                user.limite_conflictos_pendientes = conflictos_actuales
                user.save(update_fields=['limite_conflictos_pendientes'])
                data["alerta_conflictos"] = {
                    "limite_aplicado": limite_conflicto,
                    "dias_en_conflicto": conflictos_actuales,
                    "mensaje": (
                        f"El límite de {limite_conflicto}h está activo pero los siguientes días "
                        f"aún superan ese límite. Ajusta o reprograma esas actividades."
                    ),
                }
            else:
                # Ya no hay conflictos — limpiar automáticamente
                user.limite_conflictos_pendientes = []
                user.limite_conflictos_valor = None
                user.save(update_fields=['limite_conflictos_pendientes', 'limite_conflictos_valor'])

        return self.success(data, "Limite de horas diarias obtenido correctamente.")

    def put(self, request):
        from django.db.models import Sum

        # ── 1. Validar y sanitizar el nuevo límite
        limite_raw = request.data.get('limite_horas_diarias')
        if limite_raw is None:
            return self.error("El campo limite_horas_diarias es requerido.")
        try:
            nuevo_limite = float(limite_raw)
            if nuevo_limite <= 0 or nuevo_limite > 24:
                return self.error("El limite debe ser entre 1 y 24 horas.")
        except (ValueError, TypeError):
            return self.error("El limite debe ser un numero valido.")

        confirmar = str(request.data.get('confirmar', 'false')).lower() == 'true'

        # ── 2. Detectar conflictos: calcular horas reales por día
        #
        #    REGLA DE NEGOCIO (consistente con _calcular_horas_dia):
        #    - Actividades CON subtareas: sus horas se distribuyen en los días
        #      de cada subtarea (Subtask.fecha + Subtask.horas_estimadas).
        #    - Actividades SIN subtareas: sus horas se asignan al due_date
        #      (fecha de entrega), igual que hace _calcular_horas_dia().

        from collections import defaultdict

        horas_dia = defaultdict(float)

        # -- Actividades CON subtareas: sumar horas de cada subtarea en su fecha
        subtareas = (
            Subtask.objects
            .filter(activity__usuario=request.user)
            .values('fecha', 'horas_estimadas', 'activity_id')
        )
        actividades_con_subtareas = set()
        for st in subtareas:
            actividades_con_subtareas.add(st['activity_id'])
            if st['fecha'] is not None:
                horas_dia[st['fecha']] += float(st['horas_estimadas'] or 0)

        # -- Actividades SIN subtareas: sus horas van al due_date
        actividades_sin_subtareas = (
            Activity.objects
            .filter(usuario=request.user, due_date__isnull=False)
            .exclude(id__in=actividades_con_subtareas)
            .values('due_date', 'horas_estimadas')
        )
        for act in actividades_sin_subtareas:
            horas_dia[act['due_date']] += float(act['horas_estimadas'] or 0)

        # -- Detectar días que superan el nuevo límite
        dias_en_conflicto = [
            {"fecha": str(fecha), "horas": round(total, 2)}
            for fecha, total in sorted(horas_dia.items())
            if total > nuevo_limite
        ]

        hay_conflicto = len(dias_en_conflicto) > 0

        # ── 3. Si hay conflicto y el usuario no confirmó → devolver warning
        if hay_conflicto and not confirmar:
            return Response({
                "status": "warning",
                "message": "Conflicto con el nuevo límite de horas",
                "data": {
                    "nuevo_limite": nuevo_limite,
                    "dias_en_conflicto": dias_en_conflicto,
                    "mensaje": "Existen días que superan el nuevo límite. ¿Deseas continuar?",
                }
            }, status=200)

        # ── 4. Aplicar el cambio (sin conflicto, o confirmado por el usuario)
        user = request.user
        user.limite_horas_diarias = nuevo_limite

        if hay_conflicto and confirmar:
            # Persistir conflictos: el GET los devolverá hasta que el usuario
            # ajuste esos días y vuelva a llamar a este endpoint sin conflictos.
            user.limite_conflictos_pendientes = dias_en_conflicto
            user.limite_conflictos_valor = nuevo_limite
            user.save()
            return self.success({
                "limite_horas_diarias": nuevo_limite,
                "conflictos": True,
                "dias_en_conflicto": dias_en_conflicto,
                "mensaje": (
                    f"El límite de horas fue actualizado a {nuevo_limite}h con conflictos. "
                    f"Los siguientes días aún superan ese límite: "
                    + ", ".join(
                        f"{d['fecha']} ({d['horas']}h)" for d in dias_en_conflicto
                    )
                    + ". Se recomienda reprogramar esas actividades."
                ),
            }, "Límite actualizado. Existen conflictos pendientes de resolver.")

        # Sin conflictos: limpiar cualquier alerta pendiente anterior
        user.limite_conflictos_pendientes = []
        user.limite_conflictos_valor = None
        user.save()
        return self.success({
            "limite_horas_diarias": nuevo_limite,
            "conflictos": False,
        }, "Límite de horas diarias actualizado correctamente.")


# ==============================
# VALIDACION LIMITE Y SUGERENCIA
# ==============================

class ValidarLimiteHorasView(BaseView, APIView):
    permission_classes = [IsAuthenticated]

    def _get_limite(self, user):
        return getattr(user, 'limite_horas_diarias', 6)

    def _horas_usadas_en_dia(self, user, fecha, excluir_subtarea_id=None):
        """
        El límite diario se calcula SOLO con las horas de Actividades.
        Las subtareas no cuentan aquí — tienen su propia validación
        contra las horas de su actividad padre.
        """
        from django.db.models import Sum
        return float(
            Activity.objects.filter(
                usuario=user,
                due_date=fecha
            ).aggregate(total=Sum('horas_estimadas'))['total'] or 0
        )

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
        """
        Solo suma horas de Actividades para el límite diario.
        Las subtareas se validan contra su actividad padre, no contra el límite diario.
        """
        from django.db.models import Sum
        return float(
            Activity.objects.filter(
                usuario=user,
                due_date=fecha
            ).aggregate(total=Sum('horas_estimadas'))['total'] or 0
        )

    def _horas_subtareas_en_actividad(self, activity_id, excluir_id=None) -> float:
        """Suma horas de subtareas de una actividad (para validar que no superen a la actividad)."""
        from django.db.models import Sum
        qs = Subtask.objects.filter(activity_id=activity_id)
        if excluir_id:
            qs = qs.exclude(id=excluir_id)
        return round(float(qs.aggregate(total=Sum('horas_estimadas'))['total'] or 0), 2)

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

                nueva_fecha  = serializer.validated_data.get('fecha', subtarea.fecha)
                nuevas_horas = float(serializer.validated_data.get('horas_estimadas', subtarea.horas_estimadas or 0))
                actividad    = subtarea.activity

                # ── 3. Validar que las horas de la subtarea no superen las de su actividad padre
                if 'horas_estimadas' in serializer.validated_data:
                    horas_otras = self._horas_subtareas_en_actividad(actividad.id, excluir_id=subtarea.id)
                    horas_actividad = float(actividad.horas_estimadas or 0)
                    if horas_otras + nuevas_horas > horas_actividad:
                        disponibles = round(horas_actividad - horas_otras, 2)
                        return Response({
                            "status": "subtask_hours_exceeded",
                            "message": (
                                f"Las horas de la subtarea ({nuevas_horas}h) superan lo disponible "
                                f"en la actividad '{actividad.title}'. "
                                f"Horas de la actividad: {horas_actividad}h, "
                                f"ya asignadas en otras subtareas: {horas_otras}h, "
                                f"disponibles: {disponibles}h."
                            ),
                            "horas_actividad":       horas_actividad,
                            "horas_otras_subtareas": horas_otras,
                            "horas_disponibles":     disponibles,
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

        # Si la actividad aún no tenía subtareas, esta es la PRIMERA subtarea:
        # se resetean horas_trabajadas a 0 siempre (independientemente de su valor),
        # ya que desde ahora el progreso se gestiona exclusivamente por subtareas.
        is_first_subtask = activity and not activity.subtasks.exists()

        serializer.save()

        if is_first_subtask:
            activity.horas_trabajadas = 0
            activity.save(update_fields=["horas_trabajadas", "updated_at"])

        response_data = dict(serializer.data)
        if is_first_subtask:
            response_data["horas_trabajadas_reseteadas"] = True

        return std_success(response_data, "Subtarea creada correctamente.", status_code=201)


def _humanize_subtask_errors(errors: dict) -> str:
    priority = [
        ('title',           "El título debe tener al menos 3 caracteres."),
        ('fecha',           "La fecha de la subtarea no puede superar la fecha de entrega de la actividad."),
        ('horas_estimadas', "Las horas estimadas no pueden superar las horas totales de la actividad."),
        ('activity',        "Debes indicar a qué actividad pertenece esta subtarea."),
        ('estado',          "El estado debe ser 'pendiente', 'hecha' o 'pospuesta'."),
        ('nota',            "Debes indicar un motivo cuando la subtarea se pospone."),
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
    Calcula las horas ocupadas en un día para el límite diario.

    REGLA DE NEGOCIO:
    - El límite diario se calcula SOLO sumando horas_estimadas de las Actividades
      cuyo due_date coincide con la fecha.
    - Las subtareas NO cuentan para el límite diario. Las subtareas pertenecen
      a una actividad y no pueden superar las horas de su actividad padre
      (esa validación es independiente y se hace en el serializer).

    Retorna:
        {
            "horas_actividades": float,  — SUM(horas_estimadas) de Activity en esa fecha
            "total":             float,  — igual a horas_actividades
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

    return {
        "horas_actividades": horas_actividades,
        "total":             horas_actividades,
    }


def _calcular_horas_subtareas_actividad(activity_id, excluir_subtarea_id=None) -> float:
    """
    Suma las horas_estimadas de todas las subtareas de una actividad.
    Se usa para validar que las subtareas no sobrepasen las horas de la actividad padre.
    """
    from django.db.models import Sum
    qs = Subtask.objects.filter(activity_id=activity_id)
    if excluir_subtarea_id:
        qs = qs.exclude(id=excluir_subtarea_id)
    return round(float(qs.aggregate(total=Sum('horas_estimadas'))['total'] or 0), 2)


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
    Construye el payload estándar de conflicto cuando se supera el límite diario.

    REGLA DE NEGOCIO:
    - El límite diario se calcula SOLO con horas de Actividades (no subtareas).
    - Las subtareas tienen su propia validación contra las horas de su actividad padre.

    Ejemplo de respuesta resultante:
    {
        "success": false,
        "error": "limite_excedido",
        "message": "Superas el límite diario de 6h.",
        "math": {
            "limite_diario":    6.0,
            "horas_actividades": 5.0,  — horas ya ocupadas por actividades ese día
            "horas_asignadas":   5.0,  — total ya ocupado
            "horas_intentadas":  2.0,  — lo que se intenta agregar
            "total_resultante":  7.0,  — cómo quedaría si se permitiera
            "exceso_horas":      1.0,  — cuánto sobra del límite
            "horas_disponibles": 1.0   — cuánto queda libre actualmente
        },
        "suggestion": { ... }          — día alternativo sugerido (puede ser null)
    }
    """
    horas_asignadas  = desglose["total"]
    total_resultante = round(horas_asignadas + horas_intentadas, 2)
    exceso           = round(total_resultante - limite, 2)
    disponibles      = round(limite - horas_asignadas, 2)

    return {
        "success": False,
        "error":   "limite_excedido",
        "message": (
            f"Superas el límite diario de {limite}h. "
            f"Ya tienes {horas_asignadas}h en actividades e intentas agregar {horas_intentadas}h "
            f"(total: {total_resultante}h, exceso: {exceso}h)."
        ),
        "math": {
            "limite_diario":     limite,
            "horas_actividades": desglose["horas_actividades"],
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
                    # FIX: horas_subtareas eliminado — _calcular_horas_dia() no lo retorna
                    # Las subtareas se validan contra su actividad padre, no contra el limite diario
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

                nueva_fecha  = serializer.validated_data.get('fecha', subtarea.fecha)
                nuevas_horas = float(serializer.validated_data.get('horas_estimadas', subtarea.horas_estimadas or 0))
                actividad    = subtarea.activity

                # ── Validar que las horas de la subtarea no superen las de su actividad padre
                if 'horas_estimadas' in serializer.validated_data:
                    horas_otras = _calcular_horas_subtareas_actividad(actividad.id, excluir_subtarea_id=subtarea.id)
                    horas_actividad = float(actividad.horas_estimadas or 0)
                    if horas_otras + nuevas_horas > horas_actividad:
                        disponibles = round(horas_actividad - horas_otras, 2)
                        return Response({
                            "success": False,
                            "error": "subtask_hours_exceeded",
                            "message": (
                                f"Las horas de la subtarea ({nuevas_horas}h) superan lo disponible "
                                f"en la actividad '{actividad.title}'. "
                                f"Horas de la actividad: {horas_actividad}h, "
                                f"ya asignadas en otras subtareas: {horas_otras}h, "
                                f"disponibles: {disponibles}h."
                            ),
                            "horas_actividad":       horas_actividad,
                            "horas_otras_subtareas": horas_otras,
                            "horas_disponibles":     disponibles,
                        }, status=422)

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


# ==============================
# SPRINT 6 — ESTADO DE SUBTAREA
# PATCH /subtasks/{id}/estado/
#
# Permite marcar una subtarea como:
#   - "hecha"     → se guarda y la nota se limpia (null)
#   - "pospuesta" → se guarda con nota obligatoria explicando el motivo
#
# Separado de SubtaskPatchView y SubtaskPatchV2View para mantener
# separación de responsabilidades. Siempre pasa por el serializer.
# ==============================

class SubtaskEstadoView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from .serializers import SubtaskEstadoSerializer, SubtaskSerializer

        try:
            subtarea = (
                Subtask.objects
                .select_related('activity')
                .get(pk=pk, activity__usuario=request.user)
            )
        except Subtask.DoesNotExist:
            return std_error(
                "Subtarea no encontrada o no tienes permiso para modificarla.",
                error_code="NOT_FOUND",
                status_code=404,
            )

        serializer = SubtaskEstadoSerializer(subtarea, data=request.data, partial=True)
        if not serializer.is_valid():
            errors = serializer.errors
            return std_error(
                _humanize_subtask_errors(errors),
                error_code="VALIDATION_ERROR",
                data=errors,
                status_code=400,
            )

        serializer.save()

        return std_success(
            SubtaskSerializer(subtarea).data,
            "Estado de la subtarea actualizado correctamente.",
            status_code=200,
        )


# ==============================
# SPRINT 7 — PROGRESO DE ACTIVIDAD BASADO EN SUBTAREAS
# GET /api/v2/activities/{id}/progreso/
#
# Lógica:
#   1. Busca la actividad por ID (solo del usuario autenticado).
#   2. Obtiene todas sus subtareas relacionadas.
#   3. Cuenta total y subtareas con estado "hecha".
#   4. Calcula progreso = (hechas / total) * 100, redondeado a 2 decimales.
#   5. Si no hay subtareas, retorna 0%.
#
# El progreso se calcula en tiempo real; nunca se persiste en la BD.
# ==============================

class ActivityProgresoView(APIView):
    """
    GET /api/v2/activities/{id}/progreso/

    Devuelve el progreso de una actividad basado en el estado real
    de sus subtareas. Solo las subtareas con estado "hecha" cuentan
    como completadas. "pospuesta" no suma al progreso.
    El cálculo es dinámico y nunca se guarda en la base de datos.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # 1. Buscar la actividad garantizando que pertenece al usuario autenticado
        try:
            actividad = Activity.objects.get(pk=pk, usuario=request.user)
        except Activity.DoesNotExist:
            return std_error(
                "Actividad no encontrada o no tienes permiso para verla.",
                error_code="NOT_FOUND",
                status_code=404,
            )

        # 2. Obtener todas las subtareas de la actividad
        subtareas = actividad.subtasks.all()

        # 3. Contar total y completadas
        total_subtareas = subtareas.count()
        subtareas_hechas = subtareas.filter(estado="hecha").count()

        # 4. Calcular progreso (evitar división por cero si no hay subtareas)
        if total_subtareas == 0:
            progreso = 0.0
        else:
            progreso = round((subtareas_hechas / total_subtareas) * 100, 2)

        # 5. Responder con los datos calculados
        return std_success(
            {
                "activity_id": actividad.pk,
                "total_subtasks": total_subtareas,
                "completed_subtasks": subtareas_hechas,
                "progress": progreso,
            },
            "Progreso de la actividad calculado correctamente.",
            status_code=200,
        )


# ==============================
# SPRINT 4b — DISTRIBUCIÓN AUTOMÁTICA DE ACTIVIDADES EN VARIOS DÍAS
# POST /api/v2/activities/distribuir/
#
# Lógica:
#   1. Recibe la actividad normalmente (title, horas_estimadas, start_date, due_date, etc.)
#   2. Si horas_estimadas <= limite_diario → crea la actividad normal sin subtareas.
#   3. Si horas_estimadas > limite_diario → distribuye el trabajo en bloques de
#      maximo `limite_diario` horas por día laborable entre start_date y due_date,
#      creando una Subtask por cada bloque de trabajo.
#   4. Devuelve la actividad creada + las subtareas generadas + el plan de distribución.
#
# Ejemplo:
#   horas_estimadas=14, limite=6, start_date=lunes, due_date=miercoles
#   → Subtarea 1: lunes   6h
#   → Subtarea 2: martes  6h
#   → Subtarea 3: miercoles 2h
# ==============================

def _distribuir_horas_en_dias(start_date, due_date, horas_totales: float, limite: float, user) -> list:
    """
    Distribuye `horas_totales` en bloques de máximo `limite` horas
    entre start_date y due_date (solo días laborables: lunes-viernes).
    Considera las horas ya ocupadas en cada día del usuario.

    Retorna lista de dicts:
        [{ "fecha": date, "horas": float, "horas_ya_ocupadas": float }, ...]
    """
    from datetime import timedelta

    bloques = []
    horas_restantes = round(horas_totales, 2)
    fecha_actual = start_date

    while horas_restantes > 0 and fecha_actual <= due_date:
        # Solo días laborables
        if fecha_actual.weekday() < 5:
            desglose = _calcular_horas_dia(user, fecha_actual)
            horas_ocupadas = desglose["total"]
            horas_disponibles_dia = round(limite - horas_ocupadas, 2)

            if horas_disponibles_dia > 0:
                horas_bloque = round(min(horas_disponibles_dia, horas_restantes), 2)
                bloques.append({
                    "fecha": fecha_actual,
                    "horas": horas_bloque,
                    "horas_ya_ocupadas": horas_ocupadas,
                })
                horas_restantes = round(horas_restantes - horas_bloque, 2)

        fecha_actual = fecha_actual + timedelta(days=1)

    return bloques, horas_restantes  # horas_restantes > 0 significa que no hubo suficientes días


class ActivityDistribuirView(APIView):
    """
    Crea una actividad y si sus horas superan el límite diario,
    genera automáticamente las subtareas distribuidas en días laborables.

    POST /api/v2/activities/distribuir/
    Body: igual que POST /api/activities/ — ningún campo nuevo requerido.

    Respuesta exitosa incluye:
    {
        "success": true,
        "message": "...",
        "data": {
            "actividad": { ...actividad creada... },
            "subtareas_generadas": [ ...subtareas... ],
            "plan_distribucion": [
                { "dia": 1, "fecha": "2026-05-01", "horas_asignadas": 6.0, "horas_ya_ocupadas": 0.0 },
                { "dia": 2, "fecha": "2026-05-02", "horas_asignadas": 6.0, "horas_ya_ocupadas": 1.0 },
                { "dia": 3, "fecha": "2026-05-05", "horas_asignadas": 2.0, "horas_ya_ocupadas": 0.0 },
            ],
            "distribucion_necesaria": true,
            "horas_no_distribuidas": 0.0   — si > 0 no hubo suficientes dias laborables
        }
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.db import transaction
        from .serializers import ActivitySerializer, SubtaskSerializer

        serializer = ActivitySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": _humanize_activity_errors(serializer.errors),
                "data": serializer.errors,
            }, status=400)

        # Sanitizar horas
        horas_raw = request.data.get('horas_estimadas', 0)
        try:
            horas_totales = _sanitizar_horas(horas_raw)
        except ValueError as e:
            return Response({
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": str(e),
            }, status=400)

        limite = float(getattr(request.user, 'limite_horas_diarias', 6))
        start_date = serializer.validated_data.get('start_date')
        due_date   = serializer.validated_data.get('due_date')

        # ── Si no supera el límite: crear normal sin subtareas automáticas
        if horas_totales <= limite:
            with transaction.atomic():
                actividad = serializer.save(usuario=request.user)
            return Response({
                "success": True,
                "message": "Actividad creada correctamente. No requiere distribución.",
                "data": {
                    "actividad": ActivitySerializer(actividad).data,
                    "subtareas_generadas": [],
                    "plan_distribucion": [],
                    "distribucion_necesaria": False,
                    "horas_no_distribuidas": 0.0,
                },
            }, status=201)

        # ── Si supera el límite: calcular distribución antes de guardar
        if not start_date or not due_date:
            return Response({
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": (
                    f"La actividad requiere {horas_totales}h que superan el límite de {limite}h/día. "
                    "Para distribuirla automáticamente debes enviar 'start_date' y 'due_date'."
                ),
            }, status=400)

        bloques, horas_no_distribuidas = _distribuir_horas_en_dias(
            start_date, due_date, horas_totales, limite, request.user
        )

        if not bloques:
            return Response({
                "success": False,
                "error": "SIN_DIAS_DISPONIBLES",
                "message": (
                    f"No hay días laborables con capacidad disponible entre "
                    f"{start_date} y {due_date} para distribuir {horas_totales}h. "
                    "Considera ampliar el rango de fechas o reducir las horas."
                ),
            }, status=422)

        # ── Crear actividad + subtareas en una transacción atómica
        with transaction.atomic():
            actividad = serializer.save(usuario=request.user)

            subtareas_creadas = []
            for i, bloque in enumerate(bloques, start=1):
                subtarea = Subtask.objects.create(
                    title=f"{actividad.title} — Bloque {i}",
                    activity=actividad,
                    fecha=bloque["fecha"],
                    horas_estimadas=bloque["horas"],
                    is_completed=False,
                )
                subtareas_creadas.append(subtarea)

        # ── Armar plan de distribución para la respuesta
        plan = [
            {
                "dia": i,
                "fecha": str(bloque["fecha"]),
                "dia_semana": ["Lunes","Martes","Miércoles","Jueves","Viernes"][bloque["fecha"].weekday()],
                "horas_asignadas": bloque["horas"],
                "horas_ya_ocupadas": bloque["horas_ya_ocupadas"],
            }
            for i, bloque in enumerate(bloques, start=1)
        ]

        mensaje = (
            f"Actividad creada y distribuida en {len(bloques)} día(s) laborable(s)."
            if horas_no_distribuidas == 0
            else (
                f"Actividad creada pero {horas_no_distribuidas}h no pudieron distribuirse "
                f"por falta de días disponibles antes de {due_date}."
            )
        )

        return Response({
            "success": True,
            "message": mensaje,
            "data": {
                "actividad": ActivitySerializer(actividad).data,
                "subtareas_generadas": SubtaskSerializer(subtareas_creadas, many=True).data,
                "plan_distribucion": plan,
                "distribucion_necesaria": True,
                "horas_no_distribuidas": horas_no_distribuidas,
            },
        }, status=201)


# ==============================
# SPRINT 5 — EXCLUSIÓN DE ACTIVIDADES COMPLETADAS
#
# Una actividad se considera COMPLETADA cuando:
#   horas_trabajadas >= horas_estimadas  (y horas_estimadas > 0)
#
# Endpoints nuevos bajo v2/ que excluyen completadas por defecto:
#   GET /api/v2/activities/          — lista solo pendientes
#   GET /api/v2/tasks/hoy/           — panel de hoy sin completadas
#
# Los endpoints originales no se tocan.
# ==============================

def _es_completada(actividad) -> bool:
    """
    Determina si una actividad está completada.
    Criterio: horas_trabajadas >= horas_estimadas y horas_estimadas > 0.
    """
    return (
        actividad.horas_estimadas
        and actividad.horas_estimadas > 0
        and actividad.horas_trabajadas >= actividad.horas_estimadas
    )


def _filtro_pendientes():
    """
    Retorna el filtro Q para excluir actividades completadas desde el ORM.
    Se puede usar en cualquier queryset con .exclude(**_filtro_pendientes()).
    """
    from django.db.models import Q
    # Excluir aquellas donde horas_trabajadas >= horas_estimadas > 0
    return Q(horas_estimadas__gt=0, horas_trabajadas__gte=models.F('horas_estimadas'))


class ActivityListV2View(BaseView, APIView):
    """
    GET /api/v2/activities/
    Lista solo actividades PENDIENTES del usuario autenticado.
    Una actividad desaparece de esta lista cuando horas_trabajadas >= horas_estimadas.

    Query params opcionales:
      ?incluir_completadas=true  — devuelve todas incluyendo las completadas
      ?filtrar_por=dificultad|asignatura|horas_estimadas|fecha
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import F
        incluir_completadas = request.query_params.get('incluir_completadas', 'false').lower() == 'true'

        qs = Activity.objects.filter(usuario=request.user)

        if not incluir_completadas:
            # Excluir actividades donde horas_trabajadas >= horas_estimadas > 0
            qs = qs.exclude(
                horas_estimadas__gt=0,
                horas_trabajadas__gte=F('horas_estimadas')
            )

        from .serializers import ActivitySerializer
        serializer = ActivitySerializer(qs.order_by('due_date'), many=True)
        total_completadas = Activity.objects.filter(
            usuario=request.user,
            horas_estimadas__gt=0,
            horas_trabajadas__gte=F('horas_estimadas')
        ).count()

        return self.success({
            "actividades": serializer.data,
            "total_pendientes": qs.count(),
            "total_completadas": total_completadas,
            "mostrando_completadas": incluir_completadas,
        }, "Actividades obtenidas correctamente.")


class TareasHoyV2View(BaseView, APIView):
    """
    GET /api/v2/tasks/hoy/
    Igual que TareasHoyView pero excluye actividades completadas
    (horas_trabajadas >= horas_estimadas) de todos los grupos y contadores.

    Query params:
      ?incluir_completadas=true  — comportamiento idéntico al endpoint original
      ?filtrar_por=dificultad|asignatura|horas_estimadas|fecha
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import F
        hoy = timezone.localdate()
        fin_semana = hoy + timezone.timedelta(days=7)
        incluir_completadas = request.query_params.get('incluir_completadas', 'false').lower() == 'true'

        tareas = Activity.objects.filter(usuario=request.user)

        # Excluir completadas por defecto
        if not incluir_completadas:
            tareas = tareas.exclude(
                horas_estimadas__gt=0,
                horas_trabajadas__gte=F('horas_estimadas')
            )

        if not tareas.exists():
            return self.success({
                "empty": True,
                "mensaje": "No tienes tareas pendientes.",
                "contadores": {"hoy": 0, "esta_semana": 0, "atrasadas": 0},
                "vencidas": [],
                "hoy": [],
                "proximas": [],
            }, "No tienes tareas pendientes.")

        # Ordenamiento
        filtrar_por = request.query_params.get('filtrar_por', None)
        orden = 'horas_estimadas'
        if filtrar_por == 'dificultad':
            orden = 'difficulty'
        elif filtrar_por == 'asignatura':
            orden = 'asignatura'
        elif filtrar_por == 'fecha':
            orden = 'due_date'

        vencidas   = tareas.filter(due_date__lt=hoy).order_by(orden)
        hoy_tareas = tareas.filter(due_date=hoy).order_by(orden)
        proximas   = tareas.filter(due_date__gt=hoy).order_by(orden)

        contadores = {
            "hoy":        hoy_tareas.count(),
            "esta_semana": tareas.filter(due_date__gt=hoy, due_date__lte=fin_semana).count(),
            "atrasadas":  vencidas.count(),
        }

        return self.success({
            "empty": False,
            "contadores": contadores,
            "vencidas":  TareaHoyV2Serializer(vencidas, many=True).data,
            "hoy":       TareaHoyV2Serializer(hoy_tareas, many=True).data,
            "proximas":  TareaHoyV2Serializer(proximas, many=True).data,
        }, "Tareas obtenidas correctamente.")


# ==============================
# FIX SPRINT 3+5 — VISTA UNIFICADA v2/activities/
# Antes habia dos rutas distintas con el mismo path, rompiendo el routing de Django.
# Esta clase maneja GET (listar pendientes) y POST (crear con idempotencia).
# ==============================

class ActivityV2View(BaseView, APIView):
    """
    GET  /api/v2/activities/ - Lista actividades pendientes
    POST /api/v2/activities/ - Crea actividad con idempotencia
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import F
        from .serializers import ActivitySerializer

        incluir_completadas = request.query_params.get("incluir_completadas", "false").lower() == "true"
        qs = Activity.objects.filter(usuario=request.user)

        if not incluir_completadas:
            qs = qs.exclude(horas_estimadas__gt=0, horas_trabajadas__gte=F("horas_estimadas"))

        total_completadas = Activity.objects.filter(
            usuario=request.user,
            horas_estimadas__gt=0,
            horas_trabajadas__gte=F("horas_estimadas")
        ).count()

        serializer = ActivitySerializer(qs.order_by("due_date"), many=True)
        return self.success({
            "actividades": serializer.data,
            "total_pendientes": qs.count(),
            "total_completadas": total_completadas,
            "mostrando_completadas": incluir_completadas,
        }, "Actividades obtenidas correctamente.")

    def post(self, request):
        from .serializers import ActivitySerializer

        if _check_idempotency(request.user.id, request.data):
            return std_error(
                "Detectamos una solicitud duplicada.",
                error_code="DUPLICATE_REQUEST",
                status_code=409
            )

        serializer = ActivitySerializer(data=request.data)
        if not serializer.is_valid():
            errors = serializer.errors
            message = _humanize_activity_errors(errors)
            return std_error(message, error_code="VALIDATION_ERROR", data=errors, status_code=400)

        serializer.save(usuario=request.user)
        return std_success(serializer.data, "Actividad creada correctamente.", status_code=201)


# ==============================
# SPRINT 8 — REGISTRAR HORAS INVERTIDAS EN ACTIVIDAD SIN SUBTAREAS
# PATCH /api/v2/activities/<pk>/horas/
#
# Reglas (solo aplica a actividades SIN subtareas):
#   horas_invertidas < horas_estimadas  → no completada (actualiza horas_trabajadas)
#   horas_invertidas == horas_estimadas → completada    (actualiza horas_trabajadas)
#   horas_invertidas > horas_estimadas  → error 400
#
# Si la actividad TIENE subtareas → error 400 (usar endpoint de subtareas).
# ==============================

class RegistrarHorasActividadView(BaseView, APIView):
    """
    PATCH /api/v2/activities/<pk>/horas/

    Registra las horas invertidas en una actividad que NO tiene subtareas.
    Actualiza el campo horas_trabajadas del modelo Activity.

    Reglas de negocio:
      - La actividad debe pertenecer al usuario autenticado.
      - La actividad NO debe tener subtareas (usar endpoint de estado de subtarea
        para actividades con subtareas).
      - horas_invertidas debe ser un número >= 0.
      - Si horas_invertidas > horas_estimadas → error 400 con mensaje descriptivo.
      - Si horas_invertidas == horas_estimadas → la actividad queda completada.
      - Si horas_invertidas < horas_estimadas → la actividad queda en progreso
        (o sin empezar si horas_invertidas == 0).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        # 1. Verificar que la actividad existe y pertenece al usuario
        try:
            actividad = Activity.objects.get(pk=pk, usuario=request.user)
        except Activity.DoesNotExist:
            return std_error(
                "Actividad no encontrada o no tienes permiso para modificarla.",
                error_code="NOT_FOUND",
                status_code=404,
            )

        # 2. Verificar que la actividad NO tiene subtareas
        if actividad.subtasks.exists():
            return std_error(
                "No se pueden usar horas invertidas en actividades con subtareas.",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )

        # 3. Obtener y validar horas_invertidas del body
        horas_raw = request.data.get("horas_invertidas")
        if horas_raw is None:
            return std_error(
                "El campo horas_invertidas es requerido.",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )

        try:
            horas_invertidas = float(horas_raw)
        except (TypeError, ValueError):
            return std_error(
                "El campo horas_invertidas debe ser un número válido.",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )

        if horas_invertidas < 0:
            return std_error(
                "Las horas invertidas no pueden ser negativas.",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )

        horas_estimadas = float(actividad.horas_estimadas or 0)

        # 4. Aplicar reglas de negocio
        if horas_invertidas > horas_estimadas:
            return std_error(
                "Las horas invertidas no pueden ser mayores a las horas estimadas de la actividad.",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )

        # horas_invertidas <= horas_estimadas → guardar siempre
        actividad.horas_trabajadas = horas_invertidas
        actividad.save(update_fields=["horas_trabajadas", "updated_at"])

        # 5. Calcular estado resultante para informar al cliente
        if horas_estimadas <= 0:
            estado = "sin_horas"
        elif horas_invertidas == 0:
            estado = "sin_empezar"
        elif horas_invertidas == horas_estimadas:
            estado = "completada"
        else:
            estado = "en_progreso"

        porcentaje = (
            round((horas_invertidas / horas_estimadas) * 100, 1)
            if horas_estimadas > 0 else 0
        )

        return std_success(
            {
                "activity_id":      actividad.pk,
                "horas_estimadas":  horas_estimadas,
                "horas_invertidas": horas_invertidas,
                "estado":           estado,
                "porcentaje_completado": porcentaje,
            },
            "Horas registradas correctamente.",
            status_code=200,
        )


# ==============================
# SPRINT 9 — COMPLETAR ACTIVIDAD CON SUBTAREAS
# POST /api/v2/activities/<pk>/completar/
#
# Reglas de negocio:
#   1. La actividad DEBE tener subtareas (si no tiene, usar /horas/).
#   2. Si hay subtareas PENDIENTES o POSPUESTAS → 400, no se puede completar.
#   3. Todas "hecha" Y suma_horas == horas_estimadas → completada (200 ok).
#   4. Todas "hecha" Y suma_horas < horas_estimadas  → warning 200 con
#      status "warning_horas" y mensaje descriptivo. La actividad NO se
#      marca como completada; el frontend decide si forzar o agregar subtareas.
#   5. Acepta parámetro opcional { "forzar": true } para ignorar el warning
#      y completar aunque la suma de horas sea menor.
#   NOTA: horas_invertidas (horas_trabajadas) no se considera aquí.
# ==============================

class CompletarActividadView(APIView):
    """
    POST /api/v2/activities/<pk>/completar/

    Intenta completar una actividad que tiene subtareas.

    Body (opcional):
        { "forzar": true }   → fuerza la completación aunque haya diferencia de horas.

    Respuestas:
        200 ok          → completada exitosamente (status: "completada")
        200 warning     → todas hechas pero faltan horas (status: "warning_horas")
        400             → hay subtareas pendientes/pospuestas, o sin subtareas
        404             → actividad no encontrada
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        # 1. Verificar que la actividad existe y pertenece al usuario
        try:
            actividad = Activity.objects.get(pk=pk, usuario=request.user)
        except Activity.DoesNotExist:
            return std_error(
                "Actividad no encontrada o no tienes permiso para modificarla.",
                error_code="NOT_FOUND",
                status_code=404,
            )

        # 2. Verificar que la actividad TIENE subtareas
        subtareas = actividad.subtasks.all()
        if not subtareas.exists():
            return std_error(
                "Esta actividad no tiene subtareas. Usa el endpoint /horas/ para registrar horas directamente.",
                error_code="VALIDATION_ERROR",
                status_code=400,
            )

        total_subtareas = subtareas.count()
        subtareas_hechas = subtareas.filter(estado="hecha").count()
        subtareas_pendientes = subtareas.exclude(estado="hecha").count()

        # 3. Si hay subtareas que NO están "hecha" → bloquear sin warning
        if subtareas_pendientes > 0:
            pendientes_detalle = list(
                subtareas.exclude(estado="hecha").values("id", "title", "estado")
            )
            return std_error(
                f"No se puede completar la actividad: {subtareas_pendientes} subtarea(s) aún no están en estado 'hecha'.",
                error_code="SUBTASKS_PENDING",
                data={
                    "total_subtasks": total_subtareas,
                    "completed_subtasks": subtareas_hechas,
                    "pending_subtasks": subtareas_pendientes,
                    "detalle": pendientes_detalle,
                },
                status_code=400,
            )

        # A partir de aquí: TODAS las subtareas están "hecha"
        from django.db.models import Sum
        suma_horas_subtareas = float(
            subtareas.aggregate(total=Sum("horas_estimadas"))["total"] or 0
        )
        horas_estimadas_actividad = float(actividad.horas_estimadas or 0)

        forzar = bool(request.data.get("forzar", False))

        # 4. Todas "hecha" pero suma < horas_estimadas → warning (a menos que se fuerce)
        if suma_horas_subtareas < horas_estimadas_actividad and not forzar:
            diferencia = round(horas_estimadas_actividad - suma_horas_subtareas, 2)
            return Response(
                {
                    "success": True,
                    "status": "warning_horas",
                    "message": (
                        "Aún faltan horas para completar la actividad. "
                        "¿Deseas finalizarla o agregar más subtareas?"
                    ),
                    "data": {
                        "activity_id": actividad.pk,
                        "horas_estimadas": horas_estimadas_actividad,
                        "suma_horas_subtareas": suma_horas_subtareas,
                        "horas_faltantes": diferencia,
                        "total_subtasks": total_subtareas,
                        "completed_subtasks": subtareas_hechas,
                    },
                },
                status=200,
            )

        # 5. Todas "hecha" Y (suma == horas_estimadas  O  forzar=true) → completar
        actividad.horas_trabajadas = suma_horas_subtareas
        actividad.save(update_fields=["horas_trabajadas", "updated_at"])

        return std_success(
            {
                "activity_id": actividad.pk,
                "status": "completada",
                "horas_estimadas": horas_estimadas_actividad,
                "suma_horas_subtareas": suma_horas_subtareas,
                "total_subtasks": total_subtareas,
                "completed_subtasks": subtareas_hechas,
                "forzado": forzar,
            },
            "Actividad completada exitosamente.",
            status_code=200,
        )


# ==============================
# Sprint 10 — Actividades completadas al 100%
# ==============================

class ActividadesCompletadasView(BaseView, APIView):
    """
    GET /api/v2/activities/completadas/

    Retorna SOLO las actividades completadas al 100% del usuario autenticado.

    Criterios de completado:
      - Sin subtareas  : horas_trabajadas == horas_estimadas (y horas_estimadas > 0)
      - Con subtareas  : todas en estado "hecha" Y suma(horas_estimadas subtareas) >= horas_estimadas actividad
      - Forzado        : actividades completadas con { "forzar": true } quedan marcadas igual
                         (horas_trabajadas guarda la suma real; el flag "forzado" se refleja en la respuesta)

    No se incluyen actividades parciales, pendientes, ni atrasadas.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, F, Q

        actividades_qs = Activity.objects.filter(
            usuario=request.user,
            horas_estimadas__gt=0,
        ).prefetch_related("subtasks")

        completadas = []

        for actividad in actividades_qs:
            subtareas = actividad.subtasks.all()
            tiene_subtareas = subtareas.exists()

            if tiene_subtareas:
                # Todas deben estar en "hecha"
                total = subtareas.count()
                hechas = subtareas.filter(estado="hecha").count()
                if hechas < total:
                    continue  # hay subtareas pendientes/pospuestas → no completada

                # Suma de horas de subtareas debe cubrir las estimadas de la actividad
                suma = float(subtareas.aggregate(total=Sum("horas_estimadas"))["total"] or 0)
                horas_est = float(actividad.horas_estimadas)

                # Completado normal: suma exacta. Completado forzado: suma puede ser menor
                # En ambos casos horas_trabajadas ya fue persistido por CompletarActividadView
                es_forzado = suma < horas_est and actividad.horas_trabajadas > 0
                es_normal = suma >= horas_est

                if not (es_normal or es_forzado):
                    continue

                completadas.append({
                    "id": actividad.pk,
                    "title": actividad.title,
                    "description": actividad.description,
                    "due_date": str(actividad.due_date),
                    "horas_estimadas": horas_est,
                    "horas_invertidas": float(actividad.horas_trabajadas),
                    "tipo": "con_subtareas",
                    "subtareas_total": total,
                    "subtareas_hechas": hechas,
                    "forzar": es_forzado,
                    "asignatura": actividad.asignatura.nombre if actividad.asignatura else None,
                })

            else:
                # Sin subtareas: horas_trabajadas debe ser igual a horas_estimadas
                if actividad.horas_trabajadas != actividad.horas_estimadas:
                    continue

                completadas.append({
                    "id": actividad.pk,
                    "title": actividad.title,
                    "description": actividad.description,
                    "due_date": str(actividad.due_date),
                    "horas_estimadas": float(actividad.horas_estimadas),
                    "horas_invertidas": float(actividad.horas_trabajadas),
                    "tipo": "sin_subtareas",
                    "subtareas_total": 0,
                    "subtareas_hechas": 0,
                    "forzar": False,
                    "asignatura": actividad.asignatura.nombre if actividad.asignatura else None,
                })

        return self.success(
            {
                "total": len(completadas),
                "actividades": completadas,
            },
            "Actividades completadas al 100% obtenidas correctamente.",
        )


# ==============================
# SWAGGER / EXTEND_SCHEMA — documentación de todos los endpoints
# Se aplica DESPUÉS de definir las clases para no tocar ningún código existente.
# ==============================

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

# ── AUTH ─────────────────────────────────────────────────────────────────────

RegisterView = extend_schema(
    tags=["Auth"],
    summary="Registrar nuevo usuario",
    description="Crea una cuenta nueva. Devuelve tokens JWT al instante.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "nombre":    {"type": "string", "example": "Juan"},
                "apellido":  {"type": "string", "example": "Pérez"},
                "email":     {"type": "string", "example": "juan@email.com"},
                "password":  {"type": "string", "example": "segura123"},
                "password2": {"type": "string", "example": "segura123"},
            },
            "required": ["nombre", "apellido", "email", "password", "password2"],
        }
    },
    responses={
        201: {"description": "Usuario creado. Devuelve access y refresh token."},
        400: {"description": "Datos inválidos (email duplicado, contraseñas distintas, etc.)"},
    }
)(RegisterView)

LoginView = extend_schema(
    tags=["Auth"],
    summary="Iniciar sesión",
    description="Autentica al usuario con email y contraseña. Devuelve tokens JWT.",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "email":    {"type": "string", "example": "juan@email.com"},
                "password": {"type": "string", "example": "segura123"},
            },
            "required": ["email", "password"],
        }
    },
    responses={
        200: {"description": "Login exitoso. Devuelve nombre, email, rol, access y refresh token."},
        401: {"description": "Correo no existe o contraseña incorrecta."},
        403: {"description": "Cuenta desactivada."},
    }
)(LoginView)

# ── ASIGNATURAS ───────────────────────────────────────────────────────────────

AsignaturaListCreateAPIView = extend_schema_view(
    list=extend_schema(tags=["Asignaturas"], summary="Listar asignaturas"),
    create=extend_schema(tags=["Asignaturas"], summary="Crear asignatura"),
)(AsignaturaListCreateAPIView)

AsignaturaRetrieveUpdateDestroyAPIView = extend_schema_view(
    retrieve=extend_schema(tags=["Asignaturas"], summary="Detalle de asignatura"),
    update=extend_schema(tags=["Asignaturas"], summary="Actualizar asignatura"),
    destroy=extend_schema(tags=["Asignaturas"], summary="Eliminar asignatura"),
)(AsignaturaRetrieveUpdateDestroyAPIView)

# ── ACTIVIDADES ───────────────────────────────────────────────────────────────

ActivityListCreateAPIView = extend_schema_view(
    list=extend_schema(
        tags=["Actividades"],
        summary="Listar actividades del usuario",
        description="Devuelve todas las actividades del usuario autenticado.",
    ),
    create=extend_schema(
        tags=["Actividades"],
        summary="Crear actividad",
        description=(
            "Crea una actividad. Campos requeridos: title, description, due_date, "
            "start_date, difficulty (baja/media/alta/critica), "
            "activity_type (exam/project/presentation/homework)."
        ),
    ),
)(ActivityListCreateAPIView)

ActivityRetrieveUpdateDestroyAPIView = extend_schema_view(
    retrieve=extend_schema(tags=["Actividades"], summary="Detalle de actividad"),
    update=extend_schema(tags=["Actividades"], summary="Actualizar actividad"),
    destroy=extend_schema(tags=["Actividades"], summary="Eliminar actividad"),
)(ActivityRetrieveUpdateDestroyAPIView)

ReprogramarActividadView = extend_schema(
    tags=["Actividades"],
    summary="Reprogramar fecha de entrega",
    description=(
        "Cambia la due_date de la actividad. "
        "Validaciones: formato YYYY-MM-DD, no puede ser fecha pasada, "
        "solo el dueño puede reprogramar."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "due_date": {"type": "string", "example": "2026-06-15"},
            },
            "required": ["due_date"],
        }
    },
    responses={
        200: {"description": "Actividad reprogramada. Devuelve id, title, due_date, updated_at."},
        400: {"description": "Fecha inválida o en el pasado."},
        404: {"description": "Actividad no encontrada o sin permiso."},
    }
)(ReprogramarActividadView)

# ── SUBTAREAS ─────────────────────────────────────────────────────────────────

SubtaskListCreateAPIView = extend_schema_view(
    list=extend_schema(tags=["Subtareas"], summary="Listar subtareas del usuario"),
    create=extend_schema(
        tags=["Subtareas"],
        summary="Crear subtarea",
        description="Crea una subtarea vinculada a una actividad del usuario.",
    ),
)(SubtaskListCreateAPIView)

SubtaskRetrieveUpdateDestroyAPIView = extend_schema_view(
    retrieve=extend_schema(tags=["Subtareas"], summary="Detalle de subtarea"),
    update=extend_schema(tags=["Subtareas"], summary="Actualizar subtarea"),
    destroy=extend_schema(tags=["Subtareas"], summary="Eliminar subtarea"),
)(SubtaskRetrieveUpdateDestroyAPIView)

SubtaskPatchView = extend_schema(
    tags=["Subtareas"],
    summary="PATCH parcial de subtarea (Sprint 2)",
    description=(
        "Actualiza solo los campos enviados: fecha, horas_estimadas, is_completed, title. "
        "Re-valida el límite de horas diarias. "
        "Usa select_for_update() para evitar condiciones de carrera."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "fecha":           {"type": "string", "example": "2026-05-10"},
                "horas_estimadas": {"type": "number", "example": 2.5},
                "is_completed":    {"type": "boolean", "example": False},
                "title":           {"type": "string", "example": "Estudiar capítulo 3"},
            },
        }
    },
    responses={
        200: {"description": "Subtarea actualizada. Devuelve el objeto completo."},
        400: {"description": "Datos inválidos."},
        404: {"description": "Subtarea no encontrada o sin permiso."},
        422: {"description": "Límite de horas diarias excedido. Incluye math desglosado."},
    }
)(SubtaskPatchView)

# ── TAREAS HOY ────────────────────────────────────────────────────────────────

TareasHoyView = extend_schema(
    tags=["Tareas"],
    summary="Panel de tareas de hoy",
    description=(
        "Agrupa las actividades en: vencidas, hoy y próximas. "
        "Query param opcional: ?filtrar_por=dificultad|asignatura|horas_estimadas|fecha"
    ),
    parameters=[
        OpenApiParameter(
            name="filtrar_por",
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description="Ordenar por: dificultad, asignatura, horas_estimadas, fecha",
            required=False,
        )
    ],
    responses={
        200: {"description": "Devuelve contadores + grupos vencidas/hoy/proximas."},
    }
)(TareasHoyView)

# ── LÍMITE HORAS ──────────────────────────────────────────────────────────────

LimiteHorasDiariasView = extend_schema(
    tags=["Usuario"],
    summary="Consultar y actualizar límite de horas diarias",
    description=(
        "GET: devuelve el límite actual del usuario (default 6h). "
        "PUT: actualiza el límite. Acepta valores entre 1 y 24."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "limite_horas_diarias": {"type": "number", "example": 8},
            },
            "required": ["limite_horas_diarias"],
        }
    },
    responses={
        200: {"description": "Límite obtenido o actualizado correctamente."},
        400: {"description": "Valor fuera del rango 1-24."},
    }
)(LimiteHorasDiariasView)

# ── VALIDAR LÍMITE ────────────────────────────────────────────────────────────

ValidarLimiteHorasView = extend_schema(
    tags=["Validar"],
    summary="Validar si una tarea cabe en el día",
    description=(
        "Suma las horas del día y verifica si las nuevas horas caben. "
        "Si no caben, sugiere qué subtarea mover y a qué día."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "tipo":            {"type": "string",  "example": "subtarea"},
                "fecha":           {"type": "string",  "example": "2026-05-05"},
                "horas_estimadas": {"type": "number",  "example": 3},
            },
            "required": ["tipo", "fecha", "horas_estimadas"],
        }
    },
    responses={
        200: {"description": "Dentro del límite. Devuelve permite: true."},
        422: {
            "description": (
                "Límite excedido. Devuelve status: limit_exceeded, "
                "horas_usadas, horas_disponibles y suggestion con task_to_move_id y suggested_date."
            )
        },
    }
)(ValidarLimiteHorasView)

# ── V2 ENDPOINTS ──────────────────────────────────────────────────────────────

RegisterV2View = extend_schema(
    tags=["Auth v2"],
    summary="Registrar usuario (v2 — respuesta unificada + idempotencia)",
    description="Igual que /auth/register/ pero con estructura { success, message, data } y protección contra doble envío (409).",
    responses={
        201: {"description": "Usuario creado."},
        400: {"description": "Datos inválidos."},
        409: {"description": "Petición duplicada detectada (doble clic)."},
    }
)(RegisterV2View)

LoginV2View = extend_schema(
    tags=["Auth v2"],
    summary="Login (v2 — códigos HTTP semánticos)",
    description="401 para credenciales incorrectas, 403 para cuenta desactivada, error_code interno para el front.",
    responses={
        200: {"description": "Login exitoso."},
        401: {"description": "Correo o contraseña incorrectos."},
        403: {"description": "Cuenta desactivada."},
    }
)(LoginV2View)

ActivityCreateV2View = extend_schema(
    tags=["Actividades v2"],
    summary="Crear actividad (v2 — idempotencia + mensajes humanizados)",
    description="Igual que POST /activities/ pero con idempotencia (409) y mensajes de error orientados a la solución.",
    responses={
        201: {"description": "Actividad creada."},
        400: {"description": "Datos inválidos con mensaje humanizado."},
        409: {"description": "Petición duplicada."},
    }
)(ActivityCreateV2View)

ActivityListV2View = extend_schema(
    tags=["Actividades v2"],
    summary="Listar actividades pendientes (v2 — excluye completadas)",
    description=(
        "Solo devuelve actividades donde horas_trabajadas < horas_estimadas. "
        "Usa ?incluir_completadas=true para verlas todas. "
        "Incluye contadores total_pendientes y total_completadas."
    ),
    parameters=[
        OpenApiParameter("incluir_completadas", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False),
    ],
    responses={200: {"description": "Lista de actividades pendientes + contadores."}}
)(ActivityListV2View)

SubtaskCreateV2View = extend_schema(
    tags=["Subtareas v2"],
    summary="Crear subtarea (v2 — idempotencia + 403 explícito)",
    responses={
        201: {"description": "Subtarea creada."},
        400: {"description": "Datos inválidos."},
        403: {"description": "Sin permiso sobre la actividad padre."},
        409: {"description": "Petición duplicada."},
    }
)(SubtaskCreateV2View)

SubtaskPatchV2View = extend_schema(
    tags=["Subtareas v2"],
    summary="PATCH parcial de subtarea (v2 — SUM real desde BD + math desglosado)",
    description=(
        "Igual que /subtasks/{id}/patch/ pero usa _calcular_horas_dia() con SUM real "
        "y devuelve payload math completo al exceder el límite."
    ),
    responses={
        200: {"description": "Subtarea actualizada."},
        422: {"description": "Límite excedido. Incluye math: { limite_diario, horas_asignadas, horas_intentadas, exceso_horas }."},
    }
)(SubtaskPatchV2View)

ReprogramarActividadV2View = extend_schema(
    tags=["Actividades v2"],
    summary="Reprogramar actividad (v2 — mensajes orientados a la solución)",
    responses={
        200: {"description": "Reprogramada correctamente."},
        400: {"description": "Fecha inválida o en el pasado — mensaje claro."},
        404: {"description": "Actividad no encontrada."},
    }
)(ReprogramarActividadV2View)

ValidarLimiteHorasV2View = extend_schema(
    tags=["Validar v2"],
    summary="Validar límite de horas (v2 — payload math desglosado)",
    description=(
        "Igual que /validar/limite-horas/ pero la respuesta de conflicto incluye "
        "math: { limite_diario, horas_actividades, horas_subtareas, horas_asignadas, "
        "horas_intentadas, total_resultante, exceso_horas, horas_disponibles }."
    ),
    responses={
        200: {"description": "Dentro del límite. Incluye math completo."},
        422: {"description": "Límite excedido. Math desglosado + suggestion."},
    }
)(ValidarLimiteHorasV2View)

TareasHoyV2View = extend_schema(
    tags=["Tareas v2"],
    summary="Panel de hoy (v2 — excluye completadas + campo estado)",
    description=(
        "Igual que /tasks/hoy/ pero excluye actividades completadas por defecto. "
        "Cada actividad incluye estado (sin_empezar/en_progreso/completada/sin_horas), "
        "estado_label y porcentaje_completado."
    ),
    parameters=[
        OpenApiParameter("incluir_completadas", OpenApiTypes.BOOL, OpenApiParameter.QUERY, required=False),
        OpenApiParameter("filtrar_por", OpenApiTypes.STR, OpenApiParameter.QUERY, required=False),
    ],
    responses={200: {"description": "Panel con grupos vencidas/hoy/proximas. Cada actividad trae campo estado."}}
)(TareasHoyV2View)

ActivityDistribuirView = extend_schema(
    tags=["Actividades v2"],
    summary="Crear actividad con distribución automática de horas",
    description=(
        "Si horas_estimadas <= límite diario: crea la actividad normal. "
        "Si horas_estimadas > límite: distribuye automáticamente en bloques por días laborables "
        "entre start_date y due_date, creando una Subtask por bloque. "
        "Devuelve plan_distribucion con fecha, día de la semana y horas por bloque."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "title":           {"type": "string",  "example": "Proyecto final"},
                "description":     {"type": "string",  "example": "Desarrollo completo"},
                "due_date":        {"type": "string",  "example": "2026-05-30"},
                "start_date":      {"type": "string",  "example": "2026-05-05"},
                "difficulty":      {"type": "string",  "example": "alta"},
                "activity_type":   {"type": "string",  "example": "project"},
                "horas_estimadas": {"type": "number",  "example": 14},
            },
        }
    },
    responses={
        201: {"description": "Actividad creada con subtareas distribuidas. Incluye plan_distribucion y horas_no_distribuidas."},
        400: {"description": "Datos inválidos o falta start_date/due_date para la distribución."},
        422: {"description": "Sin días laborables disponibles en el rango de fechas."},
    }
)(ActivityDistribuirView)
RegistrarHorasActividadView = extend_schema(
    tags=["Actividades v2"],
    summary="Registrar horas invertidas en actividad sin subtareas (Sprint 8)",
    description=(
        "Actualiza las horas_trabajadas de una actividad que NO tiene subtareas. "
        "Reglas: horas_invertidas < horas_estimadas → en progreso; "
        "horas_invertidas == horas_estimadas → completada; "
        "horas_invertidas > horas_estimadas → error 400. "
        "Si la actividad tiene subtareas el endpoint rechaza la petición."
    ),
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "horas_invertidas": {"type": "number", "example": 3.5},
            },
            "required": ["horas_invertidas"],
        }
    },
    responses={
        200: {"description": "Horas registradas. Devuelve estado y porcentaje_completado."},
        400: {"description": "Horas mayores a estimadas, actividad con subtareas, o datos inválidos."},
        404: {"description": "Actividad no encontrada."},
    }
)(RegistrarHorasActividadView)