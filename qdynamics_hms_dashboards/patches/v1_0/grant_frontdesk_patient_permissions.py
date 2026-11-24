import frappe
from frappe import _
from frappe.permissions import add_permission, update_permission_property


def execute():
	if not frappe.db.exists("Role", "Frontdesk"):
		frappe.throw(_("The Frontdesk role must exist before its dashboard permissions can be configured."))

	for doctype in ("Patient Appointment", "Patient"):
		if not frappe.db.exists("Custom DocPerm", {"parent": doctype, "role": "Frontdesk", "permlevel": 0}):
			add_permission(doctype, "Frontdesk", permlevel=0, ptype="read")

		update_permission_property(doctype, "Frontdesk", 0, "read", 1, validate=False)
		update_permission_property(doctype, "Frontdesk", 0, "create", 1, validate=False)

	for doctype in ("Patient Appointment", "Patient"):
		frappe.clear_cache(doctype=doctype)
