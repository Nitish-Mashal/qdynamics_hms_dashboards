import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

roles = frappe.get_all("Role", pluck="name")
print("ROLES:", sorted(roles))
print("HSU count:", frappe.db.count("Healthcare Service Unit"))
print("HSU inpatient_occupancy=1:", frappe.db.count("Healthcare Service Unit", {"inpatient_occupancy": 1}))
print("HSU occupancy_status Occupied:", frappe.db.count("Healthcare Service Unit", {"occupancy_status": "Occupied"}))
print("HSU is_group=1:", frappe.db.count("Healthcare Service Unit", {"is_group": 1}))
print("Patients:", frappe.db.count("Patient"))
print("Appointments:", frappe.db.count("Patient Appointment"))
print("Lab Tests:", frappe.db.count("Lab Test"))
print("Inpatient Records:", frappe.db.count("Inpatient Record"))
print("Sales Invoices:", frappe.db.count("Sales Invoice"))
print("--- service units ---")
for d in frappe.get_all(
    "Healthcare Service Unit",
    fields=[
        "name",
        "healthcare_service_unit_name",
        "is_group",
        "inpatient_occupancy",
        "occupancy_status",
        "service_unit_type",
        "service_unit_capacity",
        "parent_healthcare_service_unit",
    ],
    limit=40,
):
    print(d)
print("--- users/roles ---")
for d in frappe.get_all(
    "Has Role",
    filters={"parenttype": "User", "parent": ("not in", ("Guest", "Administrator"))},
    fields=["parent as user", "role"],
    limit=200,
):
    print(d)
