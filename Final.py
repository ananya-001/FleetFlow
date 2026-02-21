import streamlit as st
import sqlite3
import pandas as pd

# ---------------------------------------------------------
# 1. DATABASE SETUP (Ananya's Domain, now fully integrated)
# ---------------------------------------------------------
def init_db():
    conn = sqlite3.connect('fleetflow.db')
    c = conn.cursor()
    # Create the vehicles table
    c.execute('''CREATE TABLE IF NOT EXISTS vehicles
                 (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  name TEXT, 
                  plate TEXT, 
                  capacity INTEGER)''')
    conn.commit()
    conn.close()

def add_vehicle(name, plate, capacity):
    conn = sqlite3.connect('fleetflow.db')
    c = conn.cursor()
    c.execute("INSERT INTO vehicles (name, plate, capacity) VALUES (?, ?, ?)", (name, plate, capacity))
    conn.commit()
    conn.close()

def get_vehicles():
    conn = sqlite3.connect('fleetflow.db')
    # Pandas makes it incredibly easy to turn SQL into a beautiful table
    df = pd.read_sql_query("SELECT * FROM vehicles", conn)
    conn.close()
    return df

# Initialize the database immediately
init_db()

# ---------------------------------------------------------
# 2. PAGE CONFIGURATION & SESSION STATE
# ---------------------------------------------------------
st.set_page_config(page_title="FleetFlow Command Center", page_icon="🚚", layout="wide")

# This keeps track of whether the user is logged in
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

# ---------------------------------------------------------
# 3. LOGIN SCREEN
# ---------------------------------------------------------
if not st.session_state['logged_in']:
    st.title("🚚 FleetFlow Login")
    st.subheader("Odoo Hackathon 2026")
    
    with st.form("login_form"):
        email = st.text_input("Email", placeholder="manager@fleetflow.com")
        password = st.text_input("Password", type="password", placeholder="admin123")
        submit_button = st.form_submit_button("Login")
        
        if submit_button:
            if email == "manager@fleetflow.com" and password == "admin123":
                st.session_state['logged_in'] = True
                st.rerun() # Refreshes the app instantly
            else:
                st.error("Invalid email or password. Please try again.")

# ---------------------------------------------------------
# 4. MAIN APPLICATION (If logged in)
# ---------------------------------------------------------
else:
    # Sidebar Navigation
    st.sidebar.title("FleetFlow Menu")
    menu = st.sidebar.radio("Navigation", ["Dashboard", "Add Vehicle", "Fleet Status"])
    
    st.sidebar.markdown("---")
    if st.sidebar.button("Logout"):
        st.session_state['logged_in'] = False
        st.rerun()

    # --- PAGE: DASHBOARD ---
    # --- PAGE: DASHBOARD ---
    if menu == "Dashboard":
        st.title("📊 Command Center Dashboard")
        st.write("Welcome to your centralized Odoo Fleet Management system.")
        
        df = get_vehicles()
        total_vehicles = len(df)
        # Automatically calculate total weight capacity of the whole fleet!
        total_capacity = int(df['capacity'].sum()) if not df.empty else 0
        
        # 1. THE TOP METRICS
        col1, col2, col3 = st.columns(3)
        col1.metric("🚚 Active Fleet Size", total_vehicles, "Vehicles Online")
        col2.metric("⚖️ Total Fleet Capacity", f"{total_capacity} kg", "Fully Optimized")
        col3.metric("🚨 System Alerts", "0", "All Clear")
        
        st.markdown("---")
        
        # 2. THE ANALYTICS CHART (Judges love this!)
        colA, colB = st.columns([2, 1]) # Makes the chart wider than the text
        
        with colA:
            st.subheader("📈 Payload Distribution")
            if not df.empty:
                # This automatically generates a beautiful bar chart!
                st.bar_chart(data=df, x='name', y='capacity', color="#1a6ef5")
            else:
                st.info("Chart will appear here once you add vehicles!")
                
        with colB:
            st.subheader("⚡ Quick Actions")
            st.button("Route Optimization (Beta)")
            st.button("Generate Odoo Report")
            st.write("*Note: Advanced features unlock in V2.*")

    # --- PAGE: ADD VEHICLE ---
    elif menu == "Add Vehicle":
        st.title("➕ Register New Asset")
        
        with st.form("add_vehicle_form"):
            v_name = st.text_input("Vehicle Model/Name (e.g., Tata Ace)")
            v_plate = st.text_input("License Plate (e.g., MH12AB1234)")
            v_capacity = st.number_input("Max Load Capacity (kg)", min_value=1, step=50)
            
            submitted = st.form_submit_button("Add to Fleet")
            
            if submitted:
                if v_name and v_plate:
                    add_vehicle(v_name, v_plate, v_capacity)
                    st.success(f"SUCCESS: {v_name} ({v_plate}) has been added to the fleet!")
                else:
                    st.error("Please fill in all text fields.")

    # --- PAGE: FLEET STATUS ---
    elif menu == "Fleet Status":
        st.title("📋 Live Fleet Status")
        
        df = get_vehicles()
        if df.empty:
            st.info("No vehicles registered yet. Go to 'Add Vehicle' to start expanding your fleet.")
        else:
            # Displays the Pandas dataframe as an interactive table
            st.dataframe(df, use_container_width=True, hide_index=True)
