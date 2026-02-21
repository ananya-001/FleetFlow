import sqlite3

# 1. Create / open database file
conn = sqlite3.connect("fleetflow.db")

# 2. Enable foreign keys
conn.execute("PRAGMA foreign_keys = ON;")

# 3. Cursor = tool to run SQL
cur = conn.cursor()

# ---------------- VEHICLES ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL,
    license_plate TEXT UNIQUE NOT NULL,
    max_load_kg INTEGER NOT NULL,
    status TEXT DEFAULT 'available'
);
""")

# ---------------- DRIVERS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS drivers (
    driver_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    license_expiry DATE NOT NULL
);
""")

# ---------------- TRIPS ----------------
cur.execute("""
CREATE TABLE IF NOT EXISTS trips (
    trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL,
    cargo_weight INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
    FOREIGN KEY (driver_id) REFERENCES drivers(driver_id)
);
""")

# 4. Save changes
conn.commit()

# 5. Close database
conn.close()

print("Database created successfully!")