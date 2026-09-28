// Initialize Lucide icons
lucide.createIcons();

// State
let appData = {};
let map;
let geojsonLayer;

// Wait for DOM
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    fetchOverviewData();
    initMap();
    
    // Default search load
    searchRepository('');
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav li");
    const views = document.querySelectorAll(".view");
    
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetView = item.getAttribute("data-view");
            switchView(targetView);
        });
    });
}

function switchView(viewId) {
    document.querySelectorAll(".sidebar-nav li").forEach(li => li.classList.remove("active"));
    document.querySelector(`.sidebar-nav li[data-view="${viewId}"]`).classList.add("active");
    
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(`view-${viewId}`).classList.add("active");
    
    // Trigger map resize if GIS view is opened
    if(viewId === 'gis' && map) {
        setTimeout(() => { map.invalidateSize(); }, 200);
    }
}

// Fetch Overview Data
async function fetchOverviewData() {
    try {
        const response = await fetch("/api/overview");
        appData = await response.json();
        
        // Populate KPIs
        const kpiGrid = document.getElementById("kpi-grid");
        kpiGrid.innerHTML = `
            <div class="kpi-card"><h4>Land Records</h4><div class="value">${appData.kpis.landRecords}</div></div>
            <div class="kpi-card"><h4>Research Documents</h4><div class="value">${appData.kpis.researchDocuments}</div></div>
            <div class="kpi-card"><h4>GIS Layers</h4><div class="value">${appData.kpis.gisLayers}</div></div>
            <div class="kpi-card"><h4>Policy Scenarios</h4><div class="value">${appData.kpis.policyScenarios}</div></div>
        `;
        
        // Populate Study Stats
        const studyStats = document.getElementById("study-stats");
        studyStats.innerHTML = `
            <li><span>Built-up expansion:</span> <strong class="pos">${appData.study.builtupExpansion}</strong></li>
            <li><span>Agricultural land:</span> <strong class="neg">${appData.study.agriculturalLand}</strong></li>
            <li><span>Population growth:</span> <strong>${appData.study.populationGrowth}</strong></li>
            <li><span>Infrastructure growth:</span> <strong>${appData.study.infrastructureGrowth}</strong></li>
        `;
        
        initCharts(appData.landUseChange);
        
    } catch(e) {
        console.error("Error fetching overview data", e);
    }
}

// Charts
function initCharts(data) {
    // Overview Line Chart
    const ctx1 = document.getElementById('landUseChart').getContext('2d');
    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: data.years,
            datasets: [
                { label: 'Built-up', data: data.builtup, borderColor: '#f87171', backgroundColor: '#f87171', tension: 0.1 },
                { label: 'Agriculture', data: data.agriculture, borderColor: '#4ade80', backgroundColor: '#4ade80', tension: 0.1 },
                { label: 'Water', data: data.water, borderColor: '#60a5fa', backgroundColor: '#60a5fa', tension: 0.1 }
            ]
        },
        options: {
            responsive: true,
            color: '#94a3b8',
            scales: {
                y: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });

    // Analytics Distribution Chart
    const ctx2 = document.getElementById('distChart').getContext('2d');
    new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Agriculture', 'Built-up', 'Water', 'Other'],
            datasets: [{
                data: [50, 32, 8, 10],
                backgroundColor: ['#4ade80', '#f87171', '#60a5fa', '#facc15'],
                borderWidth: 0
            }]
        },
        options: {
            plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } }
        }
    });

    // Analytics Expansion Chart
    const ctx3 = document.getElementById('expansionChart').getContext('2d');
    new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: data.years,
            datasets: [{
                label: 'Built-up Area (%)',
                data: data.builtup,
                backgroundColor: '#f87171'
            }]
        },
        options: {
            scales: {
                y: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: '#475569' }, ticks: { color: '#94a3b8' } }
            },
            plugins: { legend: { labels: { color: '#f8fafc' } } }
        }
    });
}

// Research Repository
async function searchRepository(q = null) {
    const query = q !== null ? q : document.getElementById("repo-search").value;
    try {
        const response = await fetch(`/api/research/search?q=${query}`);
        const data = await response.json();
        
        const container = document.getElementById("repo-results");
        container.innerHTML = "";
        
        data.forEach(item => {
            const tagsHtml = item.tags.map(t => `<span class="badge" style="background:#334155;">${t}</span>`).join(" ");
            const html = `
                <div class="repo-card">
                    <div class="badge demo-data-badge">${item.type}</div>
                    <h3>${item.title}</h3>
                    <p style="color:var(--text-secondary); margin-bottom:12px;">${item.desc}</p>
                    <div style="margin-bottom:12px;">${tagsHtml}</div>
                    <button class="btn outline" onclick="openEvidenceModal('${item.id}', '${item.type}', '${item.title}', '${item.evidence}')">View Evidence</button>
                </div>
            `;
            container.innerHTML += html;
        });
    } catch(e) {
        console.error(e);
    }
}

