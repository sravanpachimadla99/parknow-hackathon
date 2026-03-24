import pymysql
import os

# Connect without specifying a database to create it first
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='manager',
    port=3306
)

try:
    with connection.cursor() as cursor:
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS parknow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print("Database 'parknow' checked/created.")
finally:
    connection.close()

# Reconnect to the new database to run the schema
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='manager',
    port=3306,
    database='parknow',
    client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS
)

try:
    with connection.cursor() as cursor:
        with open('backend/config/schema.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        # Split by statements or just execute the whole script if multi_statements is enabled
        cursor.execute(sql_script)
        connection.commit()
        print("Schema loaded successfully!")
finally:
    connection.close()
