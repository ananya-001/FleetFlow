from flask import Flask, render_template, request, redirect, url_for
from db import get_connection  # Your db.py file

app = Flask(__name__)

# ---------------------------------------------------------
# ROUTE 1: SHOW LOGIN SCREEN
# ---------------------------------------------------------
@app.route('/')
def home():
    return render_template('login.html')

# ---------------------------------------------------------
# ROUTE 2: PROCESS LOGIN FORM
# ---------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    user_email = request.form.get('email')
    user_password = request.form.get('password')

    # Connect to the database
    conn = get_connection()
    conn.execute("PRAGMA foreign_keys = ON;")
    cur = conn.cursor()

    # Check if the user exists in a hypothetical 'users' table
    cur.execute("SELECT role FROM users WHERE email=? AND password=?", (user_email, user_password))
    result = cur.fetchone()
    conn.close()

    if result:
        role = result[0]
        if role == "manager":
            return redirect(url_for('dashboard'))
        elif role == "dispatcher":
            return "Success! Welcome Dispatcher. You have access to Trip Management."
    else:
        return "Error: Wrong email or password! Please go back and try again."

# ---------------------------------------------------------
# ROUTE 3: DASHBOARD
# ---------------------------------------------------------
@app.route('/dashboard')
def dashboard():
    conn = get_connection()
    conn.execute("PRAGMA foreign_keys = ON;")
    cur = conn.cursor()

    # Count vehicles, drivers, and maintenance alerts from DB
    cur.execute("SELECT COUNT(*) FROM vehicles")
    total_vehicles = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM drivers")
    total_drivers = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM vehicles WHERE status='maintenance'")
    maintenance_alerts = cur.fetchone()[0]

    conn.close()

    stats = {
        "total_vehicles": total_vehicles,
        "total_drivers": total_drivers,
        "maintenance_alerts": maintenance_alerts
    }

    return render_template('dashboard.html', data=stats)

# ---------------------------------------------------------
# ROUTE 4: ADD VEHICLE
# ---------------------------------------------------------
@app.route('/add_vehicle', methods=['GET', 'POST'])
def add_vehicle():
    if request.method == 'POST':
        v_name = request.form.get('vehicle_name')
        v_plate = request.form.get('license_plate')
        v_capacity = request.form.get('capacity')

        # Insert new vehicle into database
        conn = get_connection()
        conn.execute("PRAGMA foreign_keys = ON;")
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO vehicles (model_name, license_plate, max_load_kg) VALUES (?, ?, ?)",
            (v_name, v_plate, v_capacity)
        )
        conn.commit()
        conn.close()

        return redirect(url_for('dashboard'))

    return render_template('add_vehicle.html')

# ---------------------------------------------------------
# START THE SERVER
# ---------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True)