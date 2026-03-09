// Garaje Salma Presentation Logic v3

// Global State
let currentStep = 1;

// Navigation Logic
function goToStep(stepNum) {
    // 1. Update Buttons
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.querySelector('.step-number').innerText) === stepNum) {
            btn.classList.add('active');
        }
    });

    // 2. Update Sections
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
    });

    const targetId = 'step-' + stepNum;
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.add('active');
        // If it's the financial tab (Step 4), initialize it
        if (stepNum === 4) {
            // Small delay to ensure display:block allows canvas to size correctly
            setTimeout(() => initFinancialTab(''), 50);
        }
    }

    // Scroll to top
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;

    currentStep = stepNum;
}

// Canvas Filtering Logic (Step 3 & 6)
function filterCanvas(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    const isStep6 = document.getElementById('step-6') && document.getElementById('step-6').classList.contains('active');

    // Only apply multi-select logic in Step 6 (Test Model) or Global? 
    // User asked "El filtro de lineas de negocio debe poder permitir...", presumably for the new model.
    // Let's make it consistent. If 'all' is clicked, clear others. If specific is clicked, toggle it.

    const clickedBtn = Array.from(buttons).find(b => b.dataset.cat === category && (isStep6 ? b.closest('#step-6') : b.closest('#step-3')));

    // Logic:
    // If 'all' -> Activate 'all', deactivate others in current view.
    // If 'other' -> Deactivate 'all', toggle 'other'. If no 'other' active, activate 'all'.

    // We need to target buttons strictly within the active view (Step 3 or Step 6) to avoid cross-talk?
    // Actually, distinct IDs for buttons or relying on container is better.
    // Index.html has duplicate IDs for buttons? No, buttons don't have IDs, just classes.
    // But `filterCanvas` is global. 
    // Let's restrict scope to the active section.

    const activeSection = document.querySelector('.view-section.active');
    const scopedButtons = activeSection.querySelectorAll('.filter-btn');
    const scopedCards = activeSection.querySelectorAll('.bmc-card');

    if (!clickedBtn) return; // Safety

    if (category === 'all') {
        scopedButtons.forEach(btn => {
            if (btn.dataset.cat === 'all') btn.classList.add('active');
            else btn.classList.remove('active');
        });
    } else {
        // Toggle
        clickedBtn.classList.toggle('active');

        // Handle 'all' button state
        const allBtn = activeSection.querySelector('.filter-btn[data-cat="all"]');
        if (allBtn) allBtn.classList.remove('active');

        // Check if any specific filter is active
        const anyActive = Array.from(scopedButtons).some(b => b.dataset.cat !== 'all' && b.classList.contains('active'));

        // If nothing active, revert to 'all'
        if (!anyActive && allBtn) {
            allBtn.classList.add('active');
        }
    }

    // Apply Filter
    // 1. Get active categories
    const activeCats = Array.from(scopedButtons)
        .filter(b => b.classList.contains('active') && b.dataset.cat !== 'all')
        .map(b => b.dataset.cat);

    const showAll = activeCats.length === 0; // Usage of 'all' button or no filters implies show all

    scopedCards.forEach(card => {
        if (showAll) {
            card.style.display = 'block';
            setTimeout(() => card.style.opacity = '1', 10);
        } else {
            const cardTags = (card.dataset.tags || "").split(" ");
            // Logic: Show if card has ANY of the active categories (OR logic)
            // Use 'some' to check intersection
            const match = activeCats.some(cat => cardTags.includes(cat));

            if (match) {
                card.style.display = 'block';
                setTimeout(() => card.style.opacity = '1', 10);
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        }
    });
}

/* ============================================================
   ACTO 4: FINANCIAL DATA & CHART
   ============================================================ */

const financialData = {
    expenses: [
        { name: "Amortizaciones", values: [0, -11463, -51745, -103490] }, // Doubled for 2026 Est
        { name: "Ayudas monet. (incentivos)", values: [0, 0, 0, 0] },
        { name: "Compras Internas", values: [-45, -2110, 0, -46100] }, // Updated 2026 Est
        { name: "Compras y aprovisionams", values: [-1666, -4780, -4780, -22780] }, // Updated 2026 Est
        { name: "Gastos excepcionales", values: [-34, -40, 0, 0] },
        { name: "Gastos financieros", values: [0, 0, 0, 0] },
        { name: "Impuestos", values: [-32, 28, 0, 0] },
        { name: "Otros gastos", values: [4127, -3276, -3276, -3276] },
        { name: "Otros servicios exteriores", values: [-33515, -41863, -43756, -43756] },
        { name: "Personal", values: [-19593, -263665, -498388, -502041.49] }, // Updated 2026 Est
        { name: "Publicidad, prop y RRPP", values: [0, -565, 0, 0] },
        { name: "Reparaciones y conservac.", values: [-1390, -8473, -8473, -8473] },
        { name: "Subcontrataciones", values: [0, 0, 0, 0] },
        { name: "Suministros", values: [0, -1, -1, -15500] }, // Updated 2026 Est
        { name: "Transportes", values: [-38, 0, 0, 0] }
    ],
    revenues: [
        { name: "Ingresos financieros", values: [0, 0, 0, 0] },
        { name: "Otros ingresos", values: [196, 0, 0, 0] },
        { name: "Subvenciones de capital", values: [0, 58, 58, 58] },
        { name: "Subvs extraordinarias", values: [454, 0, 0, 0] },
        { name: "Subvs Salariales (INEM)", values: [10740, 69459, 218475, 218475] },
        { name: "Subvs. por concierto/conv", values: [14749, 177157, 368875, 476987] }, // Updated 2026 Est (+108k)
        { name: "Ingresos usuarios formación", values: [7408, 44800, 134400, 134400], parent: "Ventas Internas" }, // Renamed from "Ventas Internas"
        { name: "Ventas internas Garaje Salma", values: [0, 0, 0, 32500], parent: "Ventas Internas" }, // New item for 2026 Est
        { name: "Productos", values: [5000, 0, 0, 6125], parent: "Ventas Externas" },
        { name: "Talleres", values: [0, 0, 0, 7425], parent: "Ventas Externas" },
        { name: "Alquiler salas", values: [0, 0, 0, 1700], parent: "Ventas Externas" }
    ],
    totals: {
        expenses: [],
        revenues: [],
        net: []
    }
};

// Calculate totals dynamically (Real -> Budget -> Projections)
function calculateTotals() {
    const years = 6; // 24, 25, 26p, 26e, 27, 28
    const tExp = new Array(years).fill(0);
    const tRev = new Array(years).fill(0);

    // Baseline Growth Rates
    const RATES = {
        CPI: 1.03,  // 3% (Sales, Expenses, Personnel)
        SUBV: 1.02, // 2% (Subsidies)
        FLAT: 1.00  // 0% (Amortizations)
    };

    // Strategic Drivers
    const COURSE_REV = 108112;
    const COURSE_EXP_PERS = 108112 * 0.60; // 64,867.2
    const COURSE_EXP_SUM = 108112 * 0.10;  // 10,811.2

    // Process Expenses
    financialData.expenses.forEach(item => {
        const v24 = item.values[0];
        const v25 = item.values[1];
        const v26p = item.values[2];
        const v26e = item.values[3]; // New Estimate

        let v27, v28;

        if (item.name === "Personal") {
            // Fixed Targets:
            // 2026 Estimate: -502,041
            // 2028 Target: -589,459.50
            // 2027 Interpolated: -545,750.25
            v27 = -545750.25;
            v28 = -589459.50;

        } else if (item.name === "Suministros") {
            // Same logic for Supplies
            v27 = (v26e * RATES.CPI) - COURSE_EXP_SUM;
            v28 = (v27 * RATES.CPI) - COURSE_EXP_SUM;

        } else if (item.name === "Amortizaciones") {
            v27 = v26e * RATES.FLAT;
            v28 = v27 * RATES.FLAT;
        } else {
            // Default Expense Growth
            v27 = v26e * RATES.CPI;
            v28 = v27 * RATES.CPI;
        }

        item.series = [v24, v25, v26p, v26e, v27, v28];
        for (let i = 0; i < years; i++) tExp[i] += item.series[i];
    });

    // Process Revenues
    financialData.revenues.forEach(item => {
        const v24 = item.values[0];
        const v25 = item.values[1];
        const v26p = item.values[2];
        const v26e = item.values[3]; // New Estimate

        let v27, v28;

        if (item.name === "Subvs. por concierto/conv") {
            // +1 Course in 27, +2 in 28.
            // Logic: v27 = (v26e * 1.02) + 108k
            // v28 = (v27 * 1.02) + 108k
            // v27 = (v26e * RATES.SUBV) + COURSE_REV - 40000 (Adjustment requested)
            // v28 = (v27 * RATES.SUBV) + COURSE_REV - 40000 (Adjustment requested)
            v27 = (v26e * RATES.SUBV) + COURSE_REV - 40000;
            v28 = (v27 * RATES.SUBV) + COURSE_REV - 40000;

        } else if (item.name === "Talleres") {
            // Specific request: 2026(1) -> 2027(2) -> 2028(3)
            // v27 = v26e * 2
            // v28 = v26e * 3
            v27 = v26e * 2;
            v28 = v26e * 3;

        } else if (item.name === "Ventas internas Garaje Salma" ||
            item.parent === "Ventas Externas") {
            // Scenario: 50% Annual Growth from 2026 Estimate
            v27 = v26e * 1.50;
            v28 = v27 * 1.50;

        } else if (item.name === "Ingresos usuarios formación") {
            // Fixed targets as requested: 143,500 (2027) and 149,500 (2028)
            v27 = 143500;
            v28 = 149500;



        } else {
            // Default Revenue Growth
            let rate = RATES.CPI;
            if (item.name.startsWith("Subv") || item.name.includes("Subvenciones")) {
                rate = RATES.SUBV;
            }
            v27 = v26e * rate;
            v28 = v27 * rate;
        }

        item.series = [v24, v25, v26p, v26e, v27, v28];
        for (let i = 0; i < years; i++) tRev[i] += item.series[i];
    });

    // Process Net
    const tNet = new Array(years).fill(0);
    for (let i = 0; i < years; i++) {
        tNet[i] = tRev[i] + tExp[i];
    }

    financialData.totals.expenses = tExp;
    financialData.totals.revenues = tRev;
    financialData.totals.net = tNet;
}

let chartInstances = {};

// --- 3. Render Functions (Unified View) ---
function initFinancialTab() {
    calculateTotals();
    renderTable();
    renderChart();
    renderMixChart();
}

function renderTable() {
    const tbody = document.getElementById('financialBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    // Render Group Function
    const renderGroup = (items, title, totalSeries) => {
        const header = document.createElement('tr');
        header.className = 'category-row';
        header.innerHTML = `<td colspan="7" style="color:var(--brand-dark); border-bottom:2px solid var(--border); padding-top:1.5rem;">${title}</td>`; // colspan 7 for 1 item col + 6 year cols
        tbody.appendChild(header);

        // Track rendered parents
        const renderedParents = new Set();

        // Render Rows
        items.forEach(item => { // Iterate directly over the array
            const [y1, y2, y3, y4, y5, y6] = item.series; // 24, 25, 26p, 26e, 27, 28

            // Check if item belongs to a parent group we haven't rendered yet
            if (item.parent && !renderedParents.has(item.parent)) {
                // Calculate Parent Totals
                const siblings = items.filter(i => i.parent === item.parent);
                // Sum series for each year (0-5)
                const pSeries = [0, 0, 0, 0, 0, 0];
                siblings.forEach(sib => {
                    for (let k = 0; k < 6; k++) pSeries[k] += sib.series[k];
                });

                // Render Parent Row
                const pTr = document.createElement('tr');
                pTr.style.fontWeight = "700";
                pTr.style.backgroundColor = "#fafafa"; // Light background for sub-header

                // Highlight logic for parent? User said "Ventas internas (sume 134400 y 32500)".
                // Maybe highlight parent in green if its total changed?
                // The parent itself is "Ventas Internas". In 2026 Est it is 166900 vs 134400 (PPT).
                // So yes, let's highlgiht 2026 Est for parent.
                let pEstClass = "col-est highlight-green";

                // Note: pSeries[2] is 2026 P. If it differs from pSeries[3] (2026 E).
                // Here 2026P = 134400. 2026E = 166900. Different.

                pTr.innerHTML = `
                    <td class="col-item" style="padding-left:10px;">${item.parent}</td>
                    <td class="col-real">${fmt(pSeries[0])}</td>
                    <td class="col-real">${fmt(pSeries[1])}</td>
                    <td class="col-plan">${fmt(pSeries[2])}</td>
                    <td class="${pEstClass}">${fmt(pSeries[3])}</td>
                    <td class="col-est">${fmt(pSeries[4])}</td>
                    <td class="col-est">${fmt(pSeries[5])}</td>
                `;
                tbody.appendChild(pTr);
                renderedParents.add(item.parent);
            }

            const tr = document.createElement('tr');
            // Optional: hide zero rows if desired, or keep as is
            if (item.name === "Ingresos financieros" || item.name === "Ayudas monet. (incentivos)") {
                // This condition was in the provided snippet, but it's commented out.
                // If the intent is to hide rows with these names, uncomment and add logic.
                // For now, it's just a comment.
            }

            // Logic for highlighting specific 2026 Est items
            let estClass = "col-est";
            const highlightItems = [
                "Amortizaciones",
                "Compras Internas",
                "Suministros",
                "Compras y aprovisionams",
                "Personal"
            ];

            if (highlightItems.includes(item.name)) {
                estClass += " highlight-red";
            }

            const highlightGreenItems = [
                "Subvs. por concierto/conv",
                "Ventas internas Garaje Salma",
                "Productos",
                "Talleres",
                "Alquiler salas"
            ];

            if (highlightGreenItems.includes(item.name)) {
                estClass += " highlight-green";
            }

            // Indent content if it has a parent
            let nameContent = item.name;
            if (item.parent) {
                nameContent = `<span style="padding-left: 20px; color: #666; font-size: 0.9em;">↳ ${item.name}</span>`;
            }

            // Always render 6 columns (Standard View now)
            tr.innerHTML = `
                <td class="col-item">${nameContent}</td>
                <td class="col-real">${fmt(y1)}</td>
                <td class="col-real">${fmt(y2)}</td>
                <td class="col-plan">${fmt(y3)}</td>
                <td class="${estClass}">${fmt(y4)}</td>
                <td class="col-est">${fmt(y5)}</td>
                <td class="col-est">${fmt(y6)}</td>
            `;
            tbody.appendChild(tr);
        });

        // Render Total Row for Group
        if (totalSeries) {
            const totTr = document.createElement('tr');
            totTr.style.fontWeight = "800";
            totTr.style.backgroundColor = "#f0fdf4"; // Very light green for totals
            totTr.style.borderTop = "2px solid #cbd5e1";

            // Determine header color based on title (hacky but effective)
            const isExp = title.includes("GASTOS");
            if (isExp) totTr.style.backgroundColor = "#fef2f2"; // Light red for expenses

            // Specific styling for 2026 Est
            // If Income, make it Green. If Expense, keep standard or red? User only asked for Income Green.
            const estStyle = !isExp ? 'color:#16a34a; font-weight:800;' : 'color:var(--brand-dark)';

            totTr.innerHTML = `
                <td class="col-item" style="padding-left:10px;">TOTAL ${title}</td>
                <td class="col-real">${fmt(totalSeries[0])}</td>
                <td class="col-real">${fmt(totalSeries[1])}</td>
                <td class="col-plan">${fmt(totalSeries[2])}</td>
                <td class="col-est" style="${estStyle}">${fmt(totalSeries[3])}</td>
                <td class="col-est">${fmt(totalSeries[4])}</td>
                <td class="col-est">${fmt(totalSeries[5])}</td>
            `;
            tbody.appendChild(totTr);
        }
    };

    renderGroup(financialData.revenues, "INGRESOS", financialData.totals.revenues);
    renderGroup(financialData.expenses, "GASTOS", financialData.totals.expenses);

    // Render Totals (Net Result) in Footer
    const tNet = financialData.totals.net;
    document.getElementById(`res-24`).innerText = fmt(tNet[0]);
    document.getElementById(`res-25`).innerText = fmt(tNet[1]);
    document.getElementById(`res-26`).innerText = fmt(tNet[2]);
    document.getElementById(`res-26e`).innerText = fmt(tNet[3]);
    document.getElementById(`res-27`).innerText = fmt(tNet[4]);
    document.getElementById(`res-28`).innerText = fmt(tNet[5]);

    // Colorize footer cells
    const years = [24, 25, 26, '26e', 27, 28];
    const indices = [0, 1, 2, 3, 4, 5];

    indices.forEach((idx, i) => {
        const val = tNet[idx];
        const cel = document.getElementById(`res-${years[i]}`); // No suffix
        if (cel) {
            cel.className = val >= 0 ? 'positive' : 'negative';
        }
    });
}


function renderChart() {
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') return;

    if (chartInstances.main) {
        chartInstances.main.destroy();
    }

    // Filter indices: 0(24), 1(25), 3(26e), 4(27), 5(28). Skip 2(26p).
    const indices = [0, 1, 3, 4, 5];
    const labels = ['2024', '2025', '2026 (Est)', '2027', '2028'];

    const getFilteredData = (sourceArr) => indices.map(i => sourceArr[i]);

    const dataExpenses = getFilteredData(financialData.totals.expenses).map(v => Math.abs(v));
    const dataRevenues = getFilteredData(financialData.totals.revenues);
    const dataNet = getFilteredData(financialData.totals.net);

    chartInstances.main = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels], // Activate plugin
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: dataRevenues,
                    backgroundColor: '#10b981', // Emerald 500
                    borderRadius: 6,
                    order: 1,
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#059669', // Emerald 700
                        font: { weight: 'bold', size: 11 },
                        formatter: (val) => new Intl.NumberFormat('es-ES', { notation: "compact" }).format(val)
                    }
                },
                {
                    label: 'Gastos',
                    data: dataExpenses,
                    backgroundColor: '#ef4444', // Red 500
                    borderRadius: 6,
                    order: 2,
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        color: '#b91c1c', // Red 700
                        font: { weight: 'bold', size: 11 },
                        formatter: (val) => new Intl.NumberFormat('es-ES', { notation: "compact" }).format(val)
                    }
                },
                {
                    label: 'Resultado Neto',
                    data: dataNet,
                    type: 'line',
                    borderColor: '#1e3a8a', // Blue 900
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#1e3a8a',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.3,
                    order: 0,
                    datalabels: {
                        display: false // Too cluttered to show labels on line points too
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: { top: 30 } // Space for top labels
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Montserrat', sans-serif", size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1e293b',
                    bodyColor: '#475569',
                    borderColor: '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 4,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f1f5f9', borderDash: [5, 5] },
                    ticks: {
                        color: '#64748b',
                        font: { family: "'Montserrat', sans-serif" },
                        callback: function (value) {
                            return new Intl.NumberFormat('es-ES', { notation: "compact" }).format(value);
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#334155',
                        font: { family: "'Montserrat', sans-serif", weight: '600' }
                    }
                }
            }
        }
    });
}

