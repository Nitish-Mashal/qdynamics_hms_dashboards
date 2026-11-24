import os

os.environ["FRAPPE_BENCH_ROOT"] = "/home/qb-nitish/demo-healthcare/frappe-bench"

import frappe

SITES = "/home/qb-nitish/demo-healthcare/frappe-bench/sites"
os.chdir(SITES)
frappe.init(site="demohealth.local", sites_path=SITES)
frappe.connect()

print("=== Global Search Settings ===")
try:
    doc = frappe.get_doc("Global Search Settings")
    for r in doc.allowed_in_global_search:
        print(r.document_type)
except Exception as e:
    print("err", e)

print("=== Page docs ===")
for p in frappe.get_all("Page", fields=["name", "module", "standard", "title"]):
    print(p)

print("=== Sales Invoice fields of interest ===")
meta = frappe.get_meta("Sales Invoice")
for f in ["docstatus", "status", "due_date", "posting_date", "outstanding_amount", "is_return", "company"]:
    df = meta.get_field(f)
    print(f, "->", "EXISTS" if df else "MISSING")

print("=== Patient creation field ===")
meta = frappe.get_meta("Patient")
print("creation is standard")
print("title_field:", meta.title_field)

print("=== User display ===")
for u in frappe.get_all("User", fields=["name", "full_name", "enabled"], limit=20):
    print(u)

print("=== Companies ===")
print(frappe.get_all("Company", pluck="name"))

print("=== Lab Test statuses in DB ===")
print(frappe.db.sql("select status, count(*) from `tabLab Test` group by status"))
print("=== Appointment statuses ===")
print(frappe.db.sql("select status, count(*) from `tabPatient Appointment` group by status"))
print("=== Inpatient statuses ===")
print(frappe.db.sql("select status, count(*) from `tabInpatient Record` group by status"))
