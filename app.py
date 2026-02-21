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
        return "Success! Welcome Manager. You have access to the Command Center."
        
    # Check if it is a Dispatcher
    elif user_email == "dispatch@fleetflow.com" and user_password == "dispatch123":
        # Later, we will redirect them to the Trip Dispatcher page
        return "Success! Welcome Dispatcher. You have access to Trip Management."
        
    # If the email/password doesn't match either of the above
    else:
        return "Error: Wrong email or password! Please go back and try again."
# ---------------------------------------------------------
# ROUTE 3: THE COMMAND CENTER (Main Dashboard)
# ---------------------------------------------------------
@app.route('/dashboard')
def dashboard():
    # Right now this is just text, but later Akriti will build a dashboard.html for this!
    return "Welcome to the Command Center Dashboard! Active Fleet: 0"

# Start the server
if __name__ == '__main__':
    app.run(debug=True)