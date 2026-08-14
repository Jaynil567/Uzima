from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('user/', views.user_view, name='user'),
    path('transactions/', views.transaction_list_create_view, name='transactions_list_create'),
    path('transactions/<int:pk>/', views.transaction_detail_view, name='transaction_detail'),
    path('dashboard/', views.dashboard_summary_view, name='dashboard_summary'),
]
