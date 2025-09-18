const { default: mongoose } = require('mongoose');
const Brand = require('../models/brandsModel');
const Specification = require('../models/specificationsModel');
const Supplier = require('../models/supplierModel');

// Add a new brand
const addBrand = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Brand name is required" });
  }

  try {
    // check if brand already exists
    const existingBrand = await Brand.findOne({ name: name.trim() });
    if (existingBrand) {
      return res.status(400).json({ error: "Brand already exists" });
    }

    const brand = await Brand.create({ name: name.trim() });
    res.status(201).json({ brand, message: "Brand added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add brand" });
  }
};

// Get all brands (with optional search)
const getBrands = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" }; // case-insensitive search
    }

    const brands = await Brand.find(query).sort({ createdAt: -1 });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};

// Update a brand
const updateBrand = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid brand ID" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Brand name is required" });
  }

  try {
    const existingBrand = await Brand.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingBrand) {
      return res.status(400).json({ error: "Another brand with this name already exists" });
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.status(200).json({ updatedBrand, message: "Brand updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update brand" });
  }
};

// Delete a brand
const deleteBrand = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid brand ID" });
  }

  try {
    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (!deletedBrand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.status(200).json({ message: `${deletedBrand.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete brand" });
  }
};

const addSpecification = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Specification name is required" });
  }

  try {
    // check if specification already exists
    const existingSpecification = await Specification.findOne({ name: name.trim() });
    if (existingSpecification) {
      return res.status(400).json({ error: "Specification already exists" });
    }

    const specification = await Specification.create({ name: name.trim() });
    res.status(201).json({ specification, message: "Specification added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add specification" });
  }
};

// Get all specifications (with optional search)
const getSpecifications = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" }; // case-insensitive search
    }

    const specifications = await Specification.find(query).sort({ createdAt: -1 });
    res.status(200).json(specifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch specifications" });
  }
};

// Update a specification
const updateSpecification = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid specification ID" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Specification name is required" });
  }

  try {
    const existingSpecification = await Specification.findOne({ 
      name: name.trim(), 
      _id: { $ne: id } 
    });
    if (existingSpecification) {
      return res.status(400).json({ error: "Another specification with this name already exists" });
    }

    const updatedSpecification = await Specification.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedSpecification) {
      return res.status(404).json({ error: "Specification not found" });
    }

    res.status(200).json({ 
      updatedSpecification, 
      message: "Specification updated successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update specification" });
  }
};

// Delete a specification
const deleteSpecification = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid specification ID" });
  }

  try {
    const deletedSpecification = await Specification.findByIdAndDelete(id);
    if (!deletedSpecification) {
      return res.status(404).json({ error: "Specification not found" });
    }

    res.status(200).json({ message: `${deletedSpecification.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete specification" });
  }
};

// Add a new supplier
const addSupplier = async (req, res) => {
  const { name, contactPerson, email, phone, address } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  try {
    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({ name: name.trim() });
    if (existingSupplier) {
      return res.status(400).json({ error: "Supplier already exists" });
    }

    const supplier = await Supplier.create({ 
      name: name.trim(),
      contactPerson: contactPerson?.trim(),
      email: email?.trim(),
      phone: phone?.trim(),
      address: address?.trim()
    });
    
    res.status(201).json({ supplier, message: "Supplier added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add supplier" });
  }
};

// Get all suppliers (with optional search)
const getSuppliers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
};

// Update a supplier
const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, contactPerson, email, phone, address } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid supplier ID" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  try {
    const existingSupplier = await Supplier.findOne({ 
      name: name.trim(), 
      _id: { $ne: id } 
    });
    
    if (existingSupplier) {
      return res.status(400).json({ error: "Another supplier with this name already exists" });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { 
        name: name.trim(),
        contactPerson: contactPerson?.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        address: address?.trim()
      },
      { new: true }
    );

    if (!updatedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(200).json({ 
      updatedSupplier, 
      message: "Supplier updated successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update supplier" });
  }
};

// Delete a supplier
const deleteSupplier = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid supplier ID" });
  }

  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.status(200).json({ message: `${deletedSupplier.name} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete supplier" });
  }
};

module.exports = {
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
};
