from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import WeeklyLogListView, WeeklyLogDetailView, InternshipPlacementListView

urlpatterns =[
    path('admin/',  admin.site.urls),
    #JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    #Weekly Log endpoints
    path('api/logs/', WeeklyLogListView.as_view(), name='weekly-log-list'),
    path('api/logs/<int:pk>/', WeeklyLogDetailView.as_view(), name='weekly-log-detail'),

    path('api/placements/', InternshipPlacementListView.as_view(), name='placement-list'),
]
