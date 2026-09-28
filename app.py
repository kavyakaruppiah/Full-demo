import os
import sqlite3
from flask import Flask, jsonify, request, render_template

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

DB_PATH = os.path.join(os.path.dirname(__file__), 'app.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kpis (
            id INTEGER PRIMARY KEY,
            landRecords TEXT,
            researchDocuments TEXT,
            gisLayers TEXT,
            policyScenarios TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS research (
            id TEXT PRIMARY KEY,
            title TEXT,
            type TEXT,
            tags TEXT,
            desc TEXT,
            evidence TEXT
        )
    ''')
    cursor.execute('SELECT COUNT(*) FROM kpis')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
            INSERT INTO kpis (landRecords, researchDocuments, gisLayers, policyScenarios)
            VALUES (?, ?, ?, ?)
        ''', ("12,480", "248", "16", "24"))
        
        research_docs = [
            ("doc1", "Urban Expansion and Agricultural Land Conversion", "Research Paper", "GIS,Urbanization,Agriculture", "Study of how urban boundaries push into agricultural zones in the Madurai region over the last decade.", "Built-up land increased by 18.4%."),
            ("doc2", "District Land Use Planning Report", "Government Report", "Planning,Madurai,Zoning", "Official report on zoning constraints and future urbanization plans.", "Zoning maps show 10% overlap with existing farms."),
            ("doc3", "Madurai Land Use — 2015–2025", "Dataset", "Land Use,GIS,Demo", "Decadal land use changes categorized by primary land type.", "Historical polygons for 2015, 2020, 2025."),
            ("doc4", "Tamil Nadu Urban Development Guidelines", "Policy Document", "Policy,Urban,Infrastructure", "Guidelines for infrastructure development and land conversion approvals.", "Infrastructure growth allowance of up to 25%.")
        ]
        cursor.executemany('''
            INSERT INTO research (id, title, type, tags, desc, evidence)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', research_docs)
    conn.commit()
    conn.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/overview")
def get_overview():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT landRecords, researchDocuments, gisLayers, policyScenarios FROM kpis LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    
    return jsonify({
        "kpis": {
            "landRecords": row[0] if row else "0",
            "researchDocuments": row[1] if row else "0",
            "gisLayers": row[2] if row else "0",
            "policyScenarios": row[3] if row else "0"
        },
        "study": {
            "builtupExpansion": "+18.4%",
            "agriculturalLand": "-11.7%",
            "populationGrowth": "+14.2%",
            "infrastructureGrowth": "+21.5%"
        },
        "landUseChange": {
            "years": [2015, 2020, 2025],
            "builtup": [21, 26, 32],
            "agriculture": [62, 57, 50],
            "water": [9, 9, 8],
            "other": [8, 8, 10]
        }
    })

@app.route("/api/research/search")
def search_research():
    query = request.args.get("q", "").lower()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, title, type, tags, desc, evidence FROM research')
    rows = cursor.fetchall()
    conn.close()
    
    data = []
    for row in rows:
        data.append({
            "id": row[0],
            "title": row[1],
            "type": row[2],
            "tags": row[3].split(','),
            "desc": row[4],
            "evidence": row[5]
        })
        
    if query:
        data = [d for d in data if query in d["title"].lower() or query in d["desc"].lower() or any(query in tag.lower() for tag in d["tags"])]
    return jsonify(data)

@app.route("/api/ask", methods=["POST"])
def ask_assistant():
    req = request.json or {}
    question = req.get("question", "")
    return jsonify({
        "question": question,
        "answer": "Agricultural land conversion in the selected study region is associated with increasing built-up expansion, population growth and infrastructure development.",
        "findings": [
            {"title": "Built-up land increased during the analysed period.", "source": "Madurai Land Use Dataset", "icon": "📄"},
            {"title": "Population growth occurred alongside urban expansion.", "source": "Demo Population Dataset", "icon": "📊"},
            {"title": "Infrastructure expansion overlaps with several converted land-use zones.", "source": "GIS Infrastructure Layer", "icon": "🗺️"}
        ]
    })

@app.route("/api/simulate", methods=["POST"])
def simulate():
    req = request.json or {}
    ag_protect = int(req.get("agProtect", 40))
    dev_rest = int(req.get("devRest", 20))
    infra_exp = int(req.get("infraExp", 50))
    
    baseline = {"agriculture": 52, "builtup": 31, "water": 8, "other": 9}
    
    prop_ag = baseline["agriculture"] + (ag_protect - 40) * 0.15 - (infra_exp - 50) * 0.05
    prop_builtup = baseline["builtup"] - (dev_rest - 20) * 0.12 + (infra_exp - 50) * 0.08
    prop_water = baseline["water"]
    prop_other = 100 - (prop_ag + prop_builtup + prop_water)
    
    return jsonify({
        "baseline": baseline,
        "proposed": {
            "agriculture": round(prop_ag),
            "builtup": round(prop_builtup),
            "water": round(prop_water),
            "other": round(prop_other)
        },
        "change": {
            "agriculture": f"{'+' if prop_ag - baseline['agriculture'] >= 0 else ''}{round(prop_ag - baseline['agriculture'])}%",
            "builtup": f"{'+' if prop_builtup - baseline['builtup'] >= 0 else ''}{round(prop_builtup - baseline['builtup'])}%"
        }
    })

init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
