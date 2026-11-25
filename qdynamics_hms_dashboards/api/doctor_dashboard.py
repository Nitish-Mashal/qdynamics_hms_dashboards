import frappe
from frappe import _
from frappe.query_builder.functions import Count
from frappe.utils import get_datetime, get_first_day, getdate, nowdate


DOCTOR_ROLES = {"Doctor"}
ACTIVE_APPOINTMENT_STATUSES = ["Scheduled", "Open", "Confirmed", "Checked In"]


def _require_dashboard_access():
	roles = set(frappe.get_roles())
	if frappe.session.user == "Guest" or not roles.intersection(DOCTOR_ROLES):
		frappe.throw(_("You do not have permission to access the Doctor Dashboard."), frappe.PermissionError)


def _normalize_dates(start_date=None, end_date=None):
	today = getdate(nowdate())

	def parse_date(value, fallback):
		if not value:
			return fallback
		try:
			return getdate(value)
		except (TypeError, ValueError):
			frappe.throw(_("Invalid date: {0}").format(value), frappe.ValidationError)

	start = parse_date(start_date, get_first_day(today))
	end = parse_date(end_date, today)
	if start > end:
		frappe.throw(_("Start Date cannot be later than End Date."), frappe.ValidationError)

	return start, end


def _can_read(doctype):
	return frappe.has_permission(doctype, "read")


def _get_practitioner():
	if not _can_read("Healthcare Practitioner"):
		frappe.throw(_("Healthcare Practitioner read permission is required."), frappe.PermissionError)

	practitioners = frappe.qb.get_query(
		"Healthcare Practitioner",
		fields=["name", "practitioner_name", "department"],
		filters={"user_id": frappe.session.user, "status": "Active"},
		limit=2,
		ignore_permissions=False,
	).run(as_dict=True)

	if not practitioners:
		frappe.throw(
			_("Your user is not linked to an active Healthcare Practitioner. Ask an administrator to link it."),
			frappe.ValidationError,
		)
	if len(practitioners) > 1:
		frappe.throw(
			_("Your user is linked to multiple active Healthcare Practitioners. Ask an administrator to correct it."),
			frappe.ValidationError,
		)

	return practitioners[0]


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


def _get_rows(doctype, fields, filters, order_by, limit=8):
	if not _can_read(doctype):
		return None

	return frappe.qb.get_query(
		doctype,
		fields=fields,
		filters=filters,
		order_by=order_by,
		limit=limit,
		ignore_permissions=False,
	).run(as_dict=True)


@frappe.whitelist()
def get_dashboard(start_date=None, end_date=None):
	_require_dashboard_access()
	practitioner = _get_practitioner()
	start, end = _normalize_dates(start_date, end_date)
	today = getdate(nowdate())
	date_filter = ["between", [start, end]]
	today_datetime_filter = [
		"between",
		[get_datetime(f"{today} 00:00:00"), get_datetime(f"{today} 23:59:59")],
	]
	appointment_filters = {
		"practitioner": practitioner.name,
		"appointment_date": date_filter,
		"status": ["not in", ["Cancelled", "No Show"]],
	}
	encounter_filters = {
		"practitioner": practitioner.name,
		"encounter_date": date_filter,
		"status": ["!=", "Cancelled"],
	}
	lab_test_filters = {
		"practitioner": practitioner.name,
		"date": date_filter,
		"status": ["not in", ["Cancelled", "Rejected"]],
	}
	appointment_count = _count("Patient Appointment", appointment_filters)
	encounter_count = _count("Patient Encounter", encounter_filters)
	lab_test_count = _count("Lab Test", lab_test_filters)
	patient_count = _count("Patient", {"creation": today_datetime_filter})

	return {
		"dateRange": {"startDate": start.isoformat(), "endDate": end.isoformat()},
		"practitioner": {
			"name": practitioner.name,
			"practitionerName": practitioner.practitioner_name,
			"department": practitioner.department,
		},
		"kpis": {
			"appointments": appointment_count,
			"encounters": encounter_count,
			"labTests": lab_test_count,
			"patientDirectory": patient_count,
		},
		"operations": {
			"appointments": {
				"count": appointment_count,
				"items": _get_rows(
					"Patient Appointment",
					["name", "patient_name", "appointment_date", "appointment_time", "status"],
					appointment_filters,
					"appointment_date asc, appointment_time asc",
				),
			},
			"encounters": {
				"count": encounter_count,
				"items": _get_rows(
					"Patient Encounter",
					["name", "patient_name", "encounter_date", "encounter_time", "status"],
					encounter_filters,
					"encounter_date desc, encounter_time desc",
				),
			},
			"labTests": {
				"count": lab_test_count,
				"items": _get_rows(
					"Lab Test",
					["name", "patient_name", "lab_test_name", "date", "status"],
					lab_test_filters,
					"date desc, time desc",
				),
			},
		},
	}
