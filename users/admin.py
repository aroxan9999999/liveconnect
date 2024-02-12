from django.contrib import admin
from django.utils.html import format_html
from .models import SocialLiveUser


class SocialLiveUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'last_name', 'birth_date', 'phone', 'get_picture')
    search_fields = ('username', 'email', 'last_name')
    readonly_fields = ('id', 'get_picture')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'last_name', 'birth_date', 'phone', 'picture')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'last_name', 'birth_date', 'phone', 'password1', 'password2'),
        }),
    )
    filter_horizontal = ('groups', 'user_permissions')

    def get_picture(self, obj):
        if obj.picture:
            return format_html('<img src="{}" style="border-radius: 50%; width: 50px; height: 50px;"/>',
                               obj.picture.url)
        return "-"

    get_picture.short_description = 'Picture'


admin.site.register(SocialLiveUser, SocialLiveUserAdmin)
