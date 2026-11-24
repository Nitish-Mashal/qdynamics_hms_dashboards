import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== Workspaces ===")
for w in frappe.get_all("Workspace", fields=["name", "module", "public", "for_user"], limit=200):
    print(w)

print("=== Pages ===")
for p in frappe.get_all("Page", fields=["name", "title", "module"]):
    print(p)
