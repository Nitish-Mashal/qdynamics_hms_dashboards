frappe.pages["frontdesk-dashboard"].on_page_load = function (wrapper) {
	new FrontdeskDashboard(wrapper);
};

class FrontdeskDashboard {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Front Desk Dashboard"),
			single_column: true,
		});
		this.startDate = null;
		this.endDate = null;
		this.addStyles();
		this.renderShell();
		this.mountGlobalSearch();
		this.setDefaultDates();
		this.bindEvents();
		this.loadDashboard();
	}

	addStyles() {
		if (document.getElementById("frontdesk-dashboard-styles")) return;
		const style = document.createElement("style");
		style.id = "frontdesk-dashboard-styles";
		style.textContent = `
			.hms-frontdesk { --fd-ink:#26243a; --fd-muted:#77758a; --fd-line:#ecebf2; color:var(--fd-ink); padding:22px 26px 36px; background:#f7f7fb; min-height:calc(100vh - 120px); }
			.hms-frontdesk * { box-sizing:border-box; }
			.page-head .fd-page-header { display:grid; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); gap:14px; padding-top:0!important; padding-bottom:0!important; align-items:center; }
			.fd-page-header .page-title { display:none; }
			.fd-global-search { display:flex; align-items:center; grid-column:2; justify-self:center; width:100%; min-width:0; max-width:460px; height:38px; gap:9px; padding:0 13px; border:1px solid var(--fd-line); border-radius:12px; background:#fff; color:#8d8a9c; cursor:pointer; font:inherit; text-align:left; }
			.fd-page-header .standard-items-section { grid-column:3; justify-self:end; }
			.fd-global-search svg { flex:none; }
			.fd-search-placeholder { flex:1; font-size:13px; }
			.fd-greeting { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:21px; }
			.fd-greeting h1 { margin:0 0 7px; font-size:25px; letter-spacing:-.8px; font-weight:750; }
			.fd-greeting p { margin:0; color:var(--fd-muted); font-size:13px; }
			.fd-range { color:#716e81; font-size:12px; font-weight:650; white-space:nowrap; }
			.fd-filter-card { margin-bottom:22px; padding:15px 17px; }
			.fd-filter-row { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
			.fd-filter-row label { display:grid; gap:5px; color:#77758a; font-size:11px; font-weight:650; }
			.fd-filter-row input { height:36px; min-width:145px; padding:0 9px; border:1px solid var(--fd-line); border-radius:8px; color:var(--fd-ink); font-size:12px; }
			.fd-filter-button { height:36px; padding:0 14px; border:1px solid var(--fd-line); border-radius:8px; color:#56536b; background:#fff; font-size:12px; font-weight:650; cursor:pointer; }
			.fd-filter-apply { border-color:transparent; color:#fff; background:linear-gradient(105deg,#453D89,#C8499A); }
			.fd-presets { display:flex; flex-wrap:wrap; gap:6px; margin-left:auto; }
			.fd-preset { height:30px; padding:0 10px; border:1px solid transparent; border-radius:7px; color:#77758a; background:#f7f6fa; font-size:11px; cursor:pointer; }
			.fd-preset:hover,.fd-preset.active { border-color:#ddd7f0; color:#51448f; background:#f2effa; }
			.fd-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:22px; }
			.fd-card { min-width:0; border:1px solid #eeedf3; border-radius:15px; background:#fff; box-shadow:0 3px 14px #27233d08; }
			.fd-kpi { --fd-shadow:rgba(69,61,137,.12); display:flex; align-items:flex-start; justify-content:space-between; min-height:122px; padding:18px; border:1px solid transparent; background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(69,61,137,.42),rgba(200,73,154,.26)) border-box; box-shadow:0 5px 16px var(--fd-shadow); color:inherit; text-decoration:none!important; transition:transform .16s,box-shadow .16s; }
			.fd-kpi:nth-child(even) { --fd-shadow:rgba(200,73,154,.12); background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(200,73,154,.26),rgba(69,61,137,.42)) border-box; }
			.fd-kpi:hover { transform:translateY(-2px); box-shadow:0 9px 22px var(--fd-shadow); }
			.fd-kpi-label { margin-bottom:15px; color:var(--fd-muted); font-size:12px; font-weight:600; }
			.fd-kpi-value { font-size:27px; line-height:1; letter-spacing:-.8px; font-weight:750; }
			.fd-kpi-note { margin-top:8px; color:#9290a0; font-size:10px; }
			.fd-kpi-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; color:#594e98; background:#f1effa; }
			.fd-kpi:nth-child(2) .fd-kpi-icon { color:#ba4f8e; background:#fbf0f6; }
			.fd-kpi:nth-child(3) .fd-kpi-icon { color:#3e9a8b; background:#edf8f5; }
			.fd-kpi:nth-child(4) .fd-kpi-icon { color:#d28742; background:#fff5e9; }
			.fd-panel { padding:19px; margin-bottom:18px; }
			.fd-operations { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; align-items:stretch; }
			.fd-section-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:15px; }
			.fd-section-heading h2 { margin:0; font-size:14px; font-weight:730; }
			.fd-section-heading span { color:#8a8799; font-size:10px; }
			.fd-operation-count { color:#716e81; font-size:11px; font-weight:700; }
			.fd-operations > .fd-card { height:330px; min-height:330px; margin-bottom:0; }
			.fd-operation-panel { display:flex; flex-direction:column; }
			.fd-operation-list { display:grid; grid-auto-rows:min-content; flex:1; min-height:0; gap:8px; align-content:start; overflow-y:auto; padding-right:4px; }
			.fd-operation { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px 12px; min-height:62px; padding:10px 12px; border:1px solid #f0eef4; border-radius:10px; background:#fff; color:inherit; text-align:left; cursor:pointer; }
			.fd-operation:hover { border-color:#d9d2ec; background:#fcfbfe; }
			.fd-operation-copy { min-width:0; }
			.fd-operation-copy strong { display:block; overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
			.fd-operation-copy small { display:block; margin-top:4px; overflow:hidden; color:#858294; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
			.fd-status { justify-self:end; padding:5px 9px; border-radius:999px; color:#695b9d; background:#f2effa; font-size:10px; font-weight:650; white-space:nowrap; }
			.fd-status.admitted,.fd-status.approved { color:#348b74; background:#edf8f4; }
			.fd-status.discharge-scheduled,.fd-status.completed { color:#a16c2e; background:#fff5e9; }
			.fd-status.draft,.fd-status.admission-scheduled { color:#695b9d; background:#f2effa; }
			.fd-message { display:grid; place-items:center; min-height:120px; color:#8a8799; font-size:12px; text-align:center; }
			.fd-status-message { margin:0 0 14px; color:#bd547a; font-size:12px; }
			.fd-quick-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; }
			.fd-action { display:flex; align-items:center; justify-content:flex-start; width:100%; min-width:0; gap:8px; min-height:48px; padding:8px 10px; border:1px solid transparent; border-radius:9px; color:#51448f; background:linear-gradient(105deg,rgba(69,61,137,.09),rgba(200,73,154,.10)) padding-box,linear-gradient(105deg,rgba(69,61,137,.30),rgba(200,73,154,.32)) border-box; box-shadow:0 3px 10px rgba(69,61,137,.08); font-size:11px; font-weight:650; text-align:left; text-decoration:none!important; cursor:pointer; transition:transform .16s,box-shadow .16s; }
			.fd-action span { min-width:0; overflow-wrap:anywhere; }
			.fd-action:hover { transform:translateY(-1px); color:#453D89; box-shadow:0 6px 15px rgba(119,70,153,.15); }
			.fd-action-primary { color:#51448f; }
			.fd-action svg { flex:0 0 18px; color:inherit; }
			@media(max-width:980px) { .fd-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } }
			@media(max-width:650px) {
				.hms-frontdesk { padding:15px 12px 26px; }
				.page-head .fd-page-header { display:grid!important; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); }
				.fd-greeting { align-items:flex-start; flex-direction:column; gap:9px; }
				.fd-greeting h1 { font-size:21px; }
				.fd-filter-row { align-items:stretch; }
				.fd-filter-row label { flex:1 1 calc(50% - 8px); }
				.fd-filter-row input { width:100%; min-width:0; }
				.fd-filter-row>.fd-filter-button { flex:1; }
				.fd-presets { flex-basis:100%; margin-left:0; }
				.fd-kpis { gap:9px; }
				.fd-kpi { min-height:112px; padding:13px; }
				.fd-kpi-label { font-size:11px; }
				.fd-kpi-value { font-size:23px; }
				.fd-kpi-icon { width:33px; height:33px; }
				.fd-panel { padding:15px; }
				.fd-operations { grid-template-columns:1fr; gap:11px; }
			}
			@media(max-width:380px) { .fd-kpis { grid-template-columns:1fr; } }
		`;
		document.head.appendChild(style);
	}

	renderShell() {
		this.page.main.addClass("hms-frontdesk-host").html(`
			<div class="hms-frontdesk">
				<div class="fd-greeting">
					<div><h1 class="fd-greeting-title"></h1><p>${__("Your front desk overview for the selected date range.")}</p></div>
					<div class="fd-range"></div>
				</div>
				<div class="fd-status-message" role="alert" hidden></div>
				<section class="fd-card fd-filter-card" aria-label="${__("Dashboard date filters")}">
					<div class="fd-filter-row">
						<label>${__("Start Date")}<input class="fd-start-date" type="date"></label>
						<label>${__("End Date")}<input class="fd-end-date" type="date"></label>
						<button type="button" class="fd-filter-button fd-filter-apply">${__("Apply Filter")}</button>
						<button type="button" class="fd-filter-button fd-filter-reset">${__("Reset")}</button>
						<div class="fd-presets">
							${["Today", "Yesterday", "This Week", "This Month", "This Year"].map((preset) => `<button type="button" class="fd-preset" data-preset="${preset}">${__(preset)}</button>`).join("")}
						</div>
					</div>
				</section>
				<section class="fd-kpis" aria-label="${__("Front desk summary for selected date range")}">
					${this.kpi("appointments", __("Appointments Created Today"), "patient-appointment", "calendar", __("Created today"))}
					${this.kpi("pendingCheckIns", __("Lab Test"), "lab-test", "clock", __("Lab Tests in selected period"))}
					${this.kpi("checkedIn", __("IPD"), "inpatient-record", "check", __("Inpatient Records in selected period"))}
					${this.kpi("bills", __("Paid Bill Value"), "sales-invoice", "receipt", __("Paid amount in selected date range"))}
				</section>
				<div class="fd-operations">
					<section class="fd-card fd-panel fd-operation-panel">
						<div class="fd-section-heading"><h2>${__("Pending Appointments")}</h2><span class="fd-operation-count" data-operation-count="pendingAppointments">—</span></div>
						<div class="fd-operation-list" data-operation-list="pendingAppointments"><div class="fd-message">${__("Loading appointments...")}</div></div>
					</section>
					<section class="fd-card fd-panel fd-operation-panel">
						<div class="fd-section-heading"><h2>${__("Lab Test Follow-up")}</h2><span class="fd-operation-count" data-operation-count="labTests">—</span></div>
						<div class="fd-operation-list" data-operation-list="labTests"><div class="fd-message">${__("Loading lab tests...")}</div></div>
					</section>
					<section class="fd-card fd-panel fd-operation-panel">
						<div class="fd-section-heading"><h2>${__("Inpatient Activity")}</h2><span class="fd-operation-count" data-operation-count="inpatients">—</span></div>
						<div class="fd-operation-list" data-operation-list="inpatients"><div class="fd-message">${__("Loading inpatient records...")}</div></div>
					</section>
					<section class="fd-card fd-panel">
						<div class="fd-section-heading"><h2>${__("Quick Actions")}</h2><span>${__("Common reception tasks")}</span></div>
						<div class="fd-quick-actions">
						${this.createAction("Sales Invoice", __("Create Invoice"), "receipt")}
							${this.createAction("Patient", __("Register Patient"), "patient")}
							${this.createAction("Patient Appointment", __("Book Appointment"), "calendar")}
							${this.createAction("Lab Test", __("Create Lab Test"), "flask")}
							${this.createAction("Inpatient Record", __("Create Inpatient Record"), "bed")}
							<a class="fd-action" href="/desk/patient" data-route="patient">${this.icon("patient")}<span>${__("Patient Directory")}</span></a>
							<a class="fd-action" href="/desk/patient-appointment" data-route="patient-appointment">${this.icon("calendar")}<span>${__("All Appointments")}</span></a>
							<a class="fd-action" href="/desk/lab-test" data-route="lab-test">${this.icon("flask")}<span>${__("Lab Tests")}</span></a>
							<a class="fd-action" href="/desk/inpatient-record" data-route="inpatient-record">${this.icon("bed")}<span>${__("Inpatient Records")}</span></a>
						</div>
					</section>
				</div>
			</div>
		`);
		this.setGreeting();
	}

	kpi(key, label, route, icon, note) {
		return `<a class="fd-card fd-kpi" href="/desk/${route}" data-route="${route}">
			<div><div class="fd-kpi-label">${label}</div><div class="fd-kpi-value" data-kpi="${key}">—</div><div class="fd-kpi-note" data-kpi-note="${key}">${note}</div></div>
			<span class="fd-kpi-icon">${this.icon(icon)}</span>
		</a>`;
	}

	createAction(doctype, label, icon) {
		if (!frappe.model.can_create(doctype)) return "";
		return `<button type="button" class="fd-action fd-action-primary" data-create-doctype="${doctype}">${this.icon(icon)}<span>${label}</span></button>`;
	}

	icon(name) {
		const paths = {
			search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
			calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>',
			clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
			check: '<path d="m5 12 4 4L19 6"></path>',
			receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2z"></path><path d="M8 8h8M8 12h8M8 16h4"></path>',
			patient: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0M12 14v5M9.5 16.5h5"></path>',
			flask: '<path d="M9 3h6M10 3v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3"></path><path d="M7 16h10"></path>',
			bed: '<path d="M3 7v14M3 17h18v4M3 12h18v5M7 12V8h5a3 3 0 0 1 3 3v1"></path><path d="M15 12V9h3a3 3 0 0 1 3 3"></path>',
		};
		return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.patient}</svg>`;
	}

	mountGlobalSearch() {
		this.page.page_head.find(".page-head-content").addClass("fd-page-header");
		this.page.page_head.find(".page-title").after(`
			<button type="button" class="fd-global-search" aria-label="${__("Open global search")}">
				${this.icon("search")}
				<span class="fd-search-placeholder">${__("Search or type a command")}</span>
			</button>
		`);
	}

	bindEvents() {
		this.page.page_head.on("click", ".fd-global-search", () => {
			const awesomeBar = frappe.app?.awesome_bar;
			if (!awesomeBar) {
				this.showStatus(__("Frappe global search is not available."));
				return;
			}
			awesomeBar.open();
		});
		this.page.main.on("click", ".fd-filter-apply", () => this.applyDates());
		this.page.main.on("click", ".fd-filter-reset", () => {
			this.setDefaultDates();
			this.loadDashboard();
		});
		this.page.main.on("click", ".fd-preset", (event) => this.applyPreset(event.currentTarget.dataset.preset));
		this.page.main.on("click", "[data-create-doctype]", (event) => {
			const doctype = event.currentTarget.dataset.createDoctype;
			if (doctype && frappe.model.can_create(doctype)) frappe.new_doc(doctype);
		});
		this.page.main.on("click", ".fd-operation", (event) => {
			frappe.set_route("Form", $(event.currentTarget).data("doctype"), $(event.currentTarget).data("name"));
		});
	}

	today() {
		return this.toIsoDate(new Date());
	}

	toIsoDate(date) {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}

	setDates(start, end) {
		this.startDate = start;
		this.endDate = end;
		this.page.main.find(".fd-start-date").val(start);
		this.page.main.find(".fd-end-date").val(end);
		this.page.main.find(".fd-preset").removeClass("active");
		this.page.main.find(".fd-range").text(`${frappe.datetime.str_to_user(start)} – ${frappe.datetime.str_to_user(end)}`);
	}

	setDefaultDates() {
		const today = this.today();
		this.setDates(today, today);
		this.page.main.find('[data-preset="Today"]').addClass("active");
	}

	applyDates() {
		const start = this.page.main.find(".fd-start-date").val();
		const end = this.page.main.find(".fd-end-date").val();
		if (!start || !end || start > end) {
			this.showStatus(__("Enter a valid date range with Start Date on or before End Date."));
			return;
		}
		this.setDates(start, end);
		this.loadDashboard();
	}

	applyPreset(preset) {
		const today = new Date(`${this.today()}T00:00:00`);
		let start = this.toIsoDate(today);
		let end = start;
		if (preset === "Yesterday") {
			today.setDate(today.getDate() - 1);
			start = end = this.toIsoDate(today);
		} else if (preset === "This Week") {
			today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
			start = this.toIsoDate(today);
		} else if (preset === "This Month") {
			start = `${start.slice(0, 7)}-01`;
		} else if (preset === "This Year") {
			start = `${today.getFullYear()}-01-01`;
		}
		this.setDates(start, end);
		this.page.main.find(`[data-preset="${preset}"]`).addClass("active");
		this.loadDashboard();
	}

	setGreeting() {
		const hour = new Date().getHours();
		const greeting = hour < 12 ? __("Good Morning") : hour < 18 ? __("Good Afternoon") : __("Good Evening");
		const name = frappe.boot?.user?.first_name || __("there");
		this.page.main.find(".fd-greeting-title").text(`${greeting}, ${name}!`);
	}

	async loadDashboard() {
		this.showStatus("");
		this.page.main.find(".fd-kpi-value").text("…");
		this.page.main.find(".fd-operation-list").html(`<div class="fd-message">${__("Loading...")}</div>`);
		try {
			const data = await frappe.xcall("qdynamics_hms_dashboards.api.frontdesk_dashboard.get_dashboard", {
				start_date: this.startDate,
				end_date: this.endDate,
			});
			this.renderDashboard(data);
		} catch (error) {
			this.showStatus(error?.message || __("Unable to load front desk data."));
			this.page.main.find(".fd-kpi-value").text("—");
			this.page.main.find(".fd-operation-list").html(`<div class="fd-message">${__("Front desk operational data could not be loaded. Check access and try again.")}</div>`);
		}
	}

	renderDashboard(data) {
		this.page.main.find(".fd-range").text(
			`${frappe.datetime.str_to_user(data.dateRange.startDate)} – ${frappe.datetime.str_to_user(data.dateRange.endDate)}`
		);
		for (const [key, metric] of Object.entries(data.kpis || {})) {
			const displayValue =
				key === "bills" ? format_currency(Number(metric.value) || 0) : metric.value ?? "—";
			this.page.main.find(`[data-kpi="${key}"]`).text(metric.restricted ? __("No access") : displayValue);
			if (metric.restricted) {
				this.page.main.find(`[data-kpi-note="${key}"]`).text(__("Permission required"));
			}
		}
		this.renderOperations(data.operations || {});
	}

	renderOperations(operations) {
		this.renderOperationList("pendingAppointments", operations.pendingAppointments, "Patient Appointment", (record) => ({
			title: record.patient_name || __("Patient not listed"),
			subtitle: [frappe.datetime.str_to_user(record.appointment_date), record.appointment_time].filter(Boolean).join(" · "),
			detail: __("Encounter not created"),
		}), __("No pending appointments in this date range."));
		this.renderOperationList("labTests", operations.labTests, "Lab Test", (record) => ({
			title: record.lab_test_name || __("Laboratory Test"),
			subtitle: record.patient_name || __("Patient not listed"),
			detail: record.expected_result_date
				? __("Expected {0}", [frappe.datetime.str_to_user(record.expected_result_date)])
				: __("Result date not set"),
		}));
		this.renderOperationList("inpatients", operations.inpatients, "Inpatient Record", (record) => ({
			title: record.patient_name || record.name,
			subtitle: record.medical_department || __("Department not listed"),
			detail: record.expected_discharge
				? __("Expected discharge {0}", [frappe.datetime.str_to_user(record.expected_discharge)])
				: __("Scheduled {0}", [frappe.datetime.str_to_user(record.scheduled_date)]),
		}));
	}

	renderOperationList(key, operation, doctype, getContent, emptyMessage = __("No records need follow-up.")) {
		const $list = this.page.main.find(`[data-operation-list="${key}"]`).empty();
		const count = operation?.count;
		this.page.main.find(`[data-operation-count="${key}"]`).text(
			count?.restricted ? __("No access") : count?.value ?? "—"
		);
		if (!operation || operation.items === null) {
			$list.html(`<div class="fd-message">${__("You do not have permission to view these records.")}</div>`);
			return;
		}
		if (!operation.items.length) {
			$list.html(`<div class="fd-message">${emptyMessage}</div>`);
			return;
		}

		for (const record of operation.items) {
			const content = getContent(record);
			const status = frappe.utils.escape_html(record.status || __("Open"));
			const statusClass = status.toLowerCase().replace(/[^a-z]+/g, "-");
			$list.append(`
				<button type="button" class="fd-operation" data-doctype="${doctype}" data-name="${frappe.utils.escape_html(record.name)}">
					<span class="fd-operation-copy"><strong>${frappe.utils.escape_html(content.title)}</strong><small>${frappe.utils.escape_html(content.subtitle)} · ${frappe.utils.escape_html(content.detail)}</small></span>
					<span class="fd-status ${statusClass}">${status}</span>
				</button>
			`);
		}
	}

	showStatus(message) {
		this.page.main.find(".fd-status-message").text(message).prop("hidden", !message);
	}
}
