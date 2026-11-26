import frappe
from frappe import _
from frappe.query_builder.functions import Count
from frappe.utils import get_datetime, getdate, nowdate


NURSING_ROLES = {"Nursing"}
ACTIVE_INPATIENT_STATUSES = ["Admission Scheduled", "Admitted", "Discharge Scheduled"]
FOLLOW_UP_LAB_STATUSES = ["Draft", "Completed"]


def _require_dashboard_access():
	roles = set(frappe.get_roles())
	if frappe.session.user == "Guest" or not roles.intersection(NURSING_ROLES):
		frappe.throw(_("You do not have permission to access the Nursing Station Dashboard."), frappe.PermissionError)


def _normalize_dates(start_date=None, end_date=None):
	today = getdate(nowdate())

	def parse_date(value):
		if not value:
			return today
		try:
			return getdate(value)
		except (TypeError, ValueError):
			frappe.throw(_("Invalid date: {0}").format(value), frappe.ValidationError)

	start = parse_date(start_date)
	end = parse_date(end_date)
	if start > end:
		frappe.throw(_("Start Date cannot be later than End Date."), frappe.ValidationError)

	return start, end


def _count(doctype, filters):
	if not frappe.has_permission(doctype, "read"):
		return {"value": None, "restricted": True}

	table = frappe.qb.DocType(doctype)
	rows = frappe.qb.get_query(
		doctype,
		fields=[Count(table.name).as_("count")],
		filters=filters,
		ignore_permissions=False,
	).run(as_dict=True)
	return {"value": rows[0].count if rows else 0, "restricted": False}


def _get_rows(doctype, fields, filters, order_by):
	if not frappe.has_permission(doctype, "read"):
		return None

	return frappe.qb.get_query(
		doctype,
		fields=fields,
		filters=filters,
		order_by=order_by,
		limit=8,
		ignore_permissions=False,
	).run(as_dict=True)


@frappe.whitelist()
def get_dashboard(start_date=None, end_date=None):
	_require_dashboard_access()
	start, end = _normalize_dates(start_date, end_date)
	date_filter = ["between", [start, end]]

	ward_filters = {"is_group": 0, "inpatient_occupancy": 1}
	task_filters = {
		"date": date_filter,
		"docstatus": ["<", 2],
		"status": ["not in", ["Cancelled", "Entered in Error"]],
	}
	patient_filters = {
		"creation": [
			"between",
			[get_datetime(f"{start} 00:00:00"), get_datetime(f"{end} 23:59:59")],
		]
	}
	checklist_filters = {"disabled": 0}
	inpatient_filters = {
		"scheduled_date": date_filter,
		"status": ["in", ACTIVE_INPATIENT_STATUSES],
	}
	doctor_order_filters = {
		"encounter_date": date_filter,
		"status": ["not in", ["Cancelled"]],
	}
	lab_report_filters = {
		"date": date_filter,
		"status": ["in", FOLLOW_UP_LAB_STATUSES],
	}

	return {
		"dateRange": {"startDate": start.isoformat(), "endDate": end.isoformat()},
		"kpis": {
			"wards": _count("Healthcare Service Unit", ward_filters),
			"nursingTasks": _count("Nursing Task", task_filters),
			"patients": _count("Patient", patient_filters),
			"checklists": _count("Nursing Checklist Template", checklist_filters),
		},
		"operations": {
			"inpatients": {
				"count": _count("Inpatient Record", inpatient_filters),
				"items": _get_rows(
					"Inpatient Record",
					["name", "patient_name", "status", "scheduled_date", "expected_discharge", "medical_department"],
					inpatient_filters,
					"scheduled_date asc",
				),
			},
			"doctorOrders": {
				"count": _count("Patient Encounter", doctor_order_filters),
				"items": _get_rows(
					"Patient Encounter",
					[
						"name",
						"patient_name",
						"practitioner_name",
						"encounter_date",
						"encounter_time",
						"status",
					],
					doctor_order_filters,
					"encounter_date desc, encounter_time desc",
				),
			},
			"labReports": {
				"count": _count("Lab Test", lab_report_filters),
				"items": _get_rows(
					"Lab Test",
					["name", "patient_name", "lab_test_name", "status", "expected_result_date"],
					lab_report_filters,
					"expected_result_date asc",
				),
			},
		},
	}
