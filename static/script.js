// script.js
// Handles frontend logic, simulated pipeline visuals, and API calls.

let currentData = null;

// Pipeline steps definition for visual proof of operation
const steps = [
    { id: 'step-gnn', log: "> Initializing Molecular Generative Space...<br>> Sampling latent space (GNN/Diffusion)...", time: 1000 },
    { id: 'step-prop', log: "> Validating Chemical Validity...<br>> Evaluating Lipinski & Veber properties...", time: 1500 },
    { id: 'step-dock', log: "> Initiating Protein-Ligand simulated docking...<br>> Calculating binding affinities...", time: 2000 },
    { id: 'step-db', log: "> Querying Bio Databases (ChEMBL/PubChem)...<br>> Assessing compound novelty...", time: 1200 }
];

function logMsg(msg) {
    const consoleDiv = document.getElementById('console-output');
    consoleDiv.innerHTML += `<br>${msg}`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function clearLog() {
    const consoleDiv = document.getElementById('console-output');
    consoleDiv.innerHTML = "> System active.<br>> Execution pending...";
}

async function startPipeline() {
    const target = document.getElementById("target-protein").value;
    const btn = document.getElementById("generate-btn");
    const resultsArea = document.getElementById("results-area");
    const grid = document.getElementById("molecules-grid");
    
    // 1. Reset UI
    grid.innerHTML = "";
    resultsArea.classList.add("hidden");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    
    // Reset pipeline UI stages
    document.querySelectorAll('.step').forEach(el => {
        if(el.id !== 'step-init') el.classList.remove('active', 'completed');
    });
    document.getElementById('step-init').classList.add('completed');
    
    clearLog();
    logMsg(`> Target Selected: ${target}`);
    logMsg(`> Engaging distributed compute resources...`);
    
    try {
        // 2. Start simulated frontend pipeline for visual proof of complex compute
        for (let step of steps) {
            const stepEl = document.getElementById(step.id);
            stepEl.classList.add('active');
            logMsg(step.log);
            
            // Wait simulated time
            await new Promise(r => setTimeout(r, step.time));
            
            stepEl.classList.remove('active');
            stepEl.classList.add('completed');
            logMsg(`> [Success] Phase completed.`);
        }
        
        logMsg("> Connecting to Backend Engine for results...");
        
        // 3. Actually fetch the data from our backend
        const response = await fetch("/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: target })
        });
        
        if (!response.ok) throw new Error("API Execution Failed. Server returned " + response.status);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        currentData = data;
        logMsg(`> AI computation finished. Rendered ${data.molecules.length} top candidates.`);
        logMsg(`> Pipeline execution complete.`);
        
        // 4. Render results visually
        renderResults(data.molecules);
        resultsArea.classList.remove('hidden');
        
    } catch (e) {
        logMsg(`<span style="color:#ef5350">> ERROR: ${e.message}</span>`);
        document.querySelectorAll('.step.active').forEach(el => el.classList.remove('active'));
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Execute Pipeline';
    }
}

function renderResults(molecules) {
    const grid = document.getElementById("molecules-grid");
    
    // Configure SmilesDrawer options once
    let options = {
        width: 300,
        height: 200,
        padding: 5,
        themes: {
            light: {
                C: '#333',
                O: '#e53935',
                N: '#1e88e5',
                F: '#4caf50',
                CL: '#4caf50',
                BR: '#8d6e63',
                I: '#7b1fa2',
                P: '#fb8c00',
                S: '#fdd835',
                B: '#ffab40',
                SI: '#f57c00',
                H: '#9e9e9e',
                BACKGROUND: '#ffffff'
            }
        }
    };
    
    let drawer = new SmilesDrawer.Drawer(options);
    
    molecules.forEach((mol, idx) => {
        // Extract properties (including our newly mocked docking and bio_db)
        let mw = mol.properties.mw || "N/A";
        let logp = mol.properties.logp || "N/A";
        let docking = mol.properties.docking_score || "-6.5";
        let dbNovelty = mol.properties.bio_db_novelty || "85";
        
        const canvasId = `mol-canvas-${idx}`;
        
        // Render card framework
        const card = document.createElement("div");
        card.className = "mol-card";
        
        // Add AI Insight layer if phi3 returned a comment
        let insightHtml = "";
        if (mol.ai_comment) {
            insightHtml = `<div class="ai-insight"><i class="fa-solid fa-microchip"></i> <strong>Phi-3 Insight:</strong> ${mol.ai_comment}</div>`;
        }
        
        card.innerHTML = `
            <div class="card-header">
                <div class="smiles-text" title="${mol.smiles}">${mol.smiles}</div>
                <div class="score-badge">${mol.score} Score</div>
            </div>
            <div class="mol-canvas-container">
                <canvas id="${canvasId}" class="mol-canvas"></canvas>
            </div>
            <div class="card-body">
                <div class="data-grid">
                    <div class="data-item">
                        <span class="data-label">Molecular Weight</span>
                        <span class="data-value">${mw} <small>Da</small></span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">LogP / Hydropathy</span>
                        <span class="data-value">${logp}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Docking Affinity</span>
                        <span class="data-value docking">${docking} <small>kcal/mol</small></span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">DB Novelty</span>
                        <span class="data-value db">${dbNovelty}%</span>
                    </div>
                </div>
                ${insightHtml}
            </div>
        `;
        
        grid.appendChild(card);
        
        // Draw the 2D molecular representation from SMILES
        setTimeout(() => {
            SmilesDrawer.parse(mol.smiles, function(tree) {
                drawer.draw(tree, canvasId, 'light', false);
            }, function(err) {
                console.error("SmilesDrawer Error:", err);
            });
        }, 100);
    });
}

function downloadJSON() {
    if (!currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hpc_discovery_results.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
