import frappe
from frappe import _
from frappe.query_builder.functions import Count, Sum
from frappe.utils import get_datetime, getdate, nowdate


FRONTDESK_ROLES = {"Frontdesk"}
ACTIVE_INPATIENT_STATUSES = ["Admission Scheduled", "Admitted", "Discharge Scheduled"]
FOLLOW_UP_LAB_STATUSES = ["Draft", "Completed"]
PENDING_APPOINTMENT_STATUSES = ["Scheduled", "Open", "Confirmed", "Checked In"]


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


def _get_paid_invoice_value(filters):
	if not _can_read("Sales Invoice"):
		return {"value": None, "restricted": True}

	invoice = frappe.qb.DocType("Sales Invoice")
	paid_value = invoice.grand_total - invoice.outstanding_amount
	rows = frappe.qb.get_query(
		"Sales Invoice",
		fields=[Sum(paid_value).as_("total")],
		filters=filters,
		ignore_permissions=False,
	).run(as_dict=True)
	total = rows[0].total if rows and rows[0].total is not None else 0
	return {"value": float(total), "restricted": False}


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


def _get_pending_appointments(filters):
	if not _can_read("Patient Appointment") or not _can_read("Patient Encounter"):
		return {"count": {"value": None, "restricted": True}, "items": None}

	appointment = frappe.qb.DocType("Patient Appointment")
	encounters = frappe.qb.get_query(
		"Patient Encounter",
		fields=["appointment"],
		filters={"appointment": ["is", "set"]},
		ignore_permissions=False,
	)

	count_query = frappe.qb.get_query(
		"Patient Appointment",
		fields=[Count(appointment.name).as_("count")],
		filters=filters,
		ignore_permissions=False,
	).where(appointment.name.notin(encounters))
	count_rows = count_query.run(as_dict=True)

	items = frappe.qb.get_query(
		"Patient Appointment",
		fields=["name", "patient_name", "appointment_date", "appointment_time", "appointment_type", "status"],
		filters=filters,
		order_by="appointment_date asc, appointment_time asc",
		limit=8,
		ignore_permissions=False,
	).where(appointment.name.notin(encounters)).run(as_dict=True)

	return {
		"count": {"value": count_rows[0].count if count_rows else 0, "restricted": False},
		"items": items,
	}


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
	today_appointment_filters = {"creation": today_datetime_filter}
	lab_filters = {"date": date_filter, "status": ["in", FOLLOW_UP_LAB_STATUSES]}
	inpatient_filters = {
		"scheduled_date": date_filter,
		"status": ["in", ACTIVE_INPATIENT_STATUSES],
	}
	pending_appointment_filters = {
		"appointment_date": date_filter,
		"status": ["in", PENDING_APPOINTMENT_STATUSES],
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
			"bills": _get_paid_invoice_value(
				{"posting_date": date_filter, "docstatus": 1, "is_return": 0}
			),
		},
		"operations": {
			"pendingAppointments": _get_pending_appointments(pending_appointment_filters),
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
