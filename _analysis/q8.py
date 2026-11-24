import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== sidebar parents ===")
print(sorted(set(frappe.get_all("Sidebar Item", pluck="parent"))))

print("=== sidebar items label like Human/HR/Employee ===")
for s in frappe.get_all(
    "Sidebar Item",
    filters={"label": ("in", ["Human Resources", "HR", "Employee", "Department", "Designation"])},
    fields=["label", "link_to", "type", "parent"],
):
    print(s)

print("=== check routes that exist for quick actions ===")
# Page-based routes
for name in ["patient", "user", "sales-invoice", "employee", "hr-setup"]:
    # page?
    page = frappe.db.exists("Page", name)
    # workspace slug?
    ws = frappe.get_all("Workspace", filters={"name": ("like", f"%{name}%")}, pluck="name")
    print(name, "page:", page, "ws-like:", ws)
