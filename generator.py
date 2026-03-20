"""
generator.py
This module generates drug-like molecules using chemical heuristics and predefined scaffolds.
NO MACHINE LEARNING is used here. We simulate intelligence by hardcoding known chemical rules 
and assembling fragments that are typical for specific disease targets.
"""

from rdkit import Chem
from rdkit.Chem import AllChem
import random

def generate_molecules(target, num_molecules=5):
    """
    Generates a list of SMILES strings tailored toward a specific target protein.
    """
    # 1. Define target-specific core scaffolds (SMILES format)
    # We use chemical intuition to select backbones typical for these diseases.
    scaffolds = {
        "Cancer": [
            "c1ncnc2[nH]cnc12", # Purine (Common kinase inhibitor core)
            "c1cc(Nc2ncnc3ccccc23)ccc1", # Quinazoline derivative
            "C1=CC=C(C=C1)C2=NC=NC3=C2C=CC=C3" # Another kinase-like core
        ],
        "COVID": [
            "O=C(NCc1ccccc1)c2ccccc2O", # Simple phenolic amide (protease inhibitor-like)
            "CC(C)(C)C(NC(=O)C(F)(F)F)C(=O)NCC1CCC1", # Peptidomimetic backbone
            "N#Cc1ccc(cc1)C(=O)N2CCC(CC2)c3ccccc3" # Covalent modifier like (Nitrile)
        ],
        "Diabetes": [
            "O=c1[nH]c(=O)n(C)c2cncn12", # Xanthine core (DPP-4 inhibitor-like)
            "C1CC(=O)NC1=O", # Succinimide derivative
            "OC1C(O)C(O)C(C(O)C1)c2ccc(cc2)Cc3ccccc3" # Phlorizin derivative (SGLT2 inhibitor-like)
        ]
    }
    
    # Default to a simple benzene ring if the target is unknown
    target_scaffolds = scaffolds.get(target, ["c1ccccc1"])
    
    # 2. Define functional groups to attach for variation
    functional_groups = [
        "C",       # Methyl
        "F",       # Fluoro
        "Cl",      # Chloro
        "OC",      # Methoxy
        "C(F)(F)F",# Trifluoromethyl
        "C#N",     # Cyano
        "N(C)C",   # Dimethylamino
        "S(=O)(=O)C" # Methylsulfonyl
    ]
    
    generated_smiles = []
    
    # 3. Generate molecules by varying the core scaffolds
    for _ in range(num_molecules):
        # Pick a random scaffold for the target
        core_smi = random.choice(target_scaffolds)
        core_mol = Chem.MolFromSmiles(core_smi)
        
        # NOTE: For a real rigorous combinatorial generation, we'd use targeted chemical reactions.
        # But for this hackathon simulation, we'll append a random functional group via string manipulation 
        # as a naive heuristic, and rely on RDKit to clean and validate it.
        # RDKit will reject it if it breaks valence rules.
        
        # We try a few times to get a valid molecule
        valid_mol = False
        attempts = 0
        while not valid_mol and attempts < 10:
            attempts += 1
            # Pick a group
            group = random.choice(functional_groups)
            
            # Simple heuristic attachment: attach to a carbon ring (very naive, simulating diversity)
            # Find all lowercase 'c' or uppercase 'C' (aromatic/aliphatic carbons)
            chars = list(core_smi)
            carbon_indices = [i for i, c in enumerate(chars) if c in ('c', 'C')]
            
            if carbon_indices:
                attach_point = random.choice(carbon_indices)
                # Insert the sidechain wrapped in parentheses to indicate branching in SMILES
                chars.insert(attach_point + 1, f"({group})")
                mutated_smi = "".join(chars)
                
                # Check if this mutated string is valid chemistry using RDKit
                test_mol = Chem.MolFromSmiles(mutated_smi)
                if test_mol is not None:
                    # Sanitize to ensure strict chemical validity
                    Chem.SanitizeMol(test_mol)
                    canonical_smiles = Chem.MolToSmiles(test_mol)
                    # Don't add duplicates
                    if canonical_smiles not in generated_smiles:
                        generated_smiles.append(canonical_smiles)
                        valid_mol = True

    return generated_smiles

# Example test:
# if __name__ == "__main__":
#     print(generate_molecules("Cancer", 3))
