const express = require('express');
const { createMaterial, getMaterials, deleteMaterial, getOneMaterial, updateMaterial } = require('../controllers/materialsController');

const router = express.Router();

// Get all materials
router.get('/', getMaterials);

// Get specific material by ID
router.get('/:id', getOneMaterial);

// Create a new material
router.post('/', createMaterial);

// Delete a material by ID
router.delete('/:id', deleteMaterial);

// Update a material by ID
router.patch('/:id', updateMaterial);

module.exports = router;
