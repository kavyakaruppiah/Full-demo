# LANDiQ

**AI-Powered Land Governance Intelligence & Policy Innovation Platform**

## 1. Project Overview
LANDiQ is an evidence-based decision support system designed to bridge the gap between fragmented land data, GIS intelligence, and policy innovation. This prototype demonstrates a complete workflow from analyzing raw land-use datasets to generating policy scenarios for Urban Agricultural Land Conversion in Tamil Nadu.

## 2. Problem
National Digital Platform for Research, Policy Innovation, and Evidence-Based Land Governance (SIH26019). Policymakers often struggle to make informed decisions due to siloed data, lack of traceability in research, and the difficulty of forecasting policy impacts on spatial environments.

## 3. Solution
LANDiQ provides a unified dashboard that:
- Aggregates research and datasets.
- Offers an AI Research Assistant with RAG (Retrieval-Augmented Generation) simulation for grounded answers.
- Visualizes GIS data.
- Provides a Policy Scenario Simulator to estimate the impact of different policy assumptions.

## 4. Architecture
- **Frontend:** HTML, CSS, JavaScript (Vanilla, no complex build systems)
- **Backend:** Python Flask
- **Libraries:** Chart.js (Analytics), Leaflet.js (GIS Mapping), Lucide (Icons)

## 5. Features
- **Overview Dashboard:** High-level KPIs and trends.
- **Research Repository:** Searchable demo database of papers and policies.
- **AI Research Assistant:** Chat interface demonstrating grounded, evidence-backed answers.
- **GIS Intelligence:** Interactive map with historical land-use comparisons.
- **Governance Analytics:** Charts and AI-generated insights.
- **Policy Simulator:** Adjustable sliders to simulate policy impacts on land use.
- **Evidence Dashboard:** A traceable workflow from problem to decision support.

## 6. Installation
Ensure you have Python installed, then install the dependencies:
```bash
pip install -r requirements.txt
```

## 7. Running Locally
Run the Flask server:
```bash
python app.py
```
Then navigate to `http://localhost:5000` in your web browser.

## 8. Demo Flow
1. Start at the **Overview** to show the scale of the platform.
2. Navigate to **Research Repository** and search for "Urban land-use".
3. Use the **AI Research Assistant** to ask "Why is agricultural land decreasing?" and show the evidence links.
4. Open the **GIS Intelligence** tab to toggle map layers.
5. Finally, use the **Policy Simulator** to run a scenario and compare baseline vs. proposed outcomes.

## 9. Demo Data Disclaimer
⚠️ **All data in this prototype is illustrative.** It is intended solely for prototype demonstration and does not represent official government findings, real-time satellite analysis, or scientifically validated predictions. The AI interactions are simulated to demonstrate the intended RAG workflow.

## 10. Future Enhancements
- Integration with real LLMs and vector databases.
- Live satellite imagery ingestion (e.g., Sentinel/Landsat).
- Advanced scientific modeling for policy simulation.
- Authentication and real user roles.
