from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt
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
    AvailablePlacementListView,
    PlacementApplicationListCreateView,
    PlacementApplicationDecisionView,
    EvaluationCriteriaListView,
    EvaluationCriteriaDetailView,
    LogRevisionView,
    WeeklyLogSubmitView,
    AdminStatisticsView,
    UserSummaryView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ChatContactsView,
    ChatMessagesView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication — csrf_exempt for JWT API (no session auth needed)
    path('api/token/', csrf_exempt(TokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('api/token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
    path('api/register/', csrf_exempt(UserRegistrationView.as_view()), name='register'),
    path('api/forgot-password/', csrf_exempt(PasswordResetRequestView.as_view()), name='forgot-password'),
    path('api/forgot-password-confirm/', csrf_exempt(PasswordResetConfirmView.as_view()), name='forgot-password-confirm'),
    path('api/profile/', UserProfileView.as_view(), name='profile'),
    path('api/users/', UserListView.as_view(), name='user-list'),
    path('api/users/<int:pk>/', UserListView.as_view(), name='user-detail'),
    path('api/notifications/', NotificationListView.as_view(), name='notification-list'),
    path('api/notifications/<int:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
    path('api/notifications/mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),

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
    path('api/evaluations/<int:pk>/', EvaluationDetailView.as_view(), name='evaluation-detail'),

    # Supervisor workflow
    path('api/logs/<int:pk>/review/', SupervisorReviewView.as_view(), name='log-review'),
    path('api/logs/<int:pk>/approve/', SupervisorApproveView.as_view(), name='log-approve'),

    # Password
    path('api/change-password/', ChangePasswordView.as_view(), name='change-password'),

    # EvaluationCriteria
    path('api/criteria/', EvaluationCriteriaListView.as_view(), name='criteria-list'),
    path('api/criteria/<int:pk>/', EvaluationCriteriaDetailView.as_view(), name='criteria-detail'),

    # Log Revision
    path('api/logs/<int:pk>/revise/', LogRevisionView.as_view(), name='log-revise'),

    # Weekly Log Submission
    path('api/logs/<int:pk>/submit/', WeeklyLogSubmitView.as_view(), name='log-submit'),

    # Admin Statistics
    path('api/admin/statistics/', AdminStatisticsView.as_view(), name='admin-statistics'),

    # User Summary
    path('api/users/<int:pk>/summary/', UserSummaryView.as_view()),

    # Chat
    path('api/chat/contacts/', ChatContactsView.as_view(), name='chat-contacts'),
    path('api/chat/messages/<int:recipient_id>/', ChatMessagesView.as_view(), name='chat-messages'),
]

# Serve media files (both development and production)
# Critical for avatar/profile images to load properly
# WhiteNoise middleware efficiently caches and compresses in production
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)