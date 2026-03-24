"""
Migration script: Add Razorpay payment columns to the bookings table.
Safe version that checks column existence before adding.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, DB_NAME
from sqlalchemy import text

def column_exists(conn, table, column):
    result = conn.execute(text(
        f"SELECT COUNT(*) FROM information_schema.COLUMNS "
        f"WHERE TABLE_SCHEMA='{DB_NAME}' AND TABLE_NAME='{table}' AND COLUMN_NAME='{column}'"
    ))
    return result.scalar() > 0

def run_migration():
    columns_to_add = [
        ("payment_status", "ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending'"),
        ("razorpay_order_id", "VARCHAR(255) NULL"),
        ("razorpay_payment_id", "VARCHAR(255) NULL"),
        ("razorpay_signature", "VARCHAR(255) NULL"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_def in columns_to_add:
            if not column_exists(conn, "bookings", col_name):
                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN {col_name} {col_def}"))
                print(f"✅ Added column: {col_name}")
            else:
                print(f"⏭️  Column already exists: {col_name}")
        conn.commit()
    
    print("\n✅ Migration complete! All Razorpay columns are ready.")

if __name__ == "__main__":
    run_migration()
