from rest_framework import serializers
from .models import Asignatura, Activity, Subtask, Usuario
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password

# ==============================
# AUTH SERIALIZERS  ← NUEVO
# ==============================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    nombre = serializers.CharField(required=True)
    apellido = serializers.CharField(required=True)

    class Meta:
        model = Usuario
        # DEBES incluir 'username' aunque sea opcional en el JSON de entrada, 
        # o Django se quejará al validar el modelo.
        fields = ('nombre', 'apellido', 'email', 'password', 'password2', 'username')
        extra_kwargs = {
            'username': {'required': False} # Lo hacemos opcional porque lo generamos abajo
        }

    def validate_nombre(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Ingresa tu nombre.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("El nombre debe tener al menos 2 caracteres.")
        return value.strip()

    def validate_apellido(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Ingresa tu apellido.")
        if len(value.strip()) < 2:
            raise serializers.ValidationError("El apellido debe tener al menos 2 caracteres.")
        return value.strip()

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Ingresa tu correo electronico.")
        if Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este correo electronico ya esta registrado.")
        return value

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Minimo 6 caracteres para contrasena.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contrasenas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        import uuid
        # Generar username unico a partir del email
        username = validated_data['email'].split('@')[0] + '_' + str(uuid.uuid4())[:4]
        user = Usuario.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=validated_data['password'],
            nombre=validated_data['nombre'],
            apellido=validated_data['apellido'],
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


# ==============================
# ASIGNATURAS
# ==============================

class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'


# ==============================
# SUBTAREAS
# ==============================

class SubtaskSerializer(serializers.ModelSerializer):
    fecha = serializers.DateField(required=False, allow_null=True)
    horas_estimadas = serializers.FloatField(required=False, allow_null=True, default=0)

    class Meta:
        model = Subtask
        fields = '__all__'

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "El titulo debe tener al menos 3 caracteres."
            )
        return value

    def validate(self, attrs):
        activity = attrs.get('activity')
        fecha = attrs.get('fecha')
        horas_estimadas = attrs.get('horas_estimadas')

        if activity:
            # Validar que la fecha de la subtarea no sea mayor a la de la actividad
            if fecha is not None and activity.due_date is not None:
                if fecha > activity.due_date:
                    raise serializers.ValidationError({
                        "fecha": f"La fecha de la subtarea no puede ser mayor a la fecha de entrega de la actividad ({activity.due_date})."
                    })

            # Validar que la SUMA de horas de todas las subtareas no supere las horas de la actividad
            if horas_estimadas is not None and activity.horas_estimadas is not None:
                from django.db.models import Sum
                # Sumar horas de subtareas ya existentes de esta actividad
                horas_otras = float(
                    activity.subtasks.aggregate(total=Sum('horas_estimadas'))['total'] or 0
                )
                horas_actividad = float(activity.horas_estimadas)
                if horas_otras + float(horas_estimadas) > horas_actividad:
                    disponibles = round(horas_actividad - horas_otras, 2)
                    raise serializers.ValidationError({
                        "horas_estimadas": (
                            f"Las horas de esta subtarea ({horas_estimadas}h) superan lo disponible en la actividad. "
                            f"Horas de la actividad: {horas_actividad}h, "
                            f"ya asignadas en otras subtareas: {horas_otras}h, "
                            f"disponibles: {disponibles}h."
                        )
                    })

        return attrs


# ==============================
# ACTIVIDADES
# ==============================

class ActivitySerializer(serializers.ModelSerializer):
    subtasks = SubtaskSerializer(many=True, required=False, write_only=True)
    asignatura_nombre = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        write_only=True
    )
    asignatura_detalle = serializers.SerializerMethodField()

    title = serializers.CharField(required=True)
    due_date = serializers.DateField(required=True)
    description = serializers.CharField(required=True)
    start_date = serializers.DateField(required=True)
    difficulty = serializers.CharField(required=True)
    activity_type = serializers.CharField(required=True)

    class Meta:
        model = Activity
        fields = '__all__'

    def get_asignatura_detalle(self, obj):
        if obj.asignatura:
            return obj.asignatura.nombre
        return None

    def validate_due_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("La fecha de vencimiento no puede ser anterior a la fecha actual.")
        return value

    def validate_start_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError(
            "La fecha de inicio no puede ser anterior a la fecha actual."
        )
        return value

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres.")
        return value

    def create(self, validated_data):
        subtasks_data = validated_data.pop('subtasks', [])
        asignatura_nombre = validated_data.pop('asignatura_nombre', None)

        # Si viene nombre de asignatura, buscarla o crearla automaticamente
        if asignatura_nombre and asignatura_nombre.strip():
            asignatura_obj = Asignatura.objects.filter(nombre__iexact=asignatura_nombre.strip()).first()
            if not asignatura_obj:
                # Generar codigo unico basado en el nombre
                import re, uuid
                codigo_base = re.sub(r'[^a-zA-Z0-9]', '', asignatura_nombre).upper()[:10]
                codigo = f"{codigo_base}_{str(uuid.uuid4())[:4].upper()}"
                asignatura_obj = Asignatura.objects.create(
                    nombre=asignatura_nombre.strip(),
                    codigo=codigo,
                    creditos=0
                )
            validated_data['asignatura'] = asignatura_obj

        activity = Activity.objects.create(**validated_data)
        for subtask_data in subtasks_data:
            Subtask.objects.create(activity=activity, **subtask_data)
        return activity

    def validate_description(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError(
                "La descripción debe tener al menos 3 caracteres.."
            )
        return value

    def validate_difficulty(self, value):
        opciones = ["baja", "media", "alta", "critica"]
        if value.lower() not in opciones:
            raise serializers.ValidationError(
            "La dificultad debe ser: baja, media, alta o critica."
        )
        return value

    def validate_activity_type(self, value):
        tipos = ["exam", "project", "presentation", "homework"]
        if value.lower() not in tipos:
            raise serializers.ValidationError(
            "El tipo de actividad debe ser: exam, project, presentation o homework."
        )
        return value
class TareaHoySerializer(serializers.ModelSerializer):
    progreso_horas = serializers.SerializerMethodField()
    progreso_subtareas = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id', 'title', 'description', 'due_date', 'start_date',
            'horas_estimadas', 'horas_trabajadas', 'progreso_horas',
            'progreso_subtareas', 'difficulty', 'activity_type', 'asignatura'
        ]

    def get_progreso_horas(self, obj):
        # Progreso basado en horas trabajadas vs estimadas
        if obj.horas_estimadas and obj.horas_estimadas > 0:
            return round((obj.horas_trabajadas / obj.horas_estimadas) * 100, 1)
        return 0

    def get_progreso_subtareas(self, obj):
        # Progreso basado en subtareas completadas vs total
        total = obj.subtasks.count()
        if total == 0:
            return {"completadas": 0, "total": 0, "porcentaje": 0}
        completadas = obj.subtasks.filter(is_completed=True).count()
        return {
            "completadas": completadas,
            "total": total,
            "porcentaje": round((completadas / total) * 100, 1)
        }

