
from database import engine, DB_NAME
from sqlalchemy import text

def check_schema():
    with engine.connect() as conn:
        print(f"Checking database: {DB_NAME}")
        result = conn.execute(text("DESCRIBE bookings"))
        columns = [row[0] for row in result]
        print("Columns in 'bookings' table:")
        for col in columns:
            print(f" - {col}")

if __name__ == "__main__":
    check_schema()
