import frappe
from frappe import _
from frappe.query_builder.functions import Count, Date
from frappe.utils import get_datetime, get_first_day, getdate, nowdate


ADMIN_ROLES = {"Healthcare Administrator", "System Manager"}


def _require_dashboard_access():
	roles = set(frappe.get_roles())
	if frappe.session.user == "Guest" or not roles.intersection(ADMIN_ROLES):
		frappe.throw(_("You do not have permission to access the Healthcare Admin Dashboard."), frappe.PermissionError)


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


def _get_rows(doctype, fields, filters, *, limit=5, order_by=None):
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


def _get_patient_footfall(start, end):
	if not _can_read("Patient"):
		return {"available": False, "restricted": True, "points": []}

	patient = frappe.qb.DocType("Patient")
	day = Date(patient.creation)
	query = frappe.qb.get_query(
		"Patient",
		fields=[day.as_("date"), Count(patient.name).as_("count")],
		filters={"creation": ["between", [start, end]]},
		ignore_permissions=False,
	)
	points = query.groupby(day).orderby(day).run(as_dict=True)

	return {
		"available": True,
		"restricted": False,
		"points": [{"date": str(row.date), "count": row.count} for row in points],
	}


def _get_bed_occupancy():
	if not _can_read("Healthcare Service Unit"):
		return {
			"available": False,
			"restricted": True,
			"total": None,
			"occupied": None,
			"availableBeds": None,
			"occupancyPercent": None,
		}

	service_unit = frappe.qb.DocType("Healthcare Service Unit")
	query = frappe.qb.get_query(
		"Healthcare Service Unit",
		fields=[service_unit.occupancy_status, Count(service_unit.name).as_("count")],
		filters={"is_group": 0, "inpatient_occupancy": 1},
		ignore_permissions=False,
	)
	rows = query.groupby(service_unit.occupancy_status).run(as_dict=True)
	counts = {row.occupancy_status: row.count for row in rows}
	total = sum(counts.values())
	occupied = counts.get("Occupied", 0)
	available = counts.get("Vacant", 0)

	return {
		"available": True,
		"restricted": False,
		"total": total,
		"occupied": occupied,
		"availableBeds": available,
		"occupancyPercent": round(occupied / total * 100) if total else 0,
		"liveSnapshot": True,
	}


def _get_attention(start, end):
	today = getdate(nowdate())
	lab_tests = _get_rows(
		"Lab Test",
		["name", "patient_name", "lab_test_name", "status", "expected_result_date"],
		{
			"date": ["between", [start, end]],
			"status": ["in", ["Draft", "Completed"]],
		},
		order_by="date asc",
	)

	overdue_bills = _get_rows(
		"Sales Invoice",
		["name", "customer_name", "due_date", "outstanding_amount"],
		{
			"docstatus": 1,
			"is_return": 0,
			"posting_date": ["between", [start, end]],
			"due_date": ["<", today],
			"outstanding_amount": [">", 0],
		},
		order_by="due_date asc",
	)

	return {
		"pendingLabTests": lab_tests,
		"overdueBills": overdue_bills,
	}


@frappe.whitelist()
def get_dashboard(start_date=None, end_date=None):
	_require_dashboard_access()
	start, end = _normalize_dates(start_date, end_date)
	date_range = {"startDate": start.isoformat(), "endDate": end.isoformat()}
	appointment_created_range = [
		"between",
		[get_datetime(f"{start} 00:00:00"), get_datetime(f"{end} 23:59:59")],
	]

	return {
		"dateRange": date_range,
		"kpis": {
			"opdVisits": _count(
				"Patient Appointment",
				{
					"creation": appointment_created_range,
					"status": ["not in", ["Cancelled", "No Show"]],
				},
			),
			"ipdAdmissions": _count(
				"Inpatient Record",
				{
					"admitted_datetime": ["between", [start, end]],
					"status": ["!=", "Cancelled"],
				},
			),
			"laboratoryVisits": _count(
				"Lab Test",
				{
					"date": ["between", [start, end]],
					"status": ["not in", ["Cancelled", "Rejected"]],
				},
			),
			"bills": _count(
				"Sales Invoice",
				{"posting_date": ["between", [start, end]], "docstatus": 1, "is_return": 0},
			),
		},
		"patientFootfall": _get_patient_footfall(start, end),
		"bedOccupancy": _get_bed_occupancy(),
		"attention": _get_attention(start, end),
	}
