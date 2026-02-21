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