function renderMixChart() {
    const ctx = document.getElementById('mixChart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') return;

    if (chartInstances.mix) {
        chartInstances.mix.destroy();
    }

    // Filter indices
    const indices = [0, 1, 3, 4, 5];
    const labels = ['2024', '2025', '2026 (Est)', '2027', '2028'];

    // Helper to sum by category
    const getCategorySum = (indices, keywordArray) => {
        return indices.map(idx => {
            let sum = 0;
            financialData.revenues.forEach(item => {
                const matches = keywordArray.some(k => item.name.toLowerCase().includes(k.toLowerCase()) || (item.parent && item.parent.toLowerCase().includes(k.toLowerCase())));
                if (matches) {
                    sum += item.series[idx];
                }
            });
            return sum;
        });
    };

    const dataSubv = getCategorySum(indices, ["Subv"]);
    const dataVentas = indices.map((idx, i) => {
        const total = financialData.totals.revenues[indices[i]];
        const subv = dataSubv[i];
        return total - subv;
    });

    chartInstances.mix = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels], // Activate plugin
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Subvenciones',
                    data: dataSubv,
                    backgroundColor: '#3b82f6', // Blue 500
                    borderRadius: 4,
                    stack: 'Stack 0',
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value, ctx) => {
                            // Calculate percentage
                            const i = ctx.dataIndex;
                            const total = dataSubv[i] + dataVentas[i];
                            const percentage = (value / total * 100).toFixed(0);
                            return percentage > 5 ? percentage + '%' : ''; // Hide if small
                        }
                    }
                },
                {
                    label: 'Ventas y Servicios',
                    data: dataVentas,
                    backgroundColor: '#f59e0b', // Amber 500
                    borderRadius: 4,
                    stack: 'Stack 0',
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 10 },
                        formatter: (value, ctx) => {
                            const i = ctx.dataIndex;
                            const total = dataSubv[i] + dataVentas[i];
                            const percentage = (value / total * 100).toFixed(0);
                            return percentage > 5 ? percentage + '%' : '';
                        }
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    display: false // Hide Y axis for cleaner look since we have labels
                },
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        font: { weight: '600' }
                    }
                }
            }
        }
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    // If Step 4 is active, init
    if (document.getElementById('step-4') && document.getElementById('step-4').classList.contains('active')) {
        initFinancialTab();
    }
});

