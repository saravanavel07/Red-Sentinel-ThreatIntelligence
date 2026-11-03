"""
RedSentinel Django Main URL Configuration
"""
try:
    from django.contrib import admin
    from django.urls import path, include
    from django.http import JsonResponse

    def api_root(request):
        return JsonResponse({
            'platform': 'RedSentinel Cloud + AI Threat Detection and Intelligence Platform',
            'version': '1.0.0',
            'endpoints': {
                'events': '/api/v1/events/',
                'alerts': '/api/v1/alerts/',
                'incidents': '/api/v1/incidents/',
                'rules': '/api/v1/rules/',
                'triage': '/api/v1/triage/',
            }
        })

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('api/v1/', api_root),
    ]
except ImportError:
    urlpatterns = []
