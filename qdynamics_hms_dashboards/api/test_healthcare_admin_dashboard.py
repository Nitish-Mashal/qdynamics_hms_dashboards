import unittest
from unittest.mock import MagicMock, patch

import frappe
from frappe.utils import get_datetime, get_first_day, getdate, nowdate

from qdynamics_hms_dashboards.api.healthcare_admin_dashboard import (
	_count,
	_sum,
	_get_paid_invoice_value,
	_get_bed_occupancy,
	_normalize_dates,
	_require_dashboard_access,
	get_dashboard,
)


class TestHealthcareAdminDashboard(unittest.TestCase):
	def test_default_range_is_current_month(self):
		start, end = _normalize_dates()

		self.assertEqual(start, get_first_day(getdate(nowdate())))
		self.assertEqual(end, getdate(nowdate()))

	def test_range_preserves_valid_dates(self):
		start, end = _normalize_dates("2026-03-04", "2026-03-19")

		self.assertEqual(start, getdate("2026-03-04"))
		self.assertEqual(end, getdate("2026-03-19"))

	def test_opd_visits_count_appointments_created_in_selected_range(self):
		start, end = getdate("2026-03-04"), getdate("2026-03-19")
		with (
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._require_dashboard_access"),
			patch(
				"qdynamics_hms_dashboards.api.healthcare_admin_dashboard._normalize_dates",
				return_value=(start, end),
			),
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._count") as count,
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._get_paid_invoice_value"),
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._get_patient_footfall"),
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._get_bed_occupancy"),
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._get_attention"),
		):
			get_dashboard("2026-03-04", "2026-03-19")

		count.assert_any_call(
			"Patient Appointment",
			{
				"creation": [
					"between",
					[get_datetime("2026-03-04 00:00:00"), get_datetime("2026-03-19 23:59:59")],
				],
				"status": ["not in", ["Cancelled", "No Show"]],
			},
		)

	def test_range_rejects_reversed_dates(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("2026-03-20", "2026-03-19")

	def test_range_rejects_invalid_date(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("not-a-date", "2026-03-19")

	def test_count_does_not_query_when_read_permission_is_missing(self):
		with (
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._can_read", return_value=False),
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _count("Patient", {})

		self.assertEqual(result, {"value": None, "restricted": True})
		get_query.assert_not_called()

	def test_paid_bill_value_sums_paid_amount(self):
		query = MagicMock()
		query.run.return_value = [frappe._dict(total=1250.50)]

		with (
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._can_read", return_value=True),
			patch(
				"qdynamics_hms_dashboards.api.healthcare_admin_dashboard.frappe.qb.get_query",
				return_value=query,
			),
		):
			result = _sum("Sales Invoice", "paid_amount", {})

		self.assertEqual(result, {"value": 1250.5, "restricted": False})

	def test_paid_bill_value_uses_grand_total_minus_outstanding_amount(self):
		query = MagicMock()
		query.run.return_value = [frappe._dict(total=2000)]

		with (
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._can_read", return_value=True),
			patch(
				"qdynamics_hms_dashboards.api.healthcare_admin_dashboard.frappe.qb.get_query",
				return_value=query,
			),
		):
			result = _get_paid_invoice_value({})

		self.assertEqual(result, {"value": 2000.0, "restricted": False})

	def test_bed_occupancy_calculates_total_and_percent(self):
		query = MagicMock()
		query.groupby.return_value.run.return_value = [
			frappe._dict(occupancy_status="Occupied", count=3),
			frappe._dict(occupancy_status="Vacant", count=1),
		]

		with (
			patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard._can_read", return_value=True),
			patch(
				"qdynamics_hms_dashboards.api.healthcare_admin_dashboard.frappe.qb.get_query",
				return_value=query,
			),
		):
			result = _get_bed_occupancy()

		self.assertEqual(result["total"], 4)
		self.assertEqual(result["occupied"], 3)
		self.assertEqual(result["availableBeds"], 1)
		self.assertEqual(result["occupancyPercent"], 75)

	def test_admin_role_can_access_dashboard(self):
		with patch("qdynamics_hms_dashboards.api.healthcare_admin_dashboard.frappe.get_roles", return_value=["Admin"]):
			_require_dashboard_access()

	def test_healthcare_administrator_role_is_denied(self):
		with patch(
			"qdynamics_hms_dashboards.api.healthcare_admin_dashboard.frappe.get_roles",
			return_value=["Healthcare Administrator"],
		):
			with self.assertRaises(frappe.PermissionError):
				_require_dashboard_access()

