# Create your models here.
# inventory/models.py
from django.db import models
import uuid
import os
from django.utils.text import slugify

# --- ADD THIS FUNCTION ANYWHERE BEFORE THE JewelryItem MODEL ---
# This function will create a unique path and filename for each uploaded image
# def get_unique_image_path(instance, filename):
#     ext = filename.split('.')[-1]
#     # Create a new filename using a unique ID
#     unique_filename = f'{uuid.uuid4()}.{ext}'
#     # Return the path where the file will be stored
#     return os.path.join('jewelry_images', unique_filename)

def get_image_path(instance, filename):
    ext = filename.split('.')[-1]
    # Create a "URL-safe" version of the item name
    slug = slugify(instance.name)
    # Combine the slug with a unique ID to prevent files with the same name from overwriting each other
    unique_id = str(uuid.uuid4()).split('-')[0] # Use a short UUID
    new_filename = f'{slug}-{unique_id}.{ext}'
    return os.path.join('jewelry_images', new_filename)



class JewelryItem(models.Model):
    # --- PREDEFINED CHOICES ---
    CATEGORY_CHOICES = [
        ('Ring', 'Ring'),
        ('Bangle', 'Bangle'),
        ('Necklace', 'Necklace'),
        ('Earring', 'Earring'),
        ('Pendant', 'Pendant'),
        ('Bracelet','Bracelet'),
    ]
    STYLE_CHOICES = [
        ('Traditional', 'Traditional'),
        ('Modern', 'Modern'),
        ('Antique', 'Antique'),
        ('Korean', 'Korean'),
    ]
    MATERIAL_CHOICES = [
        ('Teracota', 'Teracota'),
        ('Plastic', 'Plastic'),
        ('Glass', 'Glass'),
    ]
    STOCK_STATUS_CHOICES = [
        ('IN_STOCK', 'In Stock'),
        ('SOLD', 'Sold'),
        ('RESERVED', 'Reserved'),
    ]

    # --- MODEL FIELDS ---
    # We will now auto-generate this, so it can be blank initially
    item_id = models.CharField(max_length=100, unique=True, blank=True) 
    name = models.CharField(max_length=255)
    # Updated fields to use choices
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    style = models.CharField(max_length=100, choices=STYLE_CHOICES)
    material = models.CharField(max_length=100, choices=MATERIAL_CHOICES)
    
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_status = models.CharField(max_length=10, choices=STOCK_STATUS_CHOICES, default='IN_STOCK')
    # image = models.ImageField(upload_to='jewelry_images/', blank=True, null=True)
    # image = models.ImageField(upload_to=get_unique_image_path, blank=True, null=True)
    image = models.ImageField(upload_to=get_image_path, blank=True, null=True)
    added_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.item_id})"
    
    # We add a save method to auto-generate the item_id
    def save(self, *args, **kwargs):
        if not self.item_id:
            # Generate ID based on the first two letter of the category + the database ID
            # e.g., Ring with id 1 becomes RI00001
            prefix = self.category[:2].upper()
            super().save(*args, **kwargs) # Save first to get a database ID
            self.item_id = f"{prefix}{self.id:05d}"
            # We call save again, but only updating the item_id field to avoid recursion
            super().save(update_fields=['item_id']) 
        else:
            super().save(*args, **kwargs)



class Customer(models.Model):
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)

    def __str__(self):
        return self.name

class Transaction(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions')
    transaction_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Transaction {self.id} for {self.customer.name}"

class Sale(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='sales')
    jewelry_item = models.ForeignKey(JewelryItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1) # Usually 1 for unique jewelry
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Sale of {self.jewelry_item.name} in Transaction {self.transaction.id}"
