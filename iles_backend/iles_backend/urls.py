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
    UserListView,
    NotificationListView,
    NotificationReadView,
    NotificationMarkAllReadView,
    EvaluationListView,
    SupervisorReviewView,
    SupervisorApproveView,
    ChangePasswordView,
    EvaluationDetailView,
    EvaluationCriteriaListView, 
    LogRevisionView, 
    WeeklyLogSubmitView,
    AdminStatisticsView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', UserRegistrationView.as_view(), name='register'),
    path('api/profile/', UserProfileView.as_view(), name='profile'),
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/notifications/', NotificationListView.as_view(), name='notification-list'),
    path('api/notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
    path('api/notifications/mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),

    # Weekly Logs
    path('api/logs/', WeeklyLogListView.as_view(), name='weekly-log-list'),
    path('api/logs/<int:pk>/', WeeklyLogDetailView.as_view(), name='weekly-log-detail'),

    # Placements
    path('api/placements/', InternshipPlacementListView.as_view(), name='placement-list'),
    path('api/placements/<int:pk>/', InternshipPlacementDetailView.as_view(), name='placement-detail'),

    # Evaluations
    path('api/evaluations/', EvaluationListView.as_view(), name='evaluation-list'),

    # Supervisor workflow
    path('api/logs/<int:pk>/review/', SupervisorReviewView.as_view(), name='log-review'),
    path('api/logs/<int:pk>/approve/', SupervisorApproveView.as_view(), name='log-approve'),

    # Password
    path('api/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # EvaluationDetailView
    path('api/evaluations/<int:pk>/', EvaluationDetailView.as_view(), name='evaluation-detail'),

    # EvaluationCriteria
    path('api/criteria/', EvaluationCriteriaListView.as_view(), name='criteria-list'),

    # Log Revison
    path('api/logs/<int:pk>/revise/', LogRevisionView.as_view(), name='log-revise'),

    # Weekly Log Submission
    path('api/logs/<int:pk>/submit/', WeeklyLogSubmitView.as_view(), name='log-submit'),

    # Admin Statistics
    path('api/admin/statistics/', AdminStatisticsView.as_view(), name='admin-statistics'),

]
