frappe.pages["healthcare-admin-dashboard"].on_page_load = function (wrapper) {
	new HealthcareAdminDashboard(wrapper);
};

class HealthcareAdminDashboard {
	constructor(wrapper) {
		this.page = frappe.ui.make_app_page({
			parent: wrapper,
			title: __("Healthcare Admin Dashboard"),
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
		if (document.getElementById("healthcare-admin-dashboard-styles")) return;
		const style = document.createElement("style");
		style.id = "healthcare-admin-dashboard-styles";
		style.textContent = `
			.hms-dashboard { --hms-primary:#51448f; --hms-ink:#26243a; --hms-muted:#77758a; --hms-line:#ecebf2; color:var(--hms-ink); padding:22px 26px 36px; background:#f7f7fb; min-height:calc(100vh - 120px); }
			.hms-dashboard * { box-sizing:border-box; }
			.hms-topbar,.hms-brand,.hms-top-actions,.hms-user,.hms-search-wrap,.hms-filter-row,.hms-presets,.hms-section-heading,.hms-actions,.hms-action,.hms-alert { display:flex; align-items:center; }
			.hms-topbar { justify-content:space-between; gap:20px; margin-bottom:30px; }
			.hms-brand { gap:10px; font-size:17px; font-weight:750; letter-spacing:-.3px; white-space:nowrap; }
			.hms-brand-mark { display:grid; place-items:center; width:36px; height:36px; color:white; border-radius:11px; background:linear-gradient(105deg,#453D89,#C8499A); font-size:20px; font-weight:800; }
			.hms-search-wrap { display:flex; align-items:center; flex:1; max-width:490px; gap:9px; padding:0 13px; height:30px; border:1px solid var(--hms-line); border-radius:12px; background:white; color:#8d8a9c; cursor:pointer; font:inherit; text-align:left; }
			.hms-search-wrap { --hms-line:#ecebf2; --hms-ink:#26243a; }
			.hms-dashboard-header { display:grid; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); gap:14px; padding-block:3px; }
			.hms-dashboard-header .page-title { display:none; }
			.hms-header-search { grid-column:2; justify-self:center; width:100%; min-width:0; max-width:460px; margin:0; }
			.hms-dashboard-header .standard-items-section { grid-column:3; justify-self:end; }
			.hms-search-placeholder { flex:1; color:#8d8a9c; font-size:13px; }
			.hms-top-actions { gap:18px; }
			.hms-icon-button { display:grid; place-items:center; position:relative; width:38px; height:38px; border:1px solid var(--hms-line); border-radius:50%; color:#56536b; background:white; cursor:pointer; }
			.hms-notification-dot { position:absolute; right:8px; top:7px; width:7px; height:7px; border-radius:50%; background:#db4f83; box-shadow:0 0 0 2px white; }
			.hms-user { gap:9px; white-space:nowrap; font-size:13px; font-weight:650; }
			.hms-user-avatar { display:grid; place-items:center; width:35px; height:35px; overflow:hidden; border-radius:50%; color:#fff; background:linear-gradient(135deg,#8274c9,#d475a9); font-weight:700; }
			.hms-user-avatar img { width:100%; height:100%; object-fit:cover; }
			.hms-greeting { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:21px; }
			.hms-greeting h1 { margin:0 0 7px; font-size:25px; letter-spacing:-.8px; font-weight:750; }
			.hms-greeting p { margin:0; color:var(--hms-muted); font-size:13px; }
			.hms-range { color:#716e81; font-size:12px; font-weight:650; white-space:nowrap; }
			.hms-filter-card,.hms-card { border:1px solid #eeedf3; border-radius:15px; background:white; box-shadow:0 3px 14px #27233d08; }
			.hms-filter-card { padding:15px 17px; margin-bottom:22px; }
			.hms-filter-row { flex-wrap:wrap; gap:10px; }
			.hms-filter-row label { display:grid; gap:5px; color:#77758a; font-size:11px; font-weight:650; }
			.hms-filter-row input { height:36px; min-width:145px; padding:0 9px; border:1px solid var(--hms-line); border-radius:8px; color:var(--hms-ink); font-size:12px; }
			.hms-button { height:36px; padding:0 14px; border:1px solid var(--hms-line); border-radius:8px; color:#56536b; background:white; font-size:12px; font-weight:650; cursor:pointer; }
			.hms-button:hover { border-color:#cfc9e3; color:var(--hms-primary); }
			.hms-button-primary { border-color:transparent; color:white; background:linear-gradient(105deg,#453D89,#C8499A); }
			.hms-presets { flex-wrap:wrap; gap:6px; margin-left:auto; }
			.hms-preset { height:30px; padding:0 10px; border:1px solid transparent; border-radius:7px; color:#77758a; background:#f7f6fa; font-size:11px; cursor:pointer; }
			.hms-preset:hover,.hms-preset.active { border-color:#ddd7f0; color:#51448f; background:#f2effa; }
			.hms-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:15px; margin-bottom:22px; }
			.hms-kpi { --hms-kpi-shadow:rgba(69,61,137,.12); display:flex; align-items:flex-start; justify-content:space-between; min-height:122px; padding:18px; border:1px solid transparent; background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(69,61,137,.42),rgba(200,73,154,.26)) border-box; box-shadow:0 5px 16px var(--hms-kpi-shadow); color:inherit; text-decoration:none!important; transition:transform .16s,box-shadow .16s; }
			.hms-kpi:nth-child(even) { --hms-kpi-shadow:rgba(200,73,154,.12); background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,rgba(200,73,154,.26),rgba(69,61,137,.42)) border-box; }
			.hms-kpi:hover { transform:translateY(-2px); box-shadow:0 9px 22px var(--hms-kpi-shadow); }
			.hms-kpi-label { margin-bottom:15px; color:var(--hms-muted); font-size:12px; font-weight:600; }
			.hms-kpi-value { font-size:27px; line-height:1; letter-spacing:-.8px; font-weight:750; }
			.hms-kpi-note { margin-top:8px; color:#9290a0; font-size:10px; }
			.hms-kpi-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; color:#594e98; background:#f1effa; }
			.hms-kpi:nth-child(2) .hms-kpi-icon { color:#ba4f8e; background:#fbf0f6; }
			.hms-kpi:nth-child(3) .hms-kpi-icon { color:#3e9a8b; background:#edf8f5; }
			.hms-kpi:nth-child(4) .hms-kpi-icon { color:#d28742; background:#fff5e9; }
			.hms-grid { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr); gap:16px; margin-bottom:17px; }
			.hms-card { padding:19px; min-width:0; }
			.hms-section-heading { justify-content:space-between; gap:10px; margin-bottom:15px; }
			.hms-section-heading h2 { margin:0; font-size:14px; font-weight:730; }
			.hms-section-heading span { color:#8a8799; font-size:10px; }
			.hms-chart-wrap { min-height:205px; }
			.hms-chart-wrap svg { display:block; width:100%; height:205px; overflow:visible; }
			.hms-chart-empty,.hms-loading,.hms-error { display:grid; place-items:center; min-height:155px; color:#8a8799; font-size:12px; text-align:center; }
			.hms-bed-numbers { display:grid; grid-template-columns:repeat(3,1fr); gap:9px; margin:23px 0 17px; text-align:center; }
			.hms-bed-number strong { display:block; margin-bottom:5px; font-size:20px; }
			.hms-bed-number small { color:#858294; font-size:10px; }
			.hms-meter { height:9px; overflow:hidden; border-radius:8px; background:#f0eff4; }
			.hms-meter-fill { height:100%; border-radius:inherit; background:linear-gradient(90deg,#51448f,#c8499a); }
			.hms-bed-caption { margin:10px 0 0; color:#838092; font-size:11px; }
			.hms-admin-bottom-grid { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(280px,1fr); gap:16px; align-items:stretch; }
			.hms-attention { display:flex; flex-direction:column; height:300px; }
			.hms-alerts { display:grid; grid-auto-rows:min-content; flex:1; min-height:0; gap:9px; align-content:start; overflow-y:auto; padding-right:4px; }
			.hms-alert { gap:11px; min-height:56px; padding:10px 12px; border:1px solid #f0eef4; border-radius:10px; }
			.hms-alert-mark { display:grid; place-items:center; flex:0 0 30px; height:30px; border-radius:9px; color:#b8732f; background:#fff4e7; }
			.hms-alert.warning .hms-alert-mark { color:#bd547a; background:#fcf0f5; }
			.hms-alert.success .hms-alert-mark { color:#348b74; background:#edf8f4; }
			.hms-alert-copy { flex:1; min-width:0; }
			.hms-alert-copy strong { display:block; margin-bottom:3px; font-size:11px; }
			.hms-alert-copy small { display:block; overflow:hidden; color:#858294; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
			.hms-alert a { color:#685ba5; font-size:10px; font-weight:700; text-decoration:none; white-space:nowrap; }
			.hms-actions { flex-wrap:wrap; gap:9px; }
			.hms-action { gap:8px; min-height:38px; padding:0 12px; border:1px solid var(--hms-line); border-radius:9px; color:#514e64; background:white; font-size:11px; font-weight:650; text-decoration:none!important; }
			.hms-action:hover { border-color:#d6d0e7; color:#51448f; background:#faf9fd; }
			.hms-action svg { color:#776ba9; }
			.hms-dashboard-status { margin:0 0 14px; color:#bd547a; font-size:12px; }
			@media(max-width:980px) { .hms-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } .hms-grid { grid-template-columns:1fr 1fr; } .hms-chart-card { grid-column:1/-1; } .hms-presets { margin-left:0; } }
			@media(max-width:650px) { .hms-dashboard { padding:15px 12px 26px; } .hms-dashboard-header { display:grid!important; grid-template-columns:minmax(15px,1fr) minmax(0,min(460px,calc(100% - 30px))) minmax(15px,1fr); } .hms-dashboard-header .standard-items-section { grid-column:3; margin-left:0; } .hms-header-search { grid-column:2; order:0; flex:0 1 auto; width:100%; max-width:460px; min-width:0; margin:0; } .hms-greeting { align-items:flex-start; flex-direction:column; gap:9px; } .hms-greeting h1 { font-size:21px; } .hms-filter-row { align-items:stretch; } .hms-filter-row label { flex:1 1 calc(50% - 8px); } .hms-filter-row input { width:100%; min-width:0; } .hms-filter-row>.hms-button { flex:1; } .hms-presets { flex-basis:100%; } .hms-kpis { gap:9px; } .hms-kpi { min-height:112px; padding:13px; } .hms-kpi-label { font-size:11px; } .hms-kpi-value { font-size:23px; } .hms-kpi-icon { width:33px; height:33px; } .hms-grid { grid-template-columns:1fr; gap:11px; } .hms-chart-card { grid-column:auto; } .hms-admin-bottom-grid { grid-template-columns:1fr; } .hms-card { padding:15px; } .hms-action { flex:1 1 calc(50% - 8px); justify-content:center; } }
		`;
		document.head.appendChild(style);
	}

	renderShell() {
		this.page.main.addClass("hms-dashboard-host").html(`
			<div class="hms-dashboard">
				<div class="hms-greeting">
					<div><h1 class="hms-greeting-title"></h1><p>${__("Here is your healthcare operations overview.")}</p></div>
					<div class="hms-range"></div>
				</div>
				<div class="hms-dashboard-status" role="alert" hidden></div>
				<section class="hms-filter-card" aria-label="${__("Dashboard filters")}">
					<div class="hms-filter-row">
						<label>${__("Start Date")}<input class="hms-start-date" type="date"></label>
						<label>${__("End Date")}<input class="hms-end-date" type="date"></label>
						<button class="hms-button hms-button-primary hms-apply">${__("Apply Filter")}</button>
						<button class="hms-button hms-reset">${__("Reset")}</button>
						<div class="hms-presets">
							${["Today", "Yesterday", "This Week", "This Month", "This Year"].map((preset) => `<button class="hms-preset" data-preset="${preset}">${__(preset)}</button>`).join("")}
						</div>
					</div>
				</section>
				<div class="hms-kpis">
					${this.kpiCard("opdVisits", __("OPD Visits"), "patient-appointment", "calendar")}
					${this.kpiCard("ipdAdmissions", __("IPD Admissions"), "inpatient-record", "bed")}
					${this.kpiCard("laboratoryVisits", __("Laboratory Visits"), "lab-test", "flask")}
					${this.kpiCard("bills", __("Today's Bills"), "sales-invoice", "receipt")}
				</div>
				<div class="hms-grid">
					<section class="hms-card hms-chart-card">
						<div class="hms-section-heading"><h2>${__("Patient Footfall")}</h2><span>${__("New patient registrations")}</span></div>
						<div class="hms-chart-wrap"><div class="hms-loading">${__("Loading registrations...")}</div></div>
					</section>
					<section class="hms-card hms-bed-card">
						<div class="hms-section-heading"><h2>${__("Bed Occupancy")}</h2><span>${__("Live status")}</span></div>
						<div class="hms-bed-content"><div class="hms-loading">${__("Loading beds...")}</div></div>
					</section>
				</div>
				<div class="hms-admin-bottom-grid">
					<section class="hms-card hms-attention">
						<div class="hms-section-heading"><h2>${__("Needs Your Attention")}</h2><span>${__("Open operational items in the selected range")}</span></div>
						<div class="hms-alerts"><div class="hms-loading">${__("Loading operational alerts...")}</div></div>
					</section>
					<section class="hms-card hms-quick-actions">
						<div class="hms-section-heading"><h2>${__("Quick Actions")}</h2><span>${__("Common admin tasks")}</span></div>
						<div class="hms-actions">
							${this.actionLink("hr-setup", __("HRMS"), "users")}
							${this.actionLink("patient", __("Patients"), "patient")}
							${this.actionLink("user", __("Add Users"), "user")}
							${this.actionLink("sales-invoice", __("Invoices"), "receipt")}
						</div>
					</section>
				</div>
			</div>
		`);
		this.setGreeting();
		this.setUser();
	}

	mountGlobalSearch() {
		const $search = $(`
			<button type="button" class="hms-search-wrap hms-header-search" aria-label="${__("Open global search")}">
				${this.icon("search")}
				<span class="hms-search-placeholder">${__("Search or type a command")}</span>
			</button>
		`);
		this.page.page_head.find(".page-head-content").addClass("hms-dashboard-header");
		this.page.page_head.find(".page-title").after($search);
	}

	kpiCard(key, label, route, icon) {
		return `<a class="hms-card hms-kpi" href="/desk/${route}" data-route="${route}">
			<div><div class="hms-kpi-label">${label}</div><div class="hms-kpi-value" data-kpi="${key}">—</div><div class="hms-kpi-note" data-kpi-note="${key}">${__("Selected date range")}</div></div>
			<span class="hms-kpi-icon">${this.icon(icon)}</span>
		</a>`;
	}

	actionLink(route, label, icon) {
		return `<a class="hms-action" href="/desk/${route}" data-route="${route}">${this.icon(icon)}<span>${label}</span></a>`;
	}

	icon(name) {
		const paths = {
			search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>',
			calendar: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>',
			bed: '<path d="M3 7v14M3 17h18v4M3 12h18v5M7 12V8h5a3 3 0 0 1 3 3v1"></path><path d="M15 12V9h3a3 3 0 0 1 3 3"></path>',
			flask: '<path d="M9 3h6M10 3v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3"></path><path d="M7 16h10"></path>',
			receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2z"></path><path d="M8 8h8M8 12h8M8 16h4"></path>',
			users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="10" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>',
			patient: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0M12 14v5M9.5 16.5h5"></path>',
			user: '<circle cx="12" cy="8" r="4"></circle><path d="M5 21a7 7 0 0 1 14 0M19 8v6M16 11h6"></path>',
		};
		return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.patient}</svg>`;
	}

	setGreeting() {
		const hour = new Date().getHours();
		const greeting = hour < 12 ? __("Good Morning") : hour < 18 ? __("Good Afternoon") : __("Good Evening");
		this.page.main.find(".hms-greeting-title").text(`${greeting}, ${this.fullName()}!`);
	}

	fullName() {
		return frappe.boot?.user?.full_name || frappe.session?.user || __("there");
	}

	setUser() {
		const info = frappe.user_info?.(frappe.session?.user) || {};
		const $avatar = this.page.main.find(".hms-user-avatar");
		this.page.main.find(".hms-user-name").text(this.fullName());
		if (info.image) {
			$avatar.html(`<img src="${frappe.utils.escape_html(info.image)}" alt="">`);
		} else {
			$avatar.text(this.fullName().trim().charAt(0).toUpperCase() || "U");
		}
	}

	setDefaultDates() {
		const today = this.today();
		this.setDates(`${today.slice(0, 7)}-01`, today);
		this.page.main.find('[data-preset="This Month"]').addClass("active");
	}

	today() {
		const date = new Date();
		return this.toIsoDate(date);
	}

	toIsoDate(date) {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}

	setDates(start, end) {
		this.startDate = start;
		this.endDate = end;
		this.page.main.find(".hms-start-date").val(start);
		this.page.main.find(".hms-end-date").val(end);
		this.page.main.find(".hms-preset").removeClass("active");
	}

	bindEvents() {
		const $main = this.page.main;
		const $head = this.page.page_head;
		$main.on("click", ".hms-apply", () => this.applyDates());
		$main.on("click", ".hms-reset", () => {
			this.setDefaultDates();
			this.loadDashboard();
		});
		$main.on("click", ".hms-preset", (event) => this.applyPreset(event.currentTarget.dataset.preset));
		$main.on("click", ".hms-notifications", () => frappe.set_route("List", "Notification Log"));
		$head.on("click", ".hms-header-search", () => {
			const awesomeBar = frappe.app?.awesome_bar;
			if (!awesomeBar) {
				this.showStatus(__("Frappe global search is not available."));
				return;
			}
			awesomeBar.open();
		});
	}

	applyDates() {
		const start = this.page.main.find(".hms-start-date").val();
		const end = this.page.main.find(".hms-end-date").val();
		if (!start || !end || start > end) {
			this.showStatus(__("Enter a valid date range with Start Date on or before End Date."));
			return;
		}
		this.setDates(start, end);
		this.loadDashboard();
	}

	applyPreset(preset) {
		const today = new Date();
		const todayString = this.toIsoDate(today);
		let start = todayString;
		let end = todayString;
		if (preset === "Yesterday") {
			const yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate() - 1);
			start = end = this.toIsoDate(yesterday);
		} else if (preset === "This Week") {
			const mondayOffset = (today.getDay() + 6) % 7;
			const monday = new Date(today);
			monday.setDate(today.getDate() - mondayOffset);
			start = this.toIsoDate(monday);
		} else if (preset === "This Month") {
			start = `${todayString.slice(0, 7)}-01`;
		} else if (preset === "This Year") {
			start = `${today.getFullYear()}-01-01`;
		}
		this.setDates(start, end);
		this.page.main.find(`[data-preset="${preset}"]`).addClass("active");
		this.loadDashboard();
	}

	async loadDashboard() {
		this.showStatus("");
		this.page.main.find(".hms-range").text(`${this.startDate} – ${this.endDate}`);
		this.page.main.find(".hms-kpi-value").text("…");
		this.page.main.find(".hms-chart-wrap").html(`<div class="hms-loading">${__("Loading registrations...")}</div>`);
		this.page.main.find(".hms-bed-content").html(`<div class="hms-loading">${__("Loading beds...")}</div>`);
		this.page.main.find(".hms-alerts").html(`<div class="hms-loading">${__("Loading operational alerts...")}</div>`);
		try {
			const data = await frappe.xcall("qdynamics_hms_dashboards.api.healthcare_admin_dashboard.get_dashboard", {
				start_date: this.startDate,
				end_date: this.endDate,
			});
			this.renderDashboard(data);
		} catch (error) {
			this.showStatus(error?.message || __("Unable to load dashboard data."));
			this.page.main.find(".hms-kpi-value").text("—");
			this.page.main.find(".hms-chart-wrap,.hms-bed-content,.hms-alerts").html(`<div class="hms-error">${__("Dashboard data could not be loaded. Check access and try again.")}</div>`);
		}
	}

	renderDashboard(data) {
		const { kpis } = data;
		for (const [key, metric] of Object.entries(kpis)) {
			this.page.main.find(`[data-kpi="${key}"]`).text(metric.restricted ? "—" : metric.value.toLocaleString());
			const note = key === "opdVisits" ? __("Appointments created in selected date range") : __("Selected date range");
			this.page.main.find(`[data-kpi-note="${key}"]`).text(metric.restricted ? __("Read permission required") : note);
		}
		this.renderFootfall(data.patientFootfall);
		this.renderBeds(data.bedOccupancy);
		this.renderAttention(data.attention, data.bedOccupancy);
	}

	renderFootfall(footfall) {
		const $chart = this.page.main.find(".hms-chart-wrap");
		if (footfall.restricted) {
			$chart.html(`<div class="hms-chart-empty">${__("Patient read permission required.")}</div>`);
			return;
		}
		if (!footfall.points.length) {
			$chart.html(`<div class="hms-chart-empty">${__("No patient registrations in this date range.")}</div>`);
			return;
		}
		const values = footfall.points.map((point) => Number(point.count));
		const width = 720;
		const height = 205;
		const padding = { top: 16, right: 12, bottom: 30, left: 30 };
		const max = Math.max(1, ...values);
		const x = (index) => padding.left + index * (width - padding.left - padding.right) / Math.max(1, values.length - 1);
		const y = (value) => padding.top + (height - padding.top - padding.bottom) * (1 - value / max);
		const line = values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
		const area = `${line} L${x(values.length - 1).toFixed(1)},${height - padding.bottom} L${x(0).toFixed(1)},${height - padding.bottom} Z`;
		const labelIndexes = [...new Set([0, Math.floor((values.length - 1) / 2), values.length - 1])];
		const labels = labelIndexes.map((index) => {
			const label = this.formatChartDate(footfall.points[index].date);
			return `<text x="${x(index)}" y="${height - 6}" text-anchor="${index === 0 ? "start" : index === values.length - 1 ? "end" : "middle"}">${label}</text>`;
		}).join("");
		const circles = values.map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="3" fill="#51448f"><title>${footfall.points[index].date}: ${value}</title></circle>`).join("");
		$chart.html(`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${__("Patient registration trend")}">
			<defs><linearGradient id="hms-footfall-gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7656ad" stop-opacity=".24"/><stop offset="1" stop-color="#7656ad" stop-opacity=".01"/></linearGradient></defs>
			<path d="M${padding.left},${height - padding.bottom}H${width - padding.right}" stroke="#eeedf3" fill="none"/>
			<path d="${area}" fill="url(#hms-footfall-gradient)"/><path d="${line}" fill="none" stroke="#67539c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
			${circles}<g fill="#898697" font-size="10">${labels}</g></svg>`);
	}

