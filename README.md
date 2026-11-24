### Qdynamics Hms Dashboards

Roles based dashboards for the healthcare

### Healthcare Admin Dashboard

The app provides a native Frappe Desk Page at `/desk/healthcare-admin-dashboard` for users with the
`Healthcare Administrator` or `System Manager` role. Its whitelisted APIs live in
`qdynamics_hms_dashboards.api.healthcare_admin_dashboard`; each dashboard query checks DocType read
permission and uses Frappe's permission-aware query builder. The header search opens Frappe's native
Awesome Bar, including its command and DocType suggestions, keyboard navigation, and permission-aware
global search.

OPD Visits count Patient Appointment records by `creation` within the selected range. Other date
filters use Inpatient Record `admitted_datetime`, Lab Test `date`, Sales Invoice `posting_date`, and
Patient `creation`. Bed occupancy is a live snapshot from leaf Healthcare Service Unit records
flagged `inpatient_occupancy`, using `occupancy_status` to distinguish occupied and vacant beds.

### Front Desk Dashboard

The app also provides a native Desk Page at `/desk/frontdesk-dashboard` for the `Frontdesk`,
`Healthcare Administrator`, and `System Manager` roles. A date range filters dashboard KPIs and
operational lists, defaulting to today. The Appointments Created Today KPI counts records created
today, independent of the selected range and scheduled appointment date. The Pending Check-ins KPI
counts follow-up Lab Tests, and the Checked In KPI counts active Inpatient Records. Its API lives in
`qdynamics_hms_dashboards.api.frontdesk_dashboard` and enforces role access plus DocType read
permissions. Migrations add read/create permission for the `Frontdesk` role on Patient,
Patient Appointment, Lab Test, and Inpatient Record, preserving existing role rules and granting
no write/delete access. The header search opens Frappe's native Awesome Bar.

### Doctor Dashboard

The app provides a native Desk Page at `/desk/qdynamics-hms-dashboards/doctor-dashboard` for users
with the `Physician` role. It shows the linked practitioner's appointments, patient encounters, and
lab tests for the selected date range. The signed-in user must be linked to one active
`Healthcare Practitioner` record through its `user_id` field. The API filters each data query by
that practitioner and respects DocType read permissions.

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch main
bench install-app qdynamics_hms_dashboards
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/qdynamics_hms_dashboards
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade
### CI

This app can use GitHub Actions for CI. The following workflows are configured:

- CI: Installs this app and runs unit tests on every push to `develop` branch.
- Linters: Runs [Frappe Semgrep Rules](https://github.com/frappe/semgrep-rules) and [pip-audit](https://pypi.org/project/pip-audit/) on every pull request.


### License

mit
