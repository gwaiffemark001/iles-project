from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import (
    WeeklyLogListView,
    WeeklyLogDetailView,
    InternshipPlacementListView,
    InternshipPlacementDetailView,
    UserRegistrationView,
    UserProfileView,
    EvaluationListView,
    SupervisorReviewView,
    SupervisorApproveView,
    ChangePasswordView,
    EvaluationDetailView,
    AvailablePlacementListView,
    PlacementApplicationListCreateView,
    PlacementApplicationDecisionView,
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
    path('api/placements/<int:pk>/', InternshipPlacementDetailView.as_view(), name='placement-detail'),
    path('api/placements/available/', AvailablePlacementListView.as_view(), name='placement-available-list'),

    # Applications
    path('api/applications/', PlacementApplicationListCreateView.as_view(), name='application-list-create'),
    path('api/applications/<int:pk>/decide/', PlacementApplicationDecisionView.as_view(), name='application-decide'),

    # Evaluations
    path('api/evaluations/', EvaluationListView.as_view(), name='evaluation-list'),

    # Supervisor workflow
    path('api/logs/<int:pk>/review/', SupervisorReviewView.as_view(), name='log-review'),
    path('api/logs/<int:pk>/approve/', SupervisorApproveView.as_view(), name='log-approve'),

    # Password
    path('api/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # EvaluationDetailView
    path('api/evaluations/<int:pk>/', EvaluationDetailView.as_view(), name='evaluation-detail'),

]
