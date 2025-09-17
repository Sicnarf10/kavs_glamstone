# inventory/serializers.py
from rest_framework import serializers
from .models import JewelryItem, Customer, Transaction, Sale

class JewelryItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = JewelryItem
        fields = '__all__' # This means we want to include all fields from our model

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = ['jewelry_item', 'quantity', 'price_at_sale']

# class TransactionSerializer(serializers.ModelSerializer):
#     sales = SaleSerializer(many=True, write_only=True)

#     class Meta:
#         model = Transaction
#         fields = ['id', 'customer', 'transaction_date', 'total_amount', 'sales']

#     def create(self, validated_data):
#         sales_data = validated_data.pop('sales')
#         transaction = Transaction.objects.create(**validated_data)
#         total_amount = 0

#         for sale_data in sales_data:
#             # Mark the jewelry item as SOLD
#             item = sale_data['jewelry_item']
#             item.stock_status = 'SOLD'
#             item.save()

#             # Create the sale record
#             Sale.objects.create(transaction=transaction, **sale_data)
#             total_amount += sale_data['price_at_sale']

#         # Update transaction total
#         transaction.total_amount = total_amount
#         transaction.save()
#         return transaction

class TransactionSerializer(serializers.ModelSerializer):
    sales = SaleSerializer(many=True, write_only=True)
    # We'll accept customer details directly instead of just an ID
    customer_name = serializers.CharField(write_only=True)
    customer_phone = serializers.CharField(write_only=True)

    class Meta:
        model = Transaction
        # We don't need 'customer' here anymore since we handle it manually
        fields = ['id', 'transaction_date', 'total_amount', 'sales', 'customer_name', 'customer_phone']
        read_only_fields = ['total_amount', 'transaction_date', 'id'] # Fields calculated on the server

    def create(self, validated_data):
        # Pop the custom fields we added
        customer_name = validated_data.pop('customer_name')
        customer_phone = validated_data.pop('customer_phone')
        sales_data = validated_data.pop('sales')

        # --- This is the key logic: Get an existing customer or create a new one ---
        customer, created = Customer.objects.get_or_create(
            phone_number=customer_phone,
            defaults={'name': customer_name}
        )

        # Create the transaction linked to the found or new customer
        transaction = Transaction.objects.create(customer=customer, **validated_data)
        
        total_amount = 0
        for sale_data in sales_data:
            item = sale_data['jewelry_item']
            item.stock_status = 'SOLD'
            item.save()
            
            Sale.objects.create(transaction=transaction, **sale_data)
            total_amount += sale_data['price_at_sale']

        transaction.total_amount = total_amount
        transaction.save()
        return transaction