// Export Function
function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert("Librería de exportación no cargada. Por favor espera o recarga.");
        return;
    }

    // 1. Prepare data array
    const data = [];

    // Headers
    data.push(["Partida / Concepto", "2024 (Real)", "2025 (Real)", "2026 (Ppto)", "2026 (Est)", "2027 (Est)", "2028 (Est)"]);

    // Revenues
    data.push(["INGRESOS GENERADOS", "", "", "", "", "", ""]);
    financialData.revenues.forEach(item => {
        data.push([item.name, ...item.series]);
    });

    // Expenses
    data.push(["GASTOS ESTRUCTURALES", "", "", "", "", "", ""]);
    financialData.expenses.forEach(item => {
        data.push([item.name, ...item.series]);
    });

    // Net
    data.push(["RESULTADO NETO", ...financialData.totals.net]);

    // 2. Create Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Auto-width hint
    const wscols = [
        { wch: 35 }, // A
        { wch: 15 }, // B
        { wch: 15 }, // C
        { wch: 15 }, // D
        { wch: 15 }, // E
        { wch: 15 }, // F
        { wch: 15 }  // G
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Proyeccion 2024-2028");

    // 3. Download
    XLSX.writeFile(wb, "Garaje_Salma_Proyeccion_Financiera.xlsx");
}
