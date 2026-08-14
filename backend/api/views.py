from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import Transaction
from datetime import timedelta
from django.utils import timezone

@api_view(['POST'])
def signup_view(request):
    username = request.data.get('username')
    email = request.data.get('email', '')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = authenticate(username=username, password=password)
    
    if user is not None:
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # Delete token from database
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_view(request):
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email
        }
    }, status=status.HTTP_200_OK)

# ================= TRANSACTION ENDPOINTS =================

@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def transaction_list_create_view(request):
    if request.method == 'GET':
        user_id = request.query_params.get('user_id')
        queryset = Transaction.objects.all()
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        queryset = queryset.order_by('-date')
        
        txs = []
        for t in queryset:
            txs.append({
                'id': t.id,
                'user_id': t.user.id,
                'username': t.user.username,
                'type': t.type,
                'amount': float(t.amount),
                'notes': t.notes,
                'date': t.date.isoformat()
            })
        return Response({'transactions': txs}, status=status.HTTP_200_OK)
        
    elif request.method == 'POST':
        tx_type = request.data.get('type') # 'INVEST' or 'COLLECT'
        amount = request.data.get('amount')
        notes = request.data.get('notes')
        
        if tx_type not in ['INVEST', 'COLLECT']:
            return Response({'error': 'Invalid transaction type'}, status=status.HTTP_400_BAD_REQUEST)
        if not amount or float(amount) <= 0:
            return Response({'error': 'Valid positive amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not notes or notes.strip() == '':
            return Response({'error': 'Notes are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            t = Transaction.objects.create(
                user=request.user,
                type=tx_type,
                amount=amount,
                notes=notes.strip()
            )
            return Response({
                'message': 'Transaction logged successfully',
                'transaction': {
                    'id': t.id,
                    'user_id': t.user.id,
                    'username': t.user.username,
                    'type': t.type,
                    'amount': float(t.amount),
                    'notes': t.notes,
                    'date': t.date.isoformat()
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def transaction_detail_view(request, pk):
    try:
        t = Transaction.objects.get(pk=pk)
    except Transaction.DoesNotExist:
        return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
        
    # Security: Only owner can edit/delete their own transaction
    if t.user != request.user:
        return Response({'error': 'You do not have permission to modify this transaction'}, status=status.HTTP_403_FORBIDDEN)
        
    if request.method == 'PUT':
        tx_type = request.data.get('type')
        amount = request.data.get('amount')
        notes = request.data.get('notes')
        
        if tx_type not in ['INVEST', 'COLLECT']:
            return Response({'error': 'Invalid transaction type'}, status=status.HTTP_400_BAD_REQUEST)
        if not amount or float(amount) <= 0:
            return Response({'error': 'Valid positive amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not notes or notes.strip() == '':
            return Response({'error': 'Notes are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            t.type = tx_type
            t.amount = amount
            t.notes = notes.strip()
            t.save()
            return Response({'message': 'Transaction updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    elif request.method == 'DELETE':
        try:
            t.delete()
            return Response({'message': 'Transaction deleted successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ================= DASHBOARD SUMMARY ENDPOINT =================

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_summary_view(request):
    try:
        users = User.objects.all()
        user_summaries = []
        
        for u in users:
            # Calculate invest and collect totals
            invests = Transaction.objects.filter(user=u, type='INVEST')
            collects = Transaction.objects.filter(user=u, type='COLLECT')
            
            total_invest = sum(float(tx.amount) for tx in invests)
            total_collect = sum(float(tx.amount) for tx in collects)
            balance = total_invest - total_collect
            
            user_summaries.append({
                'user_id': u.id,
                'username': u.username,
                'total_invest': total_invest,
                'total_collect': total_collect,
                'balance': balance
            })
            
        # Daily trends grouping (last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        tx_queryset = Transaction.objects.filter(date__gte=thirty_days_ago).order_by('date')
        
        daily_trends = {}
        for tx in tx_queryset:
            # Group by local/UTC date string (YYYY-MM-DD)
            date_str = tx.date.strftime('%Y-%m-%d')
            if date_str not in daily_trends:
                daily_trends[date_str] = {'date': date_str, 'invest': 0.0, 'collect': 0.0}
            
            if tx.type == 'INVEST':
                daily_trends[date_str]['invest'] += float(tx.amount)
            elif tx.type == 'COLLECT':
                daily_trends[date_str]['collect'] += float(tx.amount)
                
        trends_list = sorted(daily_trends.values(), key=lambda x: x['date'])
        
        return Response({
            'users': user_summaries,
            'trends': trends_list
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
