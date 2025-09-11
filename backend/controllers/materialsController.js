const { default: mongoose } = require('mongoose');
const Material = require('../models/materialsModel');

// Get all materials
const getMaterials = async(req, res) => {
  try {
    const materials = await Material.find({}).sort({createdAt: -1})
    res.status(200).json(materials)
  } catch (error) {
    res.status(404).json({error: error.message})
  }
}

// Create a new material
const createMaterial = async(req, res) => {
  const { description, unit, cost, specifications, supplier, brand} = req.body;


  try {
    // Create the material with all fields, including specifications, brand, and supplier
    const material = await Material.create({
      description,
      unit,
      cost,
      specifications,
      supplier,
      brand,     
    });
    
    res.status(200).json(material);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

// Get a single material
const getOneMaterial = async (req, res) => {
  const { id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'ID does not exist'});
  }

  const material = await Material.findById(id);

  if(!material) {
    return res.status(404).json({error: 'Material does not exist'});
  }

  res.status(200).json(material);
}

// Delete a material
const deleteMaterial = async (req, res) => {
  const { id } = req.params;

  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'ID does not exist'});
  }

  try {
    const deletedMaterial = await Material.findOneAndDelete({ _id: id });
    if(!deletedMaterial) {
      return res.status(404).json({error: 'Material does not exist'});
    }
    res.status(200).json({message: `${deletedMaterial.description} is deleted`});
  } catch (error) {
    res.status(500).json({error: 'Error occurred while deleting'});
  }
}

// Update a material
const updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { description, unit, cost, specifications, supplier, brand} = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'ID does not exist' });
  }

  try {
    const updatedMaterial = await Material.findOneAndUpdate(
      { _id: id },
      { description, unit, cost, specifications, supplier, brand},
      { new: true }
    );

    if (!updatedMaterial) {
      return res.status(404).json({ error: 'Material does not exist' });
    }

    res.status(200).json({ updatedMaterial, message: 'Material updated successfully' });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
};

module.exports = {
  createMaterial,
  getMaterials,
  deleteMaterial,
  getOneMaterial,
  updateMaterial
}
