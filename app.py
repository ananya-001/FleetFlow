from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# ---------------------------------------------------------
# ROUTE 1: Show Login Page
# ---------------------------------------------------------
@app.route('/')
def home():
    return render_template('login.html')  # Make sure this file is inside templates/

# ---------------------------------------------------------
# ROUTE 2: Process Login Form
# ---------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    user_email = request.form.get('email')
    user_password = request.form.get('password')

    # Hardcoded users (demo)
    if user_email == "manager@fleetflow.com" and user_password == "admin123":
        return redirect(url_for('dashboard'))

    elif user_email == "dispatch@fleetflow.com" and user_password == "dispatch123":
        # Redirect dispatcher to a page later; for now just show a message
        return "Success! Welcome Dispatcher. You have access to Trip Management."

    else:
        return "Error: Wrong email or password! Please go back and try again."

# ---------------------------------------------------------
# ROUTE 3: Dashboard Page
# ---------------------------------------------------------
@app.route('/dashboard')
def dashboard():
    stats = {
        "total_vehicles": 25,
        "total_drivers": 18,
        "maintenance_alerts": 3
    }
    return render_template('dashboard.html', data=stats)

# ---------------------------------------------------------
# ROUTE 4: Add Vehicle Page
# ---------------------------------------------------------
@app.route('/add_vehicle', methods=['GET', 'POST'])
def add_vehicle():
    if request.method == 'POST':
        v_name = request.form.get('vehicle_name')
        v_plate = request.form.get('license_plate')
        v_capacity = request.form.get('capacity')

        # Temporary: just print to terminal
        print(f"SUCCESS: Caught new vehicle! Name: {v_name}, Plate: {v_plate}, Capacity: {v_capacity}")

        # Redirect back to dashboard after submission
        return redirect(url_for('dashboard'))

    # GET request: show the add vehicle form
    return render_template('add_vehicle.html')

# ---------------------------------------------------------
# Run the Flask App
# ---------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True)