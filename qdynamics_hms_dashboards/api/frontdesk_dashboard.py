import frappe
from frappe import _
from frappe.query_builder.functions import Count
from frappe.utils import get_datetime, getdate, nowdate


FRONTDESK_ROLES = {"Frontdesk", "Healthcare Administrator", "System Manager"}
ACTIVE_INPATIENT_STATUSES = ["Admission Scheduled", "Admitted", "Discharge Scheduled"]
FOLLOW_UP_LAB_STATUSES = ["Draft", "Completed"]


def _require_dashboard_access():
	roles = set(frappe.get_roles())
	if frappe.session.user == "Guest" or not roles.intersection(FRONTDESK_ROLES):
		frappe.throw(_("You do not have permission to access the Front Desk Dashboard."), frappe.PermissionError)


def _can_read(doctype):
	return frappe.has_permission(doctype, "read")


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
	if not _can_read(doctype):
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
	if not _can_read(doctype):
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
	today = getdate(nowdate())
	date_range = {"startDate": start.isoformat(), "endDate": end.isoformat()}
	date_filter = ["between", [start, end]]
	today_datetime_filter = [
		"between",
		[get_datetime(f"{today} 00:00:00"), get_datetime(f"{today} 23:59:59")],
	]
	datetime_filter = [
		"between",
		[get_datetime(f"{start} 00:00:00"), get_datetime(f"{end} 23:59:59")],
	]
	today_appointment_filters = {"creation": today_datetime_filter}
	lab_filters = {"date": date_filter, "status": ["in", FOLLOW_UP_LAB_STATUSES]}
	inpatient_filters = {
		"scheduled_date": date_filter,
		"status": ["in", ACTIVE_INPATIENT_STATUSES],
	}

	return {
		"dateRange": date_range,
		"kpis": {
			"appointments": _count(
				"Patient Appointment",
				today_appointment_filters,
			),
			"pendingCheckIns": _count(
				"Lab Test",
				lab_filters,
			),
			"checkedIn": _count(
				"Inpatient Record",
				inpatient_filters,
			),
			"newPatients": _count(
				"Patient",
				{"creation": datetime_filter},
			),
		},
		"operations": {
			"labTests": {
				"count": _count("Lab Test", lab_filters),
				"items": _get_rows(
					"Lab Test",
					["name", "patient_name", "lab_test_name", "status", "expected_result_date"],
					lab_filters,
					"expected_result_date asc",
				),
			},
			"inpatients": {
				"count": _count("Inpatient Record", inpatient_filters),
				"items": _get_rows(
					"Inpatient Record",
					[
						"name",
						"patient_name",
						"status",
						"scheduled_date",
						"expected_discharge",
						"medical_department",
					],
					inpatient_filters,
					"scheduled_date asc",
				),
			},
		},
	}
