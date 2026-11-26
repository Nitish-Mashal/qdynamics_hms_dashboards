frappe.pages["nursing-station-dashboard"].on_page_load = function (wrapper) {
	new NursingStationDashboard(wrapper);
};

class NursingStationDashboard {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Nursing Station Dashboard"),
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
		if (document.getElementById("nursing-station-dashboard-styles")) return;
		const style = document.createElement("style");
		style.id = "nursing-station-dashboard-styles";
		style.textContent = `
			.nursing-dashboard { --ns-ink:#26243a; --ns-muted:#77758a; --ns-line:#ecebf2; color:var(--ns-ink); padding:22px 26px 36px; background:#f7f7fb; min-height:calc(100vh - 120px); }
			.nursing-dashboard * { box-sizing:border-box; }
			.page-head .ns-page-header { display:grid; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); gap:14px; padding-top:0!important; padding-bottom:0!important; align-items:center; }
			.ns-page-header .page-title { display:none; }
			.ns-global-search { display:flex; align-items:center; grid-column:2; justify-self:center; width:100%; min-width:0; max-width:460px; height:38px; gap:9px; padding:0 13px; border:1px solid var(--ns-line); border-radius:12px; background:#fff; color:#8d8a9c; cursor:pointer; font:inherit; text-align:left; }
			.ns-page-header .standard-items-section { grid-column:3; justify-self:end; }
			.ns-global-search svg { flex:none; }
			.ns-search-placeholder { flex:1; font-size:13px; }
			.ns-greeting { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:21px; }
			.ns-greeting h1 { margin:0 0 7px; font-size:25px; letter-spacing:-.8px; font-weight:750; }
			.ns-greeting p { margin:0; color:var(--ns-muted); font-size:13px; }
			.ns-range { color:#716e81; font-size:12px; font-weight:650; white-space:nowrap; }
			.ns-filter-card,.ns-card { min-width:0; border:1px solid #eeedf3; border-radius:15px; background:#fff; box-shadow:0 3px 14px #27233d08; }
			.ns-filter-card { margin-bottom:22px; padding:15px 17px; }
			.ns-filter-row { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
			.ns-filter-row label { display:grid; gap:5px; color:var(--ns-muted); font-size:11px; font-weight:650; }
			.ns-filter-row input { height:36px; min-width:145px; padding:0 9px; border:1px solid var(--ns-line); border-radius:8px; color:var(--ns-ink); font-size:12px; }
			.ns-filter-button { height:36px; padding:0 14px; border:1px solid var(--ns-line); border-radius:8px; color:#56536b; background:#fff; font-size:12px; font-weight:650; cursor:pointer; }
			.ns-filter-apply { border-color:transparent; color:#fff; background:linear-gradient(105deg,#453D89,#C8499A); }
			.ns-presets { display:flex; flex-wrap:wrap; gap:6px; margin-left:auto; }
			.ns-preset { height:30px; padding:0 10px; border:1px solid transparent; border-radius:7px; color:var(--ns-muted); background:#f7f6fa; font-size:11px; cursor:pointer; }
			.ns-preset:hover,.ns-preset.active { border-color:#ddd7f0; color:#51448f; background:#f2effa; }
			.ns-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:22px; }
			.ns-kpi { --ns-shadow:rgba(69,61,137,.12); display:flex; align-items:flex-start; justify-content:space-between; min-height:122px; padding:18px; border:1px solid transparent; background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(69,61,137,.42),rgba(200,73,154,.26)) border-box; box-shadow:0 5px 16px var(--ns-shadow); color:inherit; text-decoration:none!important; transition:transform .16s,box-shadow .16s; }
			.ns-kpi:nth-child(even) { --ns-shadow:rgba(200,73,154,.12); background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(200,73,154,.26),rgba(69,61,137,.42)) border-box; }
			.ns-kpi:hover { transform:translateY(-2px); box-shadow:0 9px 22px var(--ns-shadow); }
			.ns-kpi-label { margin-bottom:15px; color:var(--ns-muted); font-size:12px; font-weight:600; }
			.ns-kpi-value { font-size:27px; line-height:1; letter-spacing:-.8px; font-weight:750; }
			.ns-kpi-note { margin-top:8px; color:#9290a0; font-size:10px; }
			.ns-kpi-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; color:#594e98; background:#f1effa; }
			.ns-kpi:nth-child(2) .ns-kpi-icon { color:#ba4f8e; background:#fbf0f6; }
			.ns-kpi:nth-child(3) .ns-kpi-icon { color:#3e9a8b; background:#edf8f5; }
			.ns-kpi:nth-child(4) .ns-kpi-icon { color:#d28742; background:#fff5e9; }
			.ns-operations { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; align-items:stretch; }
			.ns-card { padding:19px; }
			.ns-operations > .ns-card { height:330px; min-height:330px; }
			.ns-operation-panel { display:flex; flex-direction:column; }
			.ns-section-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:15px; }
			.ns-section-heading h2 { margin:0; font-size:14px; font-weight:730; }
			.ns-section-heading span { color:#8a8799; font-size:10px; }
			.ns-operation-count { color:#716e81; font-size:11px; font-weight:700; }
			.ns-list { display:grid; grid-auto-rows:min-content; flex:1; min-height:0; gap:8px; align-content:start; overflow-y:auto; padding-right:4px; }
			.ns-item { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px 12px; min-height:62px; padding:10px 12px; border:1px solid #f0eef4; border-radius:10px; background:#fff; color:inherit; text-align:left; cursor:pointer; }
			.ns-item:hover { border-color:#d9d2ec; background:#fcfbfe; }
			.ns-item-copy { min-width:0; }
			.ns-item-copy strong { display:block; overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
			.ns-item-copy small { display:block; margin-top:4px; overflow:hidden; color:#858294; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
			.ns-status { justify-self:end; padding:5px 9px; border-radius:999px; color:#695b9d; background:#f2effa; font-size:10px; font-weight:650; white-space:nowrap; }
			.ns-status.admitted,.ns-status.approved { color:#348b74; background:#edf8f4; }
			.ns-status.discharge-scheduled,.ns-status.completed { color:#a16c2e; background:#fff5e9; }
			.ns-status.draft,.ns-status.admission-scheduled { color:#695b9d; background:#f2effa; }
			.ns-message { display:grid; place-items:center; min-height:120px; color:#8a8799; font-size:12px; text-align:center; }
			.ns-status-message { margin:0 0 14px; color:#bd547a; font-size:12px; }
			.ns-quick-links { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-content:start; gap:10px; }
			.ns-quick-link { display:flex; align-items:center; min-width:0; gap:9px; min-height:54px; padding:10px 12px; border:1px solid transparent; border-radius:10px; color:#51448f; background:linear-gradient(105deg,rgba(69,61,137,.09),rgba(200,73,154,.10)) padding-box,linear-gradient(105deg,rgba(69,61,137,.30),rgba(200,73,154,.32)) border-box; box-shadow:0 3px 10px rgba(69,61,137,.08); font-size:11px; font-weight:650; text-align:left; text-decoration:none!important; transition:transform .16s,box-shadow .16s; }
			.ns-quick-link:hover { transform:translateY(-1px); color:#453D89; box-shadow:0 6px 15px rgba(119,70,153,.15); }
			.ns-quick-link svg { flex:0 0 18px; }
			.ns-quick-link span { min-width:0; overflow-wrap:anywhere; }
			@media(max-width:980px) { .ns-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } }
			@media(max-width:650px) {
				.nursing-dashboard { padding:15px 12px 26px; }
				.page-head .ns-page-header { display:grid!important; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); }
				.ns-greeting { align-items:flex-start; flex-direction:column; gap:9px; }
				.ns-greeting h1 { font-size:21px; }
				.ns-filter-row { align-items:stretch; }
				.ns-filter-row label { flex:1 1 calc(50% - 8px); }
				.ns-filter-row input { width:100%; min-width:0; }
				.ns-filter-row>.ns-filter-button { flex:1; }
				.ns-presets { flex-basis:100%; margin-left:0; }
				.ns-kpis { gap:9px; }
				.ns-kpi { min-height:112px; padding:13px; }
				.ns-kpi-label { font-size:11px; }
				.ns-kpi-value { font-size:23px; }
				.ns-kpi-icon { width:33px; height:33px; }
				.ns-operations { grid-template-columns:1fr; gap:11px; }
				.ns-card { padding:15px; }
			}
			@media(max-width:380px) { .ns-kpis,.ns-quick-links { grid-template-columns:1fr; } }
		`;
		document.head.appendChild(style);
	}

	renderShell() {
		this.page.main.addClass("nursing-dashboard-host").html(`
			<div class="nursing-dashboard">
				<div class="ns-greeting">
					<div><h1 class="ns-greeting-title"></h1><p>${__("Your nursing station overview for the selected date range.")}</p></div>
					<div class="ns-range"></div>
				</div>
				<div class="ns-status-message" role="alert" hidden></div>
				<section class="ns-filter-card" aria-label="${__("Dashboard date filters")}">
					<div class="ns-filter-row">
						<label>${__("Start Date")}<input class="ns-start-date" type="date"></label>
						<label>${__("End Date")}<input class="ns-end-date" type="date"></label>
						<button type="button" class="ns-filter-button ns-filter-apply">${__("Apply Filter")}</button>
						<button type="button" class="ns-filter-button ns-filter-reset">${__("Reset")}</button>
						<div class="ns-presets">
							${["Today", "Yesterday", "This Week", "This Month", "This Year"].map((preset) => `<button type="button" class="ns-preset" data-preset="${preset}">${__(preset)}</button>`).join("")}
						</div>
					</div>
				</section>
				<section class="ns-kpis" aria-label="${__("Nursing station summary")}">
					${this.kpi("wards", __("Wards"), "healthcare-service-unit", "bed", __("Inpatient service units"))}
					${this.kpi("nursingTasks", __("Nursing Tasks"), "nursing-task", "check", __("Tasks scheduled in range"))}
					${this.kpi("patients", __("Patients"), "patient", "patient", __("Registered in selected range"))}
					${this.kpi("checklists", __("Admission / Discharge"), "nursing-checklist-template", "clipboard", __("Enabled checklist templates"))}
				</section>
				<div class="ns-operations">
					${this.panel("inpatients", __("Inpatient Activity"), __("Admission activity in range"))}
					${this.panel("doctorOrders", __("Doctors' Orders"), __("Patient encounters by practitioner"))}
					${this.panel("labReports", __("Lab Reports"), __("Tests requiring follow-up"))}
					<section class="ns-card">
						<div class="ns-section-heading"><h2>${__("Quick Links")}</h2><span>${__("Common nursing tasks")}</span></div>
						<div class="ns-quick-links">
							${this.quickLink("hr-setup", __("HRMS"), "briefcase")}
							${this.quickLink("inpatient-record", __("Inpatient Records"), "bed")}
							${this.quickLink("patient", __("Patient Directory"), "patient")}
							${this.quickLink("healthcare-service-unit", __("Ward Directory"), "clipboard")}
						</div>
					</section>
				</div>
			</div>
		`);
		this.setGreeting();
	}

	kpi(key, label, route, icon, note) {
		return `<a class="ns-card ns-kpi" href="/desk/${route}" data-route="${route}">
			<div><div class="ns-kpi-label">${label}</div><div class="ns-kpi-value" data-kpi="${key}">—</div><div class="ns-kpi-note" data-kpi-note="${key}">${note}</div></div>
			<span class="ns-kpi-icon">${this.icon(icon)}</span>
		</a>`;
	}

	panel(key, title, description) {
		return `<section class="ns-card ns-operation-panel">
			<div class="ns-section-heading"><h2>${title}</h2><span class="ns-operation-count" data-count="${key}">—</span></div>
			<div class="ns-list" data-list="${key}" aria-label="${description}"><div class="ns-message">${__("Loading...")}</div></div>
		</section>`;
	}

	quickLink(route, label, icon) {
		return `<a class="ns-quick-link" href="/desk/${route}" data-route="${route}">${this.icon(icon)}<span>${label}</span></a>`;
	}

	icon(name) {
		const paths = {
			search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
			bed: '<path d="M3 7v14M3 17h18v4M3 12h18v5M7 12V8h5a3 3 0 0 1 3 3v1"></path><path d="M15 12V9h3a3 3 0 0 1 3 3"></path>',
			check: '<path d="m5 12 4 4L19 6"></path>',
			briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"></path>',
			patient: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0M12 14v5M9.5 16.5h5"></path>',
			clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"></path>',
		};
		return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.patient}</svg>`;
	}

	mountGlobalSearch() {
		this.page.page_head.find(".page-head-content").addClass("ns-page-header");
		this.page.page_head.find(".page-title").after(`
			<button type="button" class="ns-global-search" aria-label="${__("Open global search")}">
				${this.icon("search")}
				<span class="ns-search-placeholder">${__("Search or type a command")}</span>
			</button>
		`);
	}

	bindEvents() {
		this.page.page_head.on("click", ".ns-global-search", () => {
			const awesomeBar = frappe.app?.awesome_bar;
			if (!awesomeBar) {
				this.showStatus(__("Frappe global search is not available."));
				return;
			}
			awesomeBar.open();
		});
		this.page.main.on("click", ".ns-filter-apply", () => this.applyDates());
		this.page.main.on("click", ".ns-filter-reset", () => {
			this.setDefaultDates();
			this.loadDashboard();
		});
		this.page.main.on("click", ".ns-preset", (event) => this.applyPreset(event.currentTarget.dataset.preset));
		this.page.main.on("click", ".ns-item", (event) => {
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
		this.page.main.find(".ns-start-date").val(start);
		this.page.main.find(".ns-end-date").val(end);
		this.page.main.find(".ns-preset").removeClass("active");
		this.page.main.find(".ns-range").text(`${frappe.datetime.str_to_user(start)} – ${frappe.datetime.str_to_user(end)}`);
	}

	setDefaultDates() {
		const today = this.today();
		this.setDates(today, today);
		this.page.main.find('[data-preset="Today"]').addClass("active");
	}

	applyDates() {
		const start = this.page.main.find(".ns-start-date").val();
		const end = this.page.main.find(".ns-end-date").val();
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
		this.page.main.find(".ns-greeting-title").text(`${greeting}, ${name}!`);
	}

	async loadDashboard() {
		this.showStatus("");
		this.page.main.find(".ns-kpi-value").text("…");
		this.page.main.find(".ns-list").each((_, element) => {
			$(element).html(`<div class="ns-message">${__("Loading...")}</div>`);
		});
		try {
			const data = await frappe.xcall("qdynamics_hms_dashboards.api.nursing_dashboard.get_dashboard", {
				start_date: this.startDate,
				end_date: this.endDate,
			});
			this.renderDashboard(data);
		} catch (error) {
			this.showStatus(error?.message || __("Unable to load nursing station data."));
			this.page.main.find(".ns-kpi-value").text("—");
			this.page.main.find(".ns-list").html(`<div class="ns-message">${__("Nursing station data could not be loaded. Check access and try again.")}</div>`);
		}
	}

	renderDashboard(data) {
		this.page.main.find(".ns-range").text(
			`${frappe.datetime.str_to_user(data.dateRange.startDate)} – ${frappe.datetime.str_to_user(data.dateRange.endDate)}`
		);
		for (const [key, metric] of Object.entries(data.kpis || {})) {
			this.page.main.find(`[data-kpi="${key}"]`).text(metric.restricted ? __("No access") : metric.value ?? "—");
			if (metric.restricted) {
				this.page.main.find(`[data-kpi-note="${key}"]`).text(__("Read permission required"));
			}
		}
		this.renderOperationList("inpatients", data.operations?.inpatients, "Inpatient Record", (record) => ({
			title: record.patient_name || record.name,
			subtitle: record.medical_department || __("Department not listed"),
			detail: record.expected_discharge
				? __("Expected discharge {0}", [frappe.datetime.str_to_user(record.expected_discharge)])
				: __("Scheduled {0}", [frappe.datetime.str_to_user(record.scheduled_date)]),
		}), __("No inpatient activity in this date range."));
		this.renderOperationList("doctorOrders", data.operations?.doctorOrders, "Patient Encounter", (record) => ({
			title: record.patient_name || __("Patient not listed"),
			subtitle: record.practitioner_name || __("Practitioner not listed"),
			detail: [frappe.datetime.str_to_user(record.encounter_date), record.encounter_time].filter(Boolean).join(" · "),
		}), __("No patient encounters in this date range."));
		this.renderOperationList("labReports", data.operations?.labReports, "Lab Test", (record) => ({
			title: record.lab_test_name || __("Laboratory Test"),
			subtitle: record.patient_name || __("Patient not listed"),
			detail: record.expected_result_date
				? __("Expected {0}", [frappe.datetime.str_to_user(record.expected_result_date)])
				: __("Result date not set"),
		}), __("No lab reports need follow-up in this date range."));
	}

	renderOperationList(key, operation, doctype, getContent, emptyMessage) {
		const $list = this.page.main.find(`[data-list="${key}"]`).empty();
		const count = operation?.count;
		this.page.main.find(`[data-count="${key}"]`).text(count?.restricted ? __("No access") : count?.value ?? "—");
		if (!operation || operation.items === null) {
			$list.html(`<div class="ns-message">${__("You do not have permission to view these records.")}</div>`);
			return;
		}
		if (!operation.items.length) {
			$list.html(`<div class="ns-message">${emptyMessage}</div>`);
			return;
		}

		for (const record of operation.items) {
			const content = getContent(record);
			const status = frappe.utils.escape_html(record.status || __("Open"));
			const statusClass = status.toLowerCase().replace(/[^a-z]+/g, "-");
			$list.append(`
				<button type="button" class="ns-item" data-doctype="${doctype}" data-name="${frappe.utils.escape_html(record.name)}">
					<span class="ns-item-copy"><strong>${frappe.utils.escape_html(content.title)}</strong><small>${frappe.utils.escape_html(content.subtitle)} · ${frappe.utils.escape_html(content.detail)}</small></span>
					<span class="ns-status ${statusClass}">${status}</span>
				</button>
			`);
		}
	}

	showStatus(message) {
		this.page.main.find(".ns-status-message").text(message).prop("hidden", !message);
	}
}
