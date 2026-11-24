import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== HR related workspaces ===")
for w in frappe.get_all("Workspace", filters={"name": ("like", "%Human%")}, fields=["name"]):
    print(w)
for w in frappe.get_all("Workspace", filters={"name": ("like", "%HR%")}, fields=["name"]):
    print(w)

print("=== routes for pages/workspaces starting hr ===")
print("hr-setup page exists:", frappe.db.exists("Page", "hr-setup"))
print("hr-setup workspace exists:", frappe.db.exists("Workspace", "HR Setup"))

print("=== check doctype routes ===")
for dt in ["Patient", "User", "Sales Invoice", "Patient Appointment", "Inpatient Record", "Lab Test", "Healthcare Service Unit", "Employee"]:
    print(dt, "->", frappe.utils.slug(dt))

print("=== can_search / search doctypes for demo admin ===")
user = frappe.get_user("demoadmin@demo.local")
user.build_permissions()
print("can_read count:", len(user.can_read))
print("Employee in can_read:", "Employee" in user.can_read)
print("User in can_read:", "User" in user.can_read)

print("=== notification unread for nitish ===")
print(frappe.db.count("Notification Log", {"read": 0, "for_user": "nitish@gmail.com"}))
print(frappe.db.count("Notification Log", {"read": 0, "for_user": "demoadmin@demo.local"}))

print("=== docstatus field check ===")
meta = frappe.get_meta("Sales Invoice")
print("has docstatus in fields:", any(f.fieldname == "docstatus" for f in meta.fields))
print("default_fields:", getattr(meta, "default_fields", None))
