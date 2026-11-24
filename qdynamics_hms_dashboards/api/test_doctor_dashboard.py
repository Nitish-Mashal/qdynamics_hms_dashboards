import unittest
from unittest.mock import patch

import frappe
from frappe.utils import get_first_day, getdate, nowdate

from qdynamics_hms_dashboards.api.doctor_dashboard import (
	_count,
	_get_practitioner,
	_normalize_dates,
	_require_dashboard_access,
	get_dashboard,
)


class TestDoctorDashboard(unittest.TestCase):
	def test_default_date_range_is_current_month(self):
		start, end = _normalize_dates()

		self.assertEqual(start, get_first_day(getdate(nowdate())))
		self.assertEqual(end, getdate(nowdate()))

	def test_range_rejects_reversed_dates(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("2026-03-20", "2026-03-19")

	def test_count_does_not_query_without_read_permission(self):
		with (
			patch("qdynamics_hms_dashboards.api.doctor_dashboard._can_read", return_value=False),
			patch("qdynamics_hms_dashboards.api.doctor_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _count("Patient Appointment", {})

		self.assertEqual(result, {"value": None, "restricted": True})
		get_query.assert_not_called()

	def test_physician_role_can_access_dashboard(self):
		with patch("qdynamics_hms_dashboards.api.doctor_dashboard.frappe.get_roles", return_value=["Physician"]):
			_require_dashboard_access()

	def test_other_roles_are_denied(self):
		with patch("qdynamics_hms_dashboards.api.doctor_dashboard.frappe.get_roles", return_value=["Frontdesk"]):
			with self.assertRaises(frappe.PermissionError):
				_require_dashboard_access()

	def test_linked_practitioner_is_required(self):
		query = frappe._dict(run=lambda **kwargs: [])
		with (
			patch("qdynamics_hms_dashboards.api.doctor_dashboard._can_read", return_value=True),
			patch("qdynamics_hms_dashboards.api.doctor_dashboard.frappe.qb.get_query", return_value=query),
		):
			with self.assertRaises(frappe.ValidationError):
				_get_practitioner()

	def test_dashboard_queries_are_scoped_to_linked_practitioner(self):
		start, end = getdate("2026-03-04"), getdate("2026-03-19")
		practitioner = frappe._dict(
			name="HLC-PRAC-TEST",
			practitioner_name="Doctor",
			department="Cardiology",
		)
		with (
			patch("qdynamics_hms_dashboards.api.doctor_dashboard._require_dashboard_access"),
			patch("qdynamics_hms_dashboards.api.doctor_dashboard._get_practitioner", return_value=practitioner),
			patch(
				"qdynamics_hms_dashboards.api.doctor_dashboard._normalize_dates",
				return_value=(start, end),
			),
			patch("qdynamics_hms_dashboards.api.doctor_dashboard._count") as count,
			patch("qdynamics_hms_dashboards.api.doctor_dashboard._get_rows", return_value=[]),
		):
			get_dashboard("2026-03-04", "2026-03-19")

		count.assert_any_call(
			"Patient Appointment",
			{
				"practitioner": "HLC-PRAC-TEST",
				"appointment_date": ["between", [start, end]],
				"status": ["not in", ["Cancelled", "No Show"]],
			},
		)
		count.assert_any_call(
			"Patient Encounter",
			{
				"practitioner": "HLC-PRAC-TEST",
				"encounter_date": ["between", [start, end]],
				"status": ["!=", "Cancelled"],
			},
		)

