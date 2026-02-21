import sqlite3

conn = sqlite3.connect("fleetflow.db")
cur = conn.cursor()

cur.execute("""
INSERT INTO vehicles (model_name, license_plate, max_load_kg)
VALUES ('Van-05', 'MH12AB1234', 500);
""")

cur.execute("""
INSERT INTO drivers (name, license_number, license_expiry)
VALUES ('Alex', 'DL1234567', '2026-12-31');
""")

cur.execute("""
INSERT INTO trips (vehicle_id, driver_id, cargo_weight, status)
VALUES (1, 1, 450, 'dispatched');
""")

conn.commit()
conn.close()

print("Data inserted!")