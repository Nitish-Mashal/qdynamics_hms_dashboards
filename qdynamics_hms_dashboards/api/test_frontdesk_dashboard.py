import unittest
from unittest.mock import patch

import frappe
from frappe.utils import get_datetime, getdate, nowdate

from qdynamics_hms_dashboards.api.frontdesk_dashboard import (
	_count,
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
		):
			get_dashboard("2026-03-04", "2026-03-19")

		count.assert_any_call(
			"Patient Appointment",
			{
				"creation": [
					"between",
					[get_datetime(f"{today} 00:00:00"), get_datetime(f"{today} 23:59:59")],
				],
			},
		)

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

	def test_healthcare_admin_can_access_dashboard(self):
		with patch(
			"qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.get_roles",
			return_value=["Healthcare Administrator"],
		):
			_require_dashboard_access()

	def test_other_roles_are_denied(self):
		with patch(
			"qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.get_roles",
			return_value=["Physician"],
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

	def test_operational_list_is_unavailable_without_read_permission(self):
		with (
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard._can_read", return_value=False),
			patch("qdynamics_hms_dashboards.api.frontdesk_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _get_rows("Lab Test", ["name"], {}, "name asc")

		self.assertIsNone(result)
		get_query.assert_not_called()
