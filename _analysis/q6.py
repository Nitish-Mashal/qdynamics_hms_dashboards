import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== doctypes like hr/employee ===")
for dt in frappe.get_all("DocType", filters={"name": ("like", "%Employee%")}, pluck="name"):
    print(dt)

print("=== workspace sidebar items containing HR ===")
try:
    for s in frappe.get_all("Workspace Sidebar Item", filters={"label": ("like", "%HR%")}, fields=["label", "link_to", "type"]):
        print(s)
except Exception as e:
    print(e)

print("=== dock ===")
try:
    for d in frappe.get_all("Dock Item", fields=["label", "link_to", "type"], limit=100):
        print(d)
except Exception as e:
    print("dock err", e)

print("=== verify quick action targets ===")
for route in ["hr-setup", "patient", "user", "sales-invoice"]:
    page = frappe.db.exists("Page", route)
    ws = frappe.db.exists("Workspace", route)
    dt = frappe.db.exists("DocType", frappe.unscrub(route)) or frappe.db.exists(
        "DocType", route.replace("-", " ").title()
    )
    print(route, "page:", page, "workspace:", ws, "doctype:", dt)

print("=== slug of Employee/User/Patient ===")
for dt in ["Employee", "User", "Patient", "Sales Invoice"]:
    print(dt, frappe.utils.slug(dt))
