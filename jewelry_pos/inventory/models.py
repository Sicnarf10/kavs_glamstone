# inventory/models.py
import os
import uuid
from django.db import models
from django.utils.text import slugify

# Defines a function to generate a unique filename for each uploaded image.
# It uses the item's name and a unique ID to create a descriptive and non-conflicting filename.
def get_image_path(instance, filename):
    ext = filename.split('.')[-1]
    slug = slugify(instance.name)
    unique_id = str(uuid.uuid4()).split('-')[0]
    new_filename = f'{slug}-{unique_id}.{ext}'
    return os.path.join('jewelry_images', new_filename)

# Defines the structure for a single jewelry item in the database.
class JewelryItem(models.Model):
    # Predefined choices for dropdown fields to ensure data consistency.
    CATEGORY_CHOICES = [('Ring', 'Ring'), ('Bangle', 'Bangle'), ('Necklace', 'Necklace'), ('Earring', 'Earring'), ('Pendant', 'Pendant'), ('Bracelet','Bracelet')]
    STYLE_CHOICES = [('Traditional', 'Traditional'), ('Modern', 'Modern'), ('Antique', 'Antique'), ('Korean', 'Korean')]
    MATERIAL_CHOICES = [('Teracota', 'Teracota'), ('Plastic', 'Plastic'), ('Glass', 'Glass')]
    STOCK_STATUS_CHOICES = [('IN_STOCK', 'In Stock'), ('SOLD', 'Sold'), ('RESERVED', 'Reserved')]

    # Database fields (columns) for the JewelryItem table.
    item_id = models.CharField(max_length=100, unique=True, blank=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    style = models.CharField(max_length=100, choices=STYLE_CHOICES)
    material = models.CharField(max_length=100, choices=MATERIAL_CHOICES)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_status = models.CharField(max_length=10, choices=STOCK_STATUS_CHOICES, default='IN_STOCK')
    image = models.ImageField(upload_to=get_image_path, blank=True, null=True)
    added_date = models.DateTimeField(auto_now_add=True)

    # Defines how an item object is represented as a string (e.g., in the Django admin).
    def __str__(self):
        return f"{self.name} ({self.item_id})"
    
    # Overrides the default save method to auto-generate a unique item_id.
    def save(self, *args, **kwargs):
        if not self.item_id:
            prefix = self.category[:2].upper()
            super().save(*args, **kwargs) # Save first to get a database ID.
            self.item_id = f"{prefix}{self.id:05d}"
            super().save(update_fields=['item_id']) # Save again to store the new ID.
        else:
            super().save(*args, **kwargs)

# Defines the structure for a customer.
class Customer(models.Model):
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)

    def __str__(self):
        return self.name

# Defines the structure for a single transaction (a bill).
class Transaction(models.Model):
    PAYMENT_CHOICES = [('CASH', 'Cash'), ('CASHLESS', 'Cashless')]

    bill_number = models.CharField(max_length=100, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions')
    transaction_date = models.DateTimeField(auto_now_add=True)
    sub_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='CASH')

    # Overrides the default save method to auto-generate a unique bill_number.
    def save(self, *args, **kwargs):
        if not self.bill_number:
            last_transaction = Transaction.objects.all().order_by('id').last()
            new_id = (last_transaction.id + 1) if last_transaction else 1
            self.bill_number = f"BILL{new_id:07d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Transaction {self.bill_number} for {self.customer.name}"

# Defines the structure for a single line item within a transaction.
class Sale(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='sales')
    jewelry_item = models.ForeignKey(JewelryItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Sale of {self.jewelry_item.name} in Transaction {self.transaction.id}"