import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== Workspaces by module ===")
for w in frappe.get_all("Workspace", fields=["name", "module"], order_by="module"):
    print(w["module"], "->", w["name"])

print("=== HR doctypes ===")
print("Employee exists:", bool(frappe.db.exists("DocType", "Employee")))

print("=== user perms ===")
import frappe.permissions

for uname in ("demoadmin@demo.local", "nitish@gmail.com"):
    roles = frappe.get_roles(uname)
    print(uname, "roles:", roles)

print("=== notification unread ===")
for uname in ("nitish@gmail.com", "demoadmin@demo.local"):
    print(uname, frappe.db.count("Notification Log", {"read": 0, "for_user": uname}))

print("=== check /desk/hr-setup candidates: sidebar or pages ===")
print(frappe.get_all("Page", filters={"name": ("like", "%hr%")}, pluck="name"))
print(frappe.get_all("Workspace", filters={"name": ("like", "%Resource%")}, pluck="name"))
