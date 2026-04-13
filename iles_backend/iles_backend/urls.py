from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import (
    WeeklyLogListView,
    WeeklyLogDetailView,
    InternshipPlacementListView,
    UserRegistrationView,
    EvaluationListView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', UserRegistrationView.as_view(), name='register'),
    path('api/profile/', UserProfileView.as_view(), name='profile'),

    # Weekly Logs
    path('api/logs/', WeeklyLogListView.as_view(), name='weekly-log-list'),
    path('api/logs/<int:pk>/', WeeklyLogDetailView.as_view(), name='weekly-log-detail'),

    # Placements
    path('api/placements/', InternshipPlacementListView.as_view(), name='placement-list'),

    # Evaluations
    path('api/evaluations/', EvaluationListView.as_view(), name='evaluation-list'),
]
