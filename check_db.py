import sqlite3
conn = sqlite3.connect('backend/dayflow.db')
cursor = conn.cursor()
cursor.execute('SELECT email, password_hash FROM users')
print(cursor.fetchall())
