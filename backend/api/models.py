from django.db import models
from django.contrib.auth.models import User

from django.utils import timezone

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('INVEST', 'Investment'),
        ('COLLECT', 'Cash Collection'),
        ('WITHDRAW', 'Withdrawal'),
        ('TRANSFER', 'Partner Transfer'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    related_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='related_transfers')
    transfer_direction = models.CharField(max_length=5, choices=(('OUT', 'Out'), ('IN', 'In')), null=True, blank=True)
    transfer_link_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    type = models.CharField(max_length=15, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField()
    date = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"

class Device(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.token[:15]}..."