// AI Assistant
async function askAi(question) {
    if(!question) return;
    document.getElementById("ai-input").value = question;
    
    const responseArea = document.getElementById("chat-response-area");
    responseArea.style.display = "block";
    document.getElementById("ai-q").innerText = "Q: " + question;
    document.getElementById("ai-a").innerText = "Analyzing...";
    
    try {
        const response = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });
        const data = await response.json();
        
        document.getElementById("ai-a").innerText = data.answer;
        
        const evidenceList = document.getElementById("ai-evidence-list");
        evidenceList.innerHTML = "";
        data.findings.forEach((f, idx) => {
            evidenceList.innerHTML += `
                <div class="evidence-item">
                    <div style="font-size:1.5rem;">${f.icon}</div>
                    <div>
                        <strong>Finding ${idx+1}:</strong> ${f.title}<br>
                        <span style="color:var(--text-secondary); font-size:0.85rem;">Source: ${f.source}</span>
                    </div>
                </div>
            `;
        });
    } catch(e) {
        console.error(e);
    }
}

// GIS Map
function initMap() {
    // Center roughly on Madurai
    map = L.map('map').setView([9.9252, 78.1198], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map);

    // Dummy polygons for demo
    const dummyGeoJson = {
        "type": "FeatureCollection",
        "features": [
            { "type": "Feature", "properties": { "type": "agriculture", "color": "#4ade80", "desc": "Agricultural Zone A" }, "geometry": { "type": "Polygon", "coordinates": [[[78.10, 9.95], [78.15, 9.95], [78.15, 9.90], [78.10, 9.90], [78.10, 9.95]]] } },
            { "type": "Feature", "properties": { "type": "builtup", "color": "#f87171", "desc": "Urban Expansion Area" }, "geometry": { "type": "Polygon", "coordinates": [[[78.12, 9.93], [78.14, 9.93], [78.14, 9.91], [78.12, 9.91], [78.12, 9.93]]] } }
        ]
    };
    
    geojsonLayer = L.geoJSON(dummyGeoJson, {
        style: function (feature) {
            return { color: feature.properties.color, weight: 2, fillOpacity: 0.5 };
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup(`<strong>${feature.properties.desc}</strong><br>Type: ${feature.properties.type}<br><em>Demo Data Polygon</em>`);
        }
    }).addTo(map);
    
    // Handle year toggles
    document.querySelectorAll(".year-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            // In a real app, we would load different geojson here.
        });
    });
}

// Simulation
async function runSimulation() {
    const agProtect = document.getElementById("slider-ag").value;
    const devRest = document.getElementById("slider-dev").value;
    const infraExp = document.getElementById("slider-infra").value;
    
    try {
        const response = await fetch("/api/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agProtect, devRest, infraExp })
        });
        const data = await response.json();
        
        document.getElementById("sim-results").style.display = "block";
        
        const tbody = document.getElementById("sim-table-body");
        tbody.innerHTML = `
            <tr><td>Agricultural Land</td><td style="text-align:right">${data.baseline.agriculture}%</td><td style="text-align:right">${data.proposed.agriculture}%</td></tr>
            <tr><td>Built-up Land</td><td style="text-align:right">${data.baseline.builtup}%</td><td style="text-align:right">${data.proposed.builtup}%</td></tr>
            <tr><td>Water</td><td style="text-align:right">${data.baseline.water}%</td><td style="text-align:right">${data.proposed.water}%</td></tr>
            <tr><td>Other</td><td style="text-align:right">${data.baseline.other}%</td><td style="text-align:right">${data.proposed.other}%</td></tr>
        `;
        
        const estAg = document.getElementById("est-ag");
        estAg.innerText = data.change.agriculture;
        estAg.className = `est-val ${data.change.agriculture.includes('-') ? 'negative' : 'positive'}`;
        
        const estBuiltup = document.getElementById("est-builtup");
        estBuiltup.innerText = data.change.builtup;
        estBuiltup.className = `est-val ${data.change.builtup.includes('+') ? 'positive' : 'negative'}`; // Actually builtup expansion could be seen as negative visually for environment, but let's just color it
        if(data.change.builtup.includes('-')) estBuiltup.style.color = 'var(--success)';
        else estBuiltup.style.color = 'var(--danger)';
        
    } catch(e) {
        console.error(e);
    }
}

// Modal
function openEvidenceModal(id, type="Insight", title="Evidence Detail", evidence="This evidence is part of the prototype's demo dataset.") {
    const modal = document.getElementById("evidenceModal");
    const content = document.getElementById("modal-body-content");
    
    content.innerHTML = `
        <div class="badge demo-data-badge">SUPPORTED BY</div>
        <h4>${type}</h4>
        <p style="color:var(--text-secondary); margin-bottom: 16px;">${title}</p>
        
        <div style="background:var(--bg-card); padding:16px; border-radius:6px;">
            <strong>Relevant Evidence:</strong>
            <p>${evidence}</p>
        </div>
        
        <p style="margin-top:20px; font-size:0.85rem; color:var(--text-secondary);">
            <em>NOTE: This evidence is part of the prototype's demo dataset.</em>
        </p>
    `;
    
    modal.classList.add("active");
}

function closeEvidenceModal() {
    document.getElementById("evidenceModal").classList.remove("active");
}
