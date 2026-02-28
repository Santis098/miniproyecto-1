from django.contrib import admin

# Register your models here.


from .models import Usuario

admin.site.register(Usuario)



from .models import Asignatura

admin.site.register(Asignatura)