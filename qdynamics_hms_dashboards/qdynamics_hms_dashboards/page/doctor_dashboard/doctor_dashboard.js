frappe.pages["doctor-dashboard"].on_page_load = function (wrapper) {
	new DoctorDashboard(wrapper);
};

class DoctorDashboard {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Doctor Dashboard"),
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
		if (document.getElementById("doctor-dashboard-styles")) return;
		const style = document.createElement("style");
		style.id = "doctor-dashboard-styles";
		style.textContent = `
			.doctor-dashboard { --doctor-ink:#26243a; --doctor-muted:#77758a; --doctor-line:#ecebf2; color:var(--doctor-ink); padding:22px 26px 36px; background:#f7f7fb; min-height:calc(100vh - 120px); }
			.doctor-dashboard * { box-sizing:border-box; }
			.page-head .doctor-page-header { display:grid; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); gap:14px; padding-block:0!important; align-items:center; }
			.doctor-page-header .page-title { display:none; }
			.doctor-global-search { display:flex; align-items:center; grid-column:2; justify-self:center; width:100%; min-width:0; max-width:460px; height:38px; gap:9px; padding:0 13px; border:1px solid var(--doctor-line); border-radius:12px; background:#fff; color:#8d8a9c; cursor:pointer; font:inherit; text-align:left; }
			.doctor-page-header .standard-items-section { grid-column:3; justify-self:end; }
			.doctor-global-search svg { flex:none; }
			.doctor-search-placeholder { flex:1; font-size:13px; }
			.doctor-intro { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:21px; }
			.doctor-intro h1 { margin:0 0 7px; font-size:25px; letter-spacing:-.8px; font-weight:750; }
			.doctor-intro p { margin:0; color:var(--doctor-muted); font-size:13px; }
			.doctor-range { color:#716e81; font-size:12px; font-weight:650; white-space:nowrap; }
			.doctor-filter-card,.doctor-card { min-width:0; border:1px solid #eeedf3; border-radius:15px; background:#fff; box-shadow:0 3px 14px #27233d08; }
			.doctor-filter-card { margin-bottom:22px; padding:15px 17px; }
			.doctor-filter-row { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
			.doctor-filter-row label { display:grid; gap:5px; color:#77758a; font-size:11px; font-weight:650; }
			.doctor-filter-row input { height:36px; min-width:145px; padding:0 9px; border:1px solid var(--doctor-line); border-radius:8px; color:var(--doctor-ink); font-size:12px; }
			.doctor-filter-button { height:36px; padding:0 14px; border:1px solid var(--doctor-line); border-radius:8px; color:#56536b; background:#fff; font-size:12px; font-weight:650; cursor:pointer; }
			.doctor-filter-apply { border-color:transparent; color:#fff; background:linear-gradient(105deg,#453D89,#C8499A); }
			.doctor-presets { display:flex; flex-wrap:wrap; gap:6px; margin-left:auto; }
			.doctor-preset { height:30px; padding:0 10px; border:1px solid transparent; border-radius:7px; color:#77758a; background:#f7f6fa; font-size:11px; cursor:pointer; }
			.doctor-preset:hover,.doctor-preset.active { border-color:#ddd7f0; color:#51448f; background:#f2effa; }
			.doctor-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:22px; }
			.doctor-kpi { --doctor-shadow:rgba(69,61,137,.12); display:flex; align-items:flex-start; justify-content:space-between; min-height:122px; padding:18px; border:1px solid transparent; background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(69,61,137,.42),rgba(200,73,154,.26)) border-box; box-shadow:0 5px 16px var(--doctor-shadow); color:inherit; text-decoration:none!important; transition:transform .16s,box-shadow .16s; }
			.doctor-kpi:nth-child(even) { --doctor-shadow:rgba(200,73,154,.12); background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(200,73,154,.26),rgba(69,61,137,.42)) border-box; }
			.doctor-kpi:hover { transform:translateY(-2px); box-shadow:0 9px 22px var(--doctor-shadow); }
			.doctor-kpi-label { margin-bottom:15px; color:var(--doctor-muted); font-size:12px; font-weight:600; }
			.doctor-kpi-value { font-size:27px; line-height:1; letter-spacing:-.8px; font-weight:750; }
			.doctor-kpi-note { margin-top:8px; color:#9290a0; font-size:10px; }
			.doctor-kpi-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; color:#594e98; background:#f1effa; }
			.doctor-kpi:nth-child(2) .doctor-kpi-icon { color:#ba4f8e; background:#fbf0f6; }
			.doctor-kpi:nth-child(3) .doctor-kpi-icon { color:#3e9a8b; background:#edf8f5; }
			.doctor-kpi:nth-child(4) .doctor-kpi-icon { color:#d28742; background:#fff5e9; }
			.doctor-panels { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
			.doctor-card { padding:19px; }
			.doctor-panel-heading { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:15px; }
			.doctor-panel-heading h2 { margin:0; font-size:14px; font-weight:730; }
			.doctor-panel-count { color:#8a8799; font-size:11px; font-weight:650; }
			.doctor-panels > .doctor-card { height:330px; min-height:330px; }
			.doctor-panels > .doctor-card:not(:last-child) { display:flex; flex-direction:column; }
			.doctor-list { display:grid; grid-auto-rows:min-content; flex:1; min-height:0; gap:8px; align-content:start; overflow-y:auto; padding-right:4px; }
			.doctor-item { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px 12px; min-height:62px; padding:10px 12px; border:1px solid #f0eef4; border-radius:10px; background:#fff; color:inherit; text-align:left; cursor:pointer; }
			.doctor-item:hover { border-color:#d9d2ec; background:#fcfbfe; }
			.doctor-item-copy { min-width:0; }
			.doctor-item-copy strong { display:block; overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
			.doctor-item-copy small { display:block; margin-top:4px; overflow:hidden; color:#858294; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
			.doctor-status { justify-self:end; padding:5px 9px; border-radius:999px; color:#695b9d; background:#f2effa; font-size:10px; font-weight:650; white-space:nowrap; }
			.doctor-status.completed,.doctor-status.approved,.doctor-status.checked-in { color:#348b74; background:#edf8f4; }
			.doctor-status.cancelled,.doctor-status.rejected,.doctor-status.no-show { color:#bd547a; background:#fcf0f5; }
			.doctor-empty,.doctor-loading { display:grid; place-items:center; min-height:130px; color:#8a8799; font-size:12px; text-align:center; }
			.doctor-actions { display:grid; grid-auto-rows:min-content; gap:9px; align-content:start; }
			.doctor-action { display:flex; align-items:center; width:100%; gap:11px; min-height:56px; padding:10px 12px; border:1px solid transparent; border-radius:10px; color:#51448f; background:linear-gradient(105deg,rgba(69,61,137,.09),rgba(200,73,154,.10)) padding-box,linear-gradient(105deg,rgba(69,61,137,.30),rgba(200,73,154,.32)) border-box; box-shadow:0 3px 10px rgba(69,61,137,.08); font-family:inherit; text-align:left; text-decoration:none!important; cursor:pointer; transition:transform .16s,box-shadow .16s; }
			.doctor-action:hover { transform:translateY(-1px); color:#453D89; box-shadow:0 6px 15px rgba(119,70,153,.15); }
			.doctor-action:hover .doctor-action-copy strong { color:#453D89; }
			.doctor-action:focus-visible { outline:2px solid #685ba5; outline-offset:2px; }
			.doctor-action-mark { display:grid; place-items:center; flex:0 0 30px; height:30px; border-radius:9px; color:#51448f; background:linear-gradient(105deg,rgba(69,61,137,.09),rgba(200,73,154,.10)); }
			.doctor-action-mark svg { width:16px; height:16px; }
			.doctor-action-copy { flex:1; min-width:0; }
			.doctor-action-copy strong { display:block; margin-bottom:3px; font-size:11px; }
			.doctor-action-copy small { display:block; overflow:hidden; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
			.doctor-action-cta { color:#51448f; font-size:10px; font-weight:700; white-space:nowrap; }
			.doctor-profile { margin-top:4px!important; }
			.doctor-status-message { margin:0 0 14px; color:#bd547a; font-size:12px; }
			@media(max-width:980px) { .doctor-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } .doctor-presets { margin-left:0; } }
			@media(max-width:700px) { .doctor-dashboard { padding:15px 12px 26px; } .page-head .doctor-page-header { display:grid!important; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); } .doctor-intro { align-items:flex-start; flex-direction:column; gap:9px; } .doctor-intro h1 { font-size:21px; } .doctor-filter-row { align-items:stretch; } .doctor-filter-row label { flex:1 1 calc(50% - 8px); } .doctor-filter-row input { width:100%; min-width:0; } .doctor-filter-row>.doctor-filter-button { flex:1; } .doctor-presets { flex-basis:100%; } .doctor-kpis { gap:9px; } .doctor-kpi { min-height:112px; padding:13px; } .doctor-kpi-label { font-size:11px; } .doctor-kpi-value { font-size:23px; } .doctor-kpi-icon { width:33px; height:33px; } .doctor-panels { grid-template-columns:1fr; gap:11px; } .doctor-card { padding:15px; } }
			@media(max-width:380px) { .doctor-kpis { grid-template-columns:1fr; } }
		`;
		document.head.appendChild(style);
	}

	renderShell() {
		this.page.main.addClass("doctor-dashboard-host").html(`
			<div class="doctor-dashboard">
				<div class="doctor-intro">
					<div><h1 class="doctor-greeting"></h1><p class="doctor-profile">${__("Your clinical workspace")}</p></div>
					<div class="doctor-range"></div>
				</div>
				<div class="doctor-status-message" role="alert" hidden></div>
				<section class="doctor-filter-card" aria-label="${__("Dashboard date filters")}">
					<div class="doctor-filter-row">
						<label>${__("Start Date")}<input class="doctor-start-date" type="date"></label>
						<label>${__("End Date")}<input class="doctor-end-date" type="date"></label>
						<button type="button" class="doctor-filter-button doctor-filter-apply">${__("Apply Filter")}</button>
						<button type="button" class="doctor-filter-button doctor-filter-reset">${__("Reset")}</button>
						<div class="doctor-presets">
							${["Today", "Yesterday", "This Week", "This Month", "This Year"].map((preset) => `<button type="button" class="doctor-preset" data-preset="${preset}">${__(preset)}</button>`).join("")}
						</div>
					</div>
				</section>
				<section class="doctor-kpis" aria-label="${__("My clinical summary")}">
					${this.kpi("appointments", __("My Appointments"), "patient-appointment", "calendar")}
					${this.kpi("encounters", __("Patient Encounters"), "patient-encounter", "patient")}
					${this.kpi("labTests", __("Lab Test Results"), "lab-test", "flask")}
					${this.kpi("patientDirectory", __("Patient Directory"), "patient", "patient", __("Created today"))}
				</section>
				<div class="doctor-panels">
					${this.panel("appointments", __("My Appointments"))}
					${this.panel("encounters", __("My Patient Encounters"))}
					${this.panel("labTests", __("Lab Test Results"))}
					<section class="doctor-card">
						<div class="doctor-panel-heading"><h2>${__("Quick Actions")}</h2><span class="doctor-panel-count">${__("Common clinical tasks")}</span></div>
						<div class="doctor-actions">
							${this.createAction("Patient Encounter", __("New Encounter"), "patient", __("Create a patient encounter"))}
							${this.createAction("Patient Appointment", __("New Appointment"), "calendar", __("Schedule a patient appointment"))}
							${this.createAction("Patient", __("Register Patient"), "patient", __("Add a new patient record"))}
							${this.actionLink("healthcare/patient_history", __("Patient History"), "patient", __("View patient history"))}
						</div>
					</section>
				</div>
			</div>
		`);
		this.setGreeting();
	}

	kpi(key, label, route, icon, note = __("Selected date range")) {
		return `<a class="doctor-card doctor-kpi" href="/desk/${route}" data-route="${route}">
			<div><div class="doctor-kpi-label">${label}</div><div class="doctor-kpi-value" data-kpi="${key}">—</div><div class="doctor-kpi-note">${note}</div></div>
			<span class="doctor-kpi-icon">${this.icon(icon)}</span>
		</a>`;
	}

	panel(key, title) {
		return `<section class="doctor-card">
			<div class="doctor-panel-heading"><h2>${title}</h2><span class="doctor-panel-count" data-count="${key}">—</span></div>
			<div class="doctor-list" data-list="${key}"><div class="doctor-loading">${__("Loading...")}</div></div>
		</section>`;
	}

	createAction(doctype, label, icon, description) {
		if (!frappe.model.can_create(doctype)) return "";
		return `<button type="button" class="doctor-action" data-create-doctype="${doctype}">
			<span class="doctor-action-mark">${this.icon(icon)}</span>
			<span class="doctor-action-copy"><strong>${label}</strong><small>${description}</small></span>
			<span class="doctor-action-cta">${__("Open")}</span>
		</button>`;
	}

	actionLink(route, label, icon, description) {
		return `<a class="doctor-action" href="/desk/${route}" data-route="${route}">
			<span class="doctor-action-mark">${this.icon(icon)}</span>
			<span class="doctor-action-copy"><strong>${label}</strong><small>${description}</small></span>
			<span class="doctor-action-cta">${__("Open")}</span>
		</a>`;
	}

	icon(name) {
		const paths = {
			search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
			calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>',
			clock: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
			patient: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0M12 14v5M9.5 16.5h5"></path>',
			flask: '<path d="M9 3h6M10 3v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3"></path><path d="M7 16h10"></path>',
		};
		return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.patient}</svg>`;
	}

	mountGlobalSearch() {
		this.page.page_head.find(".page-head-content").addClass("doctor-page-header");
		this.page.page_head.find(".page-title").after(`
			<button type="button" class="doctor-global-search" aria-label="${__("Open global search")}">
				${this.icon("search")}
				<span class="doctor-search-placeholder">${__("Search or type a command")}</span>
			</button>
		`);
	}

	bindEvents() {
		this.page.page_head.on("click", ".doctor-global-search", () => {
			const awesomeBar = frappe.app?.awesome_bar;
			if (!awesomeBar) {
				this.showStatus(__("Frappe global search is not available."));
				return;
			}
			awesomeBar.open();
		});
		this.page.main.on("click", ".doctor-filter-apply", () => this.applyDates());
		this.page.main.on("click", ".doctor-filter-reset", () => {
			this.setDefaultDates();
			this.loadDashboard();
		});
		this.page.main.on("click", ".doctor-preset", (event) => this.applyPreset(event.currentTarget.dataset.preset));
		this.page.main.on("click", "[data-create-doctype]", (event) => {
			const doctype = event.currentTarget.dataset.createDoctype;
			if (doctype && frappe.model.can_create(doctype)) {
				const options =
					this.practitioner && ["Patient Encounter", "Patient Appointment"].includes(doctype)
						? { practitioner: this.practitioner }
						: undefined;
				frappe.new_doc(doctype, options);
			}
		});
		this.page.main.on("click", ".doctor-item", (event) => {
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
		this.page.main.find(".doctor-start-date").val(start);
		this.page.main.find(".doctor-end-date").val(end);
		this.page.main.find(".doctor-preset").removeClass("active");
		this.page.main.find(".doctor-range").text(`${frappe.datetime.str_to_user(start)} – ${frappe.datetime.str_to_user(end)}`);
	}

	setDefaultDates() {
		const today = this.today();
		this.setDates(`${today.slice(0, 7)}-01`, today);
		this.page.main.find('[data-preset="This Month"]').addClass("active");
	}

	applyDates() {
		const start = this.page.main.find(".doctor-start-date").val();
		const end = this.page.main.find(".doctor-end-date").val();
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
		this.page.main.find(".doctor-greeting").text(`${greeting}, ${name}!`);
	}

	async loadDashboard() {
		this.showStatus("");
		this.page.main.find(".doctor-kpi-value").text("…");
		this.page.main.find(".doctor-list").each((_, element) => {
			$(element).html(`<div class="doctor-loading">${__("Loading...")}</div>`);
		});
		try {
			const data = await frappe.xcall("qdynamics_hms_dashboards.api.doctor_dashboard.get_dashboard", {
				start_date: this.startDate,
				end_date: this.endDate,
			});
			this.renderDashboard(data);
		} catch (error) {
			this.showStatus(error?.message || __("Unable to load Doctor Dashboard data."));
			this.page.main.find(".doctor-kpi-value").text("—");
			this.page.main.find(".doctor-list").html(`<div class="doctor-empty">${__("Doctor dashboard data could not be loaded. Check your Practitioner profile and access, then try again.")}</div>`);
		}
	}

	renderDashboard(data) {
		this.page.main.find(".doctor-range").text(
			`${frappe.datetime.str_to_user(data.dateRange.startDate)} – ${frappe.datetime.str_to_user(data.dateRange.endDate)}`
		);
		const profile = data.practitioner;
		this.page.main
			.find(".doctor-profile")
			.text([profile.practitionerName, profile.department].filter(Boolean).join(" · ") || __("Your clinical workspace"));
		this.practitioner = profile.name;
		for (const [key, metric] of Object.entries(data.kpis || {})) {
			this.page.main.find(`[data-kpi="${key}"]`).text(metric.restricted ? __("No access") : metric.value ?? "—");
		}
		this.renderList("appointments", data.operations?.appointments, "Patient Appointment", (record) => ({
			title: record.patient_name || __("Patient not listed"),
			detail: `${this.formatDate(record.appointment_date)}${record.appointment_time ? ` · ${record.appointment_time}` : ""}`,
		}), __("No appointments in this date range."));
		this.renderList("encounters", data.operations?.encounters, "Patient Encounter", (record) => ({
			title: record.patient_name || record.name,
			detail: `${this.formatDate(record.encounter_date)}${record.encounter_time ? ` · ${record.encounter_time}` : ""}`,
		}), __("No patient encounters in this date range."));
		this.renderList("labTests", data.operations?.labTests, "Lab Test", (record) => ({
			title: record.lab_test_name || __("Laboratory Test"),
			detail: `${record.patient_name || __("Patient not listed")} · ${this.formatDate(record.date)}`,
		}), __("No lab tests in this date range."));
	}

	formatDate(value) {
		return value ? frappe.datetime.str_to_user(value) : __("Date not set");
	}

	renderList(key, operation, doctype, getContent, emptyMessage) {
		const $list = this.page.main.find(`[data-list="${key}"]`).empty();
		const count = operation?.count;
		this.page.main.find(`[data-count="${key}"]`).text(count?.restricted ? __("No access") : count?.value ?? "—");
		if (!operation || operation.items === null) {
			$list.html(`<div class="doctor-empty">${__("You do not have permission to view these records.")}</div>`);
			return;
		}
		if (!operation.items.length) {
			$list.html(`<div class="doctor-empty">${emptyMessage}</div>`);
			return;
		}

		for (const record of operation.items) {
			const content = getContent(record);
			const status = frappe.utils.escape_html(record.status || __("Open"));
			const statusClass = status.toLowerCase().replace(/[^a-z]+/g, "-");
			$list.append(`
				<button type="button" class="doctor-item" data-doctype="${doctype}" data-name="${frappe.utils.escape_html(record.name)}">
					<span class="doctor-item-copy"><strong>${frappe.utils.escape_html(content.title)}</strong><small>${frappe.utils.escape_html(content.detail)}</small></span>
					<span class="doctor-status ${statusClass}">${status}</span>
				</button>
			`);
		}
	}

	showStatus(message) {
		this.page.main.find(".doctor-status-message").text(message).prop("hidden", !message);
	}
}