# ==============================
# SPRINT 2 — SubtaskPatchSerializer
# Serializer dedicado para PATCH parcial de subtareas.
# Acepta cualquier combinacion de: fecha, horas_estimadas, is_completed, title.
# Re-valida cada campo recibido de forma independiente (no confiar en el Front).
# ==============================

class SubtaskPatchSerializer(serializers.ModelSerializer):
    """
    Usado exclusivamente en PATCH /subtasks/{id}/patch/
    Todos los campos son opcionales — solo se actualiza lo que llega.
    Incluye re-validacion de limite de horas diarias si cambia fecha u horas.
    """
    fecha = serializers.DateField(required=False, allow_null=True)
    horas_estimadas = serializers.FloatField(required=False, allow_null=True)
    is_completed = serializers.BooleanField(required=False)
    title = serializers.CharField(required=False)

    class Meta:
        model = Subtask
        fields = ['fecha', 'horas_estimadas', 'is_completed', 'title']

    def validate_title(self, value):
        if value and len(value.strip()) < 3:
            raise serializers.ValidationError("El titulo debe tener al menos 3 caracteres.")
        return value.strip() if value else value

    def validate_horas_estimadas(self, value):
        if value is None:
            return value
        if value < 0:
            raise serializers.ValidationError("Las horas estimadas no pueden ser negativas.")
        # Re-validar contra horas de la actividad padre
        if self.instance:
            activity = self.instance.activity
            if activity.horas_estimadas and float(value) > float(activity.horas_estimadas):
                raise serializers.ValidationError(
                    f"Las horas estimadas ({value}h) no pueden superar las de la actividad ({activity.horas_estimadas}h)."
                )
        return value

    def validate_fecha(self, value):
        if value is None:
            return value
        # Re-validar que la nueva fecha no supere la fecha de entrega de la actividad
        if self.instance:
            activity = self.instance.activity
            if activity.due_date and value > activity.due_date:
                raise serializers.ValidationError(
                    f"La fecha ({value}) no puede ser posterior a la entrega de la actividad ({activity.due_date})."
                )
        return value


