import unittest
from unittest.mock import MagicMock, patch

import frappe
from frappe.utils import get_datetime, getdate, nowdate

from qdynamics_hms_dashboards.api.frontdesk_dashboard import (
	_count,
	_get_paid_invoice_value,
	_get_pending_appointments,
	_get_rows,
	_normalize_dates,
	_require_dashboard_access,
	get_dashboard,
)


class TestFrontdeskDashboard(unittest.TestCase):
	def test_default_date_range_is_today(self):
		start, end = _normalize_dates()

		self.assertEqual(start, getdate(nowdate()))
		self.assertEqual(end, getdate(nowdate()))

	def test_requested_date_range_is_preserved(self):
		start, end = _normalize_dates("2026-03-04", "2026-03-19")

		self.assertEqual(start, getdate("2026-03-04"))
		self.assertEqual(end, getdate("2026-03-19"))

	def test_appointments_kpi_counts_appointments_created_today(self):
		today = getdate("2026-03-20")
		selected_range = (getdate("2026-03-04"), getdate("2026-03-19"))
		with (
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._require_dashboard_access"),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._normalize_dates", return_value=selected_range),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard.nowdate", return_value=today.isoformat()),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._count") as count,
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._get_rows", return_value=[]),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._get_pending_appointments") as pending_appointments,
			patch(
				"qdynamics_hms_dashboards.api.frontdesk_dashboard._get_paid_invoice_value",
				return_value={"value": 1250.5, "restricted": False},
			) as paid_invoice_value,
		):
			result = get_dashboard("2026-03-04", "2026-03-19")

		count.assert_any_call(
			"Patient Appointment",
			{
				"creation": [
					"between",
					[get_datetime(f"{today} 00:00:00"), get_datetime(f"{today} 23:59:59")],
				],
			},
		)
		pending_appointments.assert_called_once_with(
			{
				"appointment_date": ["between", list(selected_range)],
				"status": ["in", ["Scheduled", "Open", "Confirmed", "Checked In"]],
			}
		)
		paid_invoice_value.assert_called_once_with(
			{"posting_date": ["between", list(selected_range)], "docstatus": 1, "is_return": 0}
		)
		self.assertEqual(result["kpis"]["bills"], {"value": 1250.5, "restricted": False})

	def test_pending_appointments_require_appointment_and_encounter_permissions(self):
		with (
			patch(
				"qdynamics_hms_dashboards.api.frontdesk_dashboard._can_read",
				side_effect={"Patient Appointment": True, "Patient Encounter": False}.get,
			),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _get_pending_appointments({})

		self.assertEqual(result, {"count": {"value": None, "restricted": True}, "items": None})
		get_query.assert_not_called()

	def test_date_range_rejects_reversed_dates(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("2026-03-20", "2026-03-19")

	def test_date_range_rejects_invalid_date(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("not-a-date", "2026-03-19")

	def test_frontdesk_role_can_access_dashboard(self):
		with patch(
			"qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.get_roles",
			return_value=["Frontdesk"],
		):
			_require_dashboard_access()

	def test_healthcare_admin_role_is_denied(self):
		with patch(
			"qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.get_roles",
			return_value=["Healthcare Administrator"],
		):
			with self.assertRaises(frappe.PermissionError):
				_require_dashboard_access()

	def test_count_does_not_query_without_read_permission(self):
		with (
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._can_read", return_value=False),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _count("Patient Appointment", {})

		self.assertEqual(result, {"value": None, "restricted": True})
		get_query.assert_not_called()

	def test_paid_bill_value_uses_grand_total_minus_outstanding_amount(self):
		query = MagicMock()
		query.run.return_value = [frappe._dict(total=2000)]

		with (
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._can_read", return_value=True),
			patch(
				"qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.qb.get_query",
				return_value=query,
			),
		):
			result = _get_paid_invoice_value({})

		self.assertEqual(result, {"value": 2000.0, "restricted": False})

	def test_operational_list_is_unavailable_without_read_permission(self):
		with (
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._can_read", return_value=False),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _get_rows("Lab Test", ["name"], {}, "name asc")

		self.assertIsNone(result)
		get_query.assert_not_called()
