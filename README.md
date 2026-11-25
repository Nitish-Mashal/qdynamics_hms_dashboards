### Qdynamics Hms Dashboards

Role-based dashboards for healthcare operations in Frappe Desk. The app provides separate
Healthcare Admin, Doctor, and Front Desk dashboards with date filters, operational summaries,
record lists, and role-appropriate quick actions.

### Healthcare Admin Dashboard

The native Desk Page is available at `/desk/healthcare/healthcare-admin-dashboard` to users with the
`Admin` role. The role assignment is defined in
`qdynamics_hms_dashboards/page/healthcare_admin_dashboard/healthcare_admin_dashboard.json`.

The dashboard includes:

- Date-range filters and presets for common reporting periods.
- OPD Visits, IPD Admissions, Laboratory Visits, and Paid Bill Value KPIs. Paid Bill Value is
  calculated from submitted, non-return Sales Invoices as `grand_total - outstanding_amount`.
- A Patient Footfall line chart showing daily new registrations, with dates on the X-axis,
  numeric patient counts on the Y-axis, and point tooltips. It uses ApexCharts, loaded from a
  pinned jsDelivr asset when the chart is needed.
- A live Bed Occupancy summary based on leaf Healthcare Service Unit records flagged
  `inpatient_occupancy`, using `occupancy_status` to distinguish occupied and vacant beds.
- A Needs Your Attention list for pending laboratory work and overdue bills, plus bed availability.
- Quick links to HRMS, Patients, Add Users, and Invoices.

The API is in `qdynamics_hms_dashboards.api.healthcare_admin_dashboard`. It enforces the `Admin`
role and checks DocType read permission for dashboard queries.

### Front Desk Dashboard

The native Desk Page is available at `/desk/healthcare/frontdesk-dashboard` to users with the
`Frontdesk` role. The role assignment is defined in
`qdynamics_hms_dashboards/page/frontdesk_dashboard/frontdesk_dashboard.json`.

The dashboard defaults to today and includes:

- Appointments Created Today, Lab Test, IPD, and Paid Bill Value KPIs. The appointment KPI counts
  records created today, independently of the selected date range. Paid Bill Value uses submitted,
  non-return Sales Invoices and the paid amount (`grand_total - outstanding_amount`) for the
  selected posting-date range.
- A Pending Appointments list for active appointments in the selected range that do not yet have a
  linked Patient Encounter.
- Lab Test Follow-up and Inpatient Activity lists. The activity cards have fixed heights and
  scrollable content.
- Nine Quick Actions arranged in a three-column grid: create an invoice, patient, appointment, lab
  test, or inpatient record; or open the patient, appointment, lab-test, and inpatient directories.
  Create actions are shown only when the user has permission to create that DocType.

The API is in `qdynamics_hms_dashboards.api.frontdesk_dashboard`. It enforces the `Frontdesk` role,
checks DocType permissions, and uses permission-aware queries. The app's migrations add read/create
permission for `Frontdesk` on Patient, Patient Appointment, Lab Test, and Inpatient Record; they do
not grant write or delete permission.

### Doctor Dashboard

The native Desk Page is available at `/desk/healthcare/doctor-dashboard` to users with the `Doctor`
role. The role assignment is defined in
`qdynamics_hms_dashboards/page/doctor_dashboard/doctor_dashboard.json`.

The dashboard shows the signed-in practitioner's appointments, patient encounters, and lab test
results for the selected date range, plus a Patient Directory count of records created today. The
user must be linked to exactly one active `Healthcare Practitioner` through its `user_id` field.
Quick Actions open forms to create an encounter, appointment, or patient, or open Patient History.

The API is in `qdynamics_hms_dashboards.api.doctor_dashboard`. It enforces the `Doctor` role, scopes
queries to the linked practitioner, and checks DocType read permission.

### Shared behavior and access

- All three dashboards use the signed-in user's first name in the greeting and provide the native
  Frappe Awesome Bar for global search.
- Dashboard role assignments are part of the standard Page JSON files above. `bench migrate`
  synchronizes these definitions to the site, so make role-assignment changes in the JSON rather
  than only in the Desk Page form. The corresponding Role records must exist on the site.
- Dashboard APIs enforce the same role as their Page and use permission-aware queries. Metrics or
  lists are restricted when the required DocType read permission is missing.

### Prerequisites

Before installing this app on a site, make sure the following are in place:

- A working Frappe Bench/site with compatible Frappe, ERPNext, and Frappe Healthcare apps installed.
  The dashboards use Healthcare DocTypes including Patient, Patient Appointment, Patient Encounter,
  Healthcare Practitioner, Lab Test, Inpatient Record, and Healthcare Service Unit, as well as
  ERPNext's Sales Invoice.
- Python 3.14 or newer, as declared in `pyproject.toml`.
- The site has Role records named exactly `Admin`, `Doctor`, and `Frontdesk`. The standard Page JSON
  files reference these roles, and the Frontdesk permission patches require the `Frontdesk` role
  before they run.
- Users need DocType permissions in addition to the dashboard role:
  - Admin needs read access to Patient, Patient Appointment, Inpatient Record, Lab Test,
    Healthcare Service Unit, and Sales Invoice.
  - Doctor needs read access to Healthcare Practitioner, Patient, Patient Appointment,
    Patient Encounter, and Lab Test. Grant create access to Patient, Patient Appointment, and
    Patient Encounter to enable the matching Quick Actions.
  - Frontdesk patches grant read/create access to Patient, Patient Appointment, Lab Test, and
    Inpatient Record; they do not grant write or delete access. Frontdesk also needs read access
    to Patient Encounter and Sales Invoice, and create access to Sales Invoice to use Create Invoice.
- Each Doctor user is linked through `Healthcare Practitioner.user_id` to exactly one active
  Healthcare Practitioner record.
- Browser clients can access `cdn.jsdelivr.net` to load ApexCharts for the Admin Patient Footfall
  graph.

### Installation

After installing the prerequisites and creating the three roles above, install the app with the
[bench](https://github.com/frappe/bench) CLI:

```bash
cd <path-to-bench>
bench get-app <URL_OF_THIS_REPO> --branch main
bench --site <site-name> install-app qdynamics_hms_dashboards
bench --site <site-name> migrate
```

`bench migrate` syncs the standard dashboard Page definitions and applies the app's permission
patches. Keep the role assignments in the Page JSON files so later migrations do not replace them
with different roles.

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
