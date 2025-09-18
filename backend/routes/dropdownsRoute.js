const express = require('express');
const { 
  addBrand,
  getBrands,
  updateBrand,
  deleteBrand,
  addSpecification,
  getSpecifications,
  updateSpecification,
  deleteSpecification,
  addSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier
} = require('../controllers/dropdownsController');

const router = express.Router();

// Brands routes
router.post('/brands', addBrand);          
router.get('/brands', getBrands);            
router.put('/brands/:id', updateBrand);     
router.delete('/brands/:id', deleteBrand);

// Specifications routes
router.post('/specifications', addSpecification);          
router.get('/specifications', getSpecifications);            
router.put('/specifications/:id', updateSpecification);     
router.delete('/specifications/:id', deleteSpecification);

// Suppliers routes
router.post('/suppliers', addSupplier);          
router.get('/suppliers', getSuppliers);            
router.put('/suppliers/:id', updateSupplier);     
router.delete('/suppliers/:id', deleteSupplier);

module.exports = router;