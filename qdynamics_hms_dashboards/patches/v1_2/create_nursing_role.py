import frappe


def execute():
	if frappe.db.exists("Role", "Nursing"):
		return

	frappe.get_doc(
		{
			"doctype": "Role",
			"role_name": "Nursing",
			"desk_access": 1,
			"is_custom": 1,
		}
	).insert(ignore_permissions=True)
