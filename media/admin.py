from django.utils.html import format_html
from django.contrib import admin
from .models import Media, Comment, File


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'file_count', 'created_at', 'updated_at', 'thumbnail')
    search_fields = ('title', 'description')
    list_filter = ('created_at', 'user')
    readonly_fields = ('files_list',)

    def file_count(self, obj):
        return obj.files.count()

    file_count.short_description = 'Number of Files'

    def files_list(self, obj):
        files = obj.files.all()
        images = [file for file in files if
                  not file.file.name.lower().endswith(('.mp4', '.avi', '.wmv'))]
        return format_html(
            ''.join([f'<img src="{image.file.url}" style="height: 50px; display: block;" />' for image in images]))

    files_list.short_description = 'Files'

    def thumbnail(self, obj):
        files = obj.files.all()
        images = [file for file in files if
                  not file.file.name.lower().endswith(('.mp4', '.avi', '.wmv'))]
        if images:
            return format_html('<img src="{}" style="height: 50px;"/>',
                               images[0].file.url)
        return "-"

    thumbnail.short_description = 'Thumbnail'

    def get_readonly_fields(self, request, obj=None):
        if obj:  # When editing
            return self.readonly_fields + ('file_count', 'files_list',)
        return self.readonly_fields


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('text', 'user', 'media', 'created_at')
    search_fields = ('text', 'user__username', 'media__title')
    list_filter = ('created_at', 'user')


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ('file', 'updated_at',)
    search_fields = ('file',)