	formatChartDate(value) {
		const date = new Date(`${value}T00:00:00`);
		return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	}

	renderBeds(beds) {
		const $content = this.page.main.find(".hms-bed-content");
		if (beds.restricted) {
			$content.html(`<div class="hms-chart-empty">${__("Healthcare Service Unit read permission required.")}</div>`);
			return;
		}
		$content.html(`<div class="hms-bed-numbers">
			<div class="hms-bed-number"><strong>${beds.total.toLocaleString()}</strong><small>${__("Total beds")}</small></div>
			<div class="hms-bed-number"><strong>${beds.occupied.toLocaleString()}</strong><small>${__("Occupied")}</small></div>
			<div class="hms-bed-number"><strong>${beds.availableBeds.toLocaleString()}</strong><small>${__("Available")}</small></div>
		</div>
		<div class="hms-meter"><div class="hms-meter-fill" style="width:${Math.min(100, beds.occupancyPercent)}%"></div></div>
		<p class="hms-bed-caption">${beds.occupancyPercent}% ${__("occupancy")} · ${__("Current bed status")}</p>`);
	}

	renderAttention(attention, beds) {
		const alerts = [];
		if (attention.pendingLabTests === null) {
			alerts.push(this.alertHtml("warning", __("Laboratory work"), __("Lab Test read permission required."), "lab-test"));
		} else if (attention.pendingLabTests.length) {
			for (const test of attention.pendingLabTests) {
				const name = test.lab_test_name || test.patient_name || test.name;
				alerts.push(this.alertHtml("warning", __("Pending laboratory work"), `${name} · ${test.status}`, "lab-test", test.name));
			}
		}
		if (attention.overdueBills === null) {
			alerts.push(this.alertHtml("warning", __("Overdue invoices"), __("Sales Invoice read permission required."), "sales-invoice"));
		} else if (attention.overdueBills.length) {
			for (const invoice of attention.overdueBills) {
				const customer = invoice.customer_name || invoice.name;
				alerts.push(this.alertHtml("warning", __("Overdue bill"), `${customer} · ${frappe.format(invoice.outstanding_amount, { fieldtype: "Currency" })}`, "sales-invoice", invoice.name));
			}
		}
		if (beds.restricted) {
			alerts.push(this.alertHtml("warning", __("Bed availability"), __("Healthcare Service Unit read permission required."), "healthcare-service-unit"));
		} else if (!beds.total) {
			alerts.push(this.alertHtml("warning", __("Bed availability"), __("No inpatient beds are configured."), "healthcare-service-unit"));
		} else if (!beds.availableBeds) {
			alerts.push(this.alertHtml("warning", __("Bed availability"), __("No inpatient beds are currently available."), "healthcare-service-unit"));
		} else if (beds.occupancyPercent >= 85) {
			alerts.push(this.alertHtml("warning", __("Limited bed availability"), `${beds.availableBeds} ${__("beds available")} · ${beds.occupancyPercent}% ${__("occupied")}`, "healthcare-service-unit"));
		} else {
			alerts.push(this.alertHtml("success", __("Bed availability"), `${beds.availableBeds} ${__("beds available")}`, "healthcare-service-unit"));
		}
		if (!alerts.length) {
			this.page.main.find(".hms-alerts").html(`<div class="hms-chart-empty">${__("No pending laboratory work or overdue invoices in this date range.")}</div>`);
		} else {
			this.page.main.find(".hms-alerts").html(alerts.join(""));
		}
	}

	alertHtml(type, title, detail, route, record = "") {
		const safeTitle = frappe.utils.escape_html(title);
		const safeDetail = frappe.utils.escape_html(detail);
		const safeRecord = frappe.utils.escape_html(record);
		const link = record ? `<a href="/desk/${route}/${encodeURIComponent(record)}" data-record="${safeRecord}" data-doctype="${route}">${__("Open")}</a>` : `<a href="/desk/${route}" data-route="${route}">${__("View")}</a>`;
		return `<div class="hms-alert ${type}"><span class="hms-alert-mark">${this.icon(type === "success" ? "patient" : "bell")}</span><div class="hms-alert-copy"><strong>${safeTitle}</strong><small>${safeDetail}</small></div>${link}</div>`;
	}

	showStatus(message) {
		this.page.main.find(".hms-dashboard-status").text(message).prop("hidden", !message);
	}
}