# ==============================
# SPRINT 5 — CAMPO estado CALCULADO
# Se agrega via herencia para no tocar TareaHoySerializer ni ActivitySerializer.
#
# Lógica:
#   sin_empezar  → horas_trabajadas = 0
#   en_progreso  → 0 < horas_trabajadas < horas_estimadas
#   completada   → horas_trabajadas >= horas_estimadas (y horas_estimadas > 0)
#   sin_horas    → horas_estimadas = 0 o null (no se puede calcular estado)
# ==============================

class TareaHoyV2Serializer(TareaHoySerializer):
    """
    Extiende TareaHoySerializer agregando:
      - estado:              'sin_empezar' | 'en_progreso' | 'completada' | 'sin_horas'
      - estado_label:        texto legible para mostrar en UI
      - porcentaje_completado: 0-100 (igual que progreso_horas pero como campo directo)
    """
    estado              = serializers.SerializerMethodField()
    estado_label        = serializers.SerializerMethodField()
    porcentaje_completado = serializers.SerializerMethodField()

    class Meta(TareaHoySerializer.Meta):
        fields = TareaHoySerializer.Meta.fields + [
            'estado', 'estado_label', 'porcentaje_completado'
        ]

    def get_estado(self, obj):
        estimadas  = obj.horas_estimadas or 0
        trabajadas = obj.horas_trabajadas or 0

        if estimadas <= 0:
            return 'sin_horas'
        if trabajadas <= 0:
            return 'sin_empezar'
        if trabajadas >= estimadas:
            return 'completada'
        return 'en_progreso'

    def get_estado_label(self, obj):
        labels = {
            'sin_horas':   'Sin horas definidas',
            'sin_empezar': 'Sin empezar',
            'en_progreso': 'En progreso',
            'completada':  'Completada',
        }
        return labels.get(self.get_estado(obj), 'Desconocido')

    def get_porcentaje_completado(self, obj):
        estimadas  = obj.horas_estimadas or 0
        trabajadas = obj.horas_trabajadas or 0
        if estimadas <= 0:
            return 0
        return round(min((trabajadas / estimadas) * 100, 100), 1)


# ==============================
# SPRINT 6 — SubtaskEstadoSerializer
# Serializer dedicado EXCLUSIVAMENTE para PATCH /subtasks/{id}/estado/
# Maneja los campos 'estado' y 'nota' con sus validaciones de negocio.
# NO mezclar con SubtaskSerializer ni SubtaskPatchSerializer.
# ==============================

class SubtaskEstadoSerializer(serializers.ModelSerializer):
    """
    Usado exclusivamente en PATCH /subtasks/{id}/estado/
    Valida:
      - Si estado='pospuesta' y no viene nota → error
      - Si estado='hecha' → nota se limpia a null automáticamente
    """
    estado = serializers.ChoiceField(choices=['hecha', 'pospuesta'], required=True)
    nota   = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model  = Subtask
        fields = ['estado', 'nota']

    def validate(self, attrs):
        estado = attrs.get('estado')
        nota   = attrs.get('nota', None)

        if estado == 'pospuesta':
            # nota debe existir y no estar vacía
            if not nota or not nota.strip():
                raise serializers.ValidationError({
                    'nota': (
                        "Debes indicar un motivo cuando la subtarea se pospone. "
                        "El campo 'nota' es obligatorio para estado 'pospuesta'."
                    )
                })

        if estado == 'hecha':
            # Limpiar nota sin importar lo que venga en el request
            attrs['nota'] = None

        return attrs