from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# ---------------------------------------------------------
# ROUTE 1:(Showing the Login Screen)
# ---------------------------------------------------------
@app.route('/')
def home():
    # This tells Flask to look inside the 'templates' folder for Akriti's file
    return render_template('login.html') 

# ---------------------------------------------------------
# ROUTE 2: (Processing the Login Form)
# ---------------------------------------------------------
@app.route('/login', methods=['POST'])
def login():
    # 1. Grab the exact text the user typed into Akriti's form
    user_email = request.form.get('email')
    user_password = request.form.get('password')
    
    # 2. ROLE-BASED ACCESS CONTROL (RBAC) LOGIC
    # Since Ananya hasn't built the database yet, we will use hardcoded users for now.
    
    # Check if it is a Manager
    if user_email == "manager@fleetflow.com" and user_password == "admin123":
        # Later, we will redirect them to the Command Center dashboard
        return redirect(url_for('dashboard'))
        
    # Check if it is a Dispatcher
    elif user_email == "dispatch@fleetflow.com" and user_password == "dispatch123":
        # Later, we will redirect them to the Trip Dispatcher page
        return "Success! Welcome Dispatcher. You have access to Trip Management."
        
    # If the email/password doesn't match either of the above
    else:
        return "Error: Wrong email or password! Please go back and try again."
    
@app.route('/dashboard')
def dashboard():
    stats = {
        "total_vehicles": 25,
        "total_drivers": 18,
        "maintenance_alerts": 3
    }
    return render_template('dashboard.html', data=stats)

# ---------------------------------------------------------
# ROUTE 4: VEHICLE REGISTRY (Adding a new vehicle)
# ---------------------------------------------------------
# Notice we added 'GET' here so it can both show the page AND receive the data!
@app.route('/add_vehicle', methods=['GET', 'POST'])
def add_vehicle():
    
    # If the user clicked the "Submit" button on Akriti's form...
    if request.method == 'POST':
        # Grab the details they typed in
        v_name = request.form.get('vehicle_name')
        v_plate = request.form.get('license_plate')
        v_capacity = request.form.get('capacity')
        
        # NOTE: For right now, we will just print it to your VS Code terminal.
        # Once Ananya finishes her code, we will replace this print statement 
        # with her database saving function!
        print(f"SUCCESS: Caught new vehicle! Name: {v_name}, Plate: {v_plate}, Capacity: {v_capacity}")
        
        # Send the user back to the Command Center after adding the vehicle
        return redirect(url_for('dashboard'))
        
    # If the user is just visiting the page for the first time, show Akriti's blank form
    return render_template('add_vehicle.html')

# Start the server
if __name__ == '__main__':
    app.run(debug=True)