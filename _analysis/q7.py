import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== Dock table columns ===")
print([df.fieldname for df in frappe.get_meta("Dock").fields])
try:
    for d in frappe.get_all("Dock", fields=["*"], limit=50):
        print({k: v for k, v in d.items() if v})
except Exception as e:
    print(e)

print("=== Sidebar ===")
try:
    print([df.fieldname for df in frappe.get_meta("Sidebar").fields])
    for s in frappe.get_all("Sidebar", fields=["name", "module"], limit=20):
        print(s)
except Exception as e:
    print(e)

print("=== Sidebar Item sample ===")
try:
    print([df.fieldname for df in frappe.get_meta("Sidebar Item").fields])
    for s in frappe.get_all("Sidebar Item", fields=["label", "link_to", "type", "parent"], limit=60):
        print(s)
except Exception as e:
    print(e)
