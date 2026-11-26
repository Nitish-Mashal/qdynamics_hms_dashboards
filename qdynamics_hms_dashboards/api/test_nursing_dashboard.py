import unittest
from unittest.mock import patch

import frappe
from frappe.utils import get_datetime, getdate, nowdate

from qdynamics_hms_dashboards.api.nursing_dashboard import (
	_count,
	_get_rows,
	_normalize_dates,
	_require_dashboard_access,
	get_dashboard,
)
from qdynamics_hms_dashboards.patches.v1_2.create_nursing_role import execute as create_nursing_role


class TestNursingDashboard(unittest.TestCase):
	def test_default_date_range_is_today(self):
		start, end = _normalize_dates()

		self.assertEqual(start, getdate(nowdate()))
		self.assertEqual(end, getdate(nowdate()))

	def test_requested_date_range_is_preserved(self):
		start, end = _normalize_dates("2026-03-04", "2026-03-19")

		self.assertEqual(start, getdate("2026-03-04"))
		self.assertEqual(end, getdate("2026-03-19"))

	def test_date_range_rejects_reversed_dates(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("2026-03-20", "2026-03-19")

	def test_date_range_rejects_invalid_date(self):
		with self.assertRaises(frappe.ValidationError):
			_normalize_dates("not-a-date", "2026-03-19")

	def test_nursing_role_can_access_dashboard(self):
		with patch("qdynamics_hms_dashboards.api.nursing_dashboard.frappe.get_roles", return_value=["Nursing"]):
			_require_dashboard_access()

	def test_nursing_user_without_dashboard_role_is_denied(self):
		with patch(
			"qdynamics_hms_dashboards.api.nursing_dashboard.frappe.get_roles",
			return_value=["Nursing User"],
		):
			with self.assertRaises(frappe.PermissionError):
				_require_dashboard_access()

	def test_count_does_not_query_without_read_permission(self):
		with (
			patch("qdynamics_hms_dashboards.api.nursing_dashboard.frappe.has_permission", return_value=False),
			patch("qdynamics_hms_dashboards.api.nursing_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _count("Patient Encounter", {})

		self.assertEqual(result, {"value": None, "restricted": True})
		get_query.assert_not_called()

	def test_operation_list_is_unavailable_without_read_permission(self):
		with (
			patch("qdynamics_hms_dashboards.api.nursing_dashboard.frappe.has_permission", return_value=False),
			patch("qdynamics_hms_dashboards.api.nursing_dashboard.frappe.qb.get_query") as get_query,
		):
			result = _get_rows("Patient Encounter", ["name"], {}, "name asc")

		self.assertIsNone(result)
		get_query.assert_not_called()

	def test_nursing_role_is_created_when_missing(self):
		with (
			patch("qdynamics_hms_dashboards.patches.v1_2.create_nursing_role.frappe.db.exists", return_value=False),
			patch("qdynamics_hms_dashboards.patches.v1_2.create_nursing_role.frappe.get_doc") as get_doc,
		):
			create_nursing_role()

		get_doc.assert_called_once_with(
			{
				"doctype": "Role",
				"role_name": "Nursing",
				"desk_access": 1,
				"is_custom": 1,
			}
		)
		get_doc.return_value.insert.assert_called_once_with(ignore_permissions=True)

	def test_dashboard_uses_selected_dates_and_requested_doctypes(self):
		selected_range = (getdate("2026-03-04"), getdate("2026-03-19"))
		with (
			patch("qdynamics_hms_dashboards.api.nursing_dashboard._require_dashboard_access"),
			patch(
				"qdynamics_hms_dashboards.api.nursing_dashboard._normalize_dates",
				return_value=selected_range,
			),
			patch(
				"qdynamics_hms_dashboards.api.nursing_dashboard._count",
				return_value={"value": 2, "restricted": False},
			) as count,
			patch(
				"qdynamics_hms_dashboards.api.nursing_dashboard._get_rows",
				return_value=[],
			) as get_rows,
		):
			result = get_dashboard("2026-03-04", "2026-03-19")

		self.assertEqual(
			result["dateRange"],
			{"startDate": "2026-03-04", "endDate": "2026-03-19"},
		)
		self.assertEqual(set(result["kpis"]), {"wards", "nursingTasks", "patients", "checklists"})
		self.assertEqual(set(result["operations"]), {"inpatients", "doctorOrders", "labReports"})
		count.assert_any_call("Healthcare Service Unit", {"is_group": 0, "inpatient_occupancy": 1})
		count.assert_any_call(
			"Nursing Task",
			{
				"date": ["between", list(selected_range)],
				"docstatus": ["<", 2],
				"status": ["not in", ["Cancelled", "Entered in Error"]],
			},
		)
		count.assert_any_call(
			"Patient",
			{
				"creation": [
					"between",
					[
						get_datetime("2026-03-04 00:00:00"),
						get_datetime("2026-03-19 23:59:59"),
					],
				]
			},
		)
		count.assert_any_call("Nursing Checklist Template", {"disabled": 0})
		count.assert_any_call(
			"Patient Encounter",
			{"encounter_date": ["between", list(selected_range)], "status": ["not in", ["Cancelled"]]},
		)
		count.assert_any_call(
			"Inpatient Record",
			{
				"scheduled_date": ["between", list(selected_range)],
				"status": ["in", ["Admission Scheduled", "Admitted", "Discharge Scheduled"]],
			},
		)
		count.assert_any_call(
			"Lab Test",
			{"date": ["between", list(selected_range)], "status": ["in", ["Draft", "Completed"]]},
		)
		get_rows.assert_any_call(
			"Patient Encounter",
			["name", "patient_name", "practitioner_name", "encounter_date", "encounter_time", "status"],
			{"encounter_date": ["between", list(selected_range)], "status": ["not in", ["Cancelled"]]},
			"encounter_date desc, encounter_time desc",
		)


if __name__ == "__main__":
	unittest.main()
