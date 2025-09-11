import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuthContext } from "../hooks/useAuthContext";
import Navbar from "../components/Navbar";
import ConfirmDeleteMaterialModal from "../components/ConfirmDeleteMaterialModal";

// Valid units, specifications, supplier, and brand for the dropdowns
const validbrand = [
  'brand a','brand b','brand c','brand d','brand e'
];
const validSpecifications = [
  's1','s2','s3','s4','s5'
];
const validSupplier = [
  'supplier a','supplier b','supplier c','supplier d','supplier e'
];
const validUnits = [
  'lot', 'cu.m', 'bags', 'pcs', 'shts', 'kgs', 'gal', 'liters',
  'set', 'm', 'L-m', 'sheets', 'pieces', 'meters', 'bar', 'tin', 'tubes', 'boxes'
];

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [editedMaterial, setEditedMaterial] = useState({
    description: '',
    unit: '',
    cost: 0,
    specifications: '',
    supplier: '',
    brand: '',
  });
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [newMaterial, setNewMaterial] = useState({
    description: '',
    unit: validUnits[0],
    cost: 0,
    specifications: '',
    supplier: '',
    brand: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);

  useEffect(() => {
    if (!user || !user.token) return;

    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:4000/api/materials", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setMaterials(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching materials:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [user]);

  const handleEdit = (material) => {
    setIsEditing(material._id);
    setEditedMaterial({
      description: material.description,
      unit: material.unit,
      cost: material.cost === 0 ? "" : material.cost,
      supplier: material.supplier,
      brand: material.brand,
      specifications: material.specifications,
    });
  };

  const handleSave = async (id) => {
    try {
      const updatedMaterial = {
        ...editedMaterial,
        cost: editedMaterial.cost === "" ? 0 : editedMaterial.cost
      };
      await axios.patch(`http://localhost:4000/api/materials/${id}`, updatedMaterial, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setMaterials((prevMaterials) =>
        prevMaterials.map((material) =>
          material._id === id ? { ...material, ...updatedMaterial } : material
        )
      );
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating material:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/api/materials/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setMaterials((prevMaterials) => prevMaterials.filter((material) => material._id !== id));
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filterMaterials = () => {
    if (!searchTerm) return materials;

    return materials.filter(
      (material) =>
        material.description &&
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleCreate = async () => {
    try {
      if (!newMaterial.description || !newMaterial.unit || newMaterial.cost < 0 || !newMaterial.specifications || !newMaterial.supplier || !newMaterial.brand) {
        console.error('All fields are required, cost cannot be negative must be valid.');
        return;
      }

      const response = await axios.post("http://localhost:4000/api/materials", newMaterial, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setMaterials((prevMaterials) => [...prevMaterials, response.data]);
      setNewMaterial({
        description: '',
        unit: validUnits[0],
        cost: 0,
        specifications: '',
        supplier: '',
        brand: '',
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating material:', error.response?.data || error.message);
    }
  };

  const filteredMaterials = filterMaterials();

  const openConfirmDeleteModal = (material) => {
    setMaterialToDelete(material);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      handleDelete(materialToDelete._id);
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
          Materials
        </Typography>
        <TextField
          label="Search materials..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Typography variant="body1" sx={{ mb: 2 }}>
          Total Materials: {filteredMaterials.length}
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsModalOpen(true)}
          sx={{ backgroundColor: "#3f5930", "&:hover": { backgroundColor: "#6b7c61" }, mb: 2 }}
        >
          Create New Material
        </Button>

        {loading ? (
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading materials...
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Material</strong></TableCell>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell><strong>Unit Cost</strong></TableCell>
                  <TableCell><strong>Specifications</strong></TableCell>
                  <TableCell><strong>Supplier</strong></TableCell>
                  <TableCell><strong>brand</strong></TableCell>
                  <TableCell><strong>Date Created</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material._id}>
                    <TableCell>
                      {isEditing === material._id ? (
                        <TextField
                          variant="outlined"
                          value={editedMaterial.description}
                          onChange={(e) => setEditedMaterial({ ...editedMaterial, description: e.target.value })}
                          fullWidth
                        />
                      ) : (
                        material.description
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === material._id ? (
                        <FormControl fullWidth>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={editedMaterial.unit}
                            onChange={(e) => setEditedMaterial({ ...editedMaterial, unit: e.target.value })}
                          >
                            {validUnits.map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        material.unit
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === material._id ? (
                        <TextField
                          type="number"
                          variant="outlined"
                          value={editedMaterial.cost === "" ? "" : editedMaterial.cost}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditedMaterial({
                              ...editedMaterial,
                              cost: value === "" ? "" : Math.max(0, parseFloat(value) || 0),
                            });
                          }}
                          fullWidth
                        />
                      ) : (
                        `₱${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.cost)}`
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === material._id ? (
                        <FormControl fullWidth>
                          <InputLabel>specifications</InputLabel>
                          <Select
                            value={editedMaterial.specifications}
                            onChange={(e) =>
                              setEditedMaterial({ ...editedMaterial, specifications: e.target.value })
                            }
                          >
                            {validSpecifications.map((spec) => (
                              <MenuItem key={spec} value={spec}>
                                {spec}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        material.specifications || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === material._id ? (
                        <FormControl fullWidth>
                          <InputLabel>supplier</InputLabel>
                          <Select
                            value={editedMaterial.supplier}
                            onChange={(e) =>
                              setEditedMaterial({ ...editedMaterial, supplier: e.target.value })
                            }
                          >
                            {validSupplier.map((supplier) => (
                              <MenuItem key={supplier} value={supplier}>
                                {supplier}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        material.supplier || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing === material._id ? (
                        <FormControl fullWidth>
                          <InputLabel>brand</InputLabel>
                          <Select
                            value={editedMaterial.brand}
                            onChange={(e) =>
                              setEditedMaterial({ ...editedMaterial, brand: e.target.value })
                            }
                          >
                            {validbrand.map((brand) => (
                              <MenuItem key={brand} value={brand}>
                                {brand}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        material.brand || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>{new Date(material.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {isEditing === material._id ? (
                        <Button onClick={() => handleSave(material._id)} variant="contained" color="primary">
                          Save
                        </Button>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(material)} variant="outlined" sx={{ mr: 1 }}>
                            Edit
                          </Button>
                          <Button onClick={() => openConfirmDeleteModal(material)} variant="contained" color="error">
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Create Material Modal */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              p: 4,
              boxShadow: 24,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Create New Material
            </Typography>
            <TextField
              label="Material Name"
              value={newMaterial.description}
              onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Unit</InputLabel>
              <Select
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
              >
                {validUnits.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Cost"
              type="number"
              value={newMaterial.cost === 0 ? "" : newMaterial.cost}
              onChange={(e) => {
                const value = e.target.value;
                setNewMaterial({ ...newMaterial, cost: value === "" ? "" : Math.max(0, parseFloat(value)) });
              }}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Supplier</InputLabel>
              <Select
                value={newMaterial.supplier}
                onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
              >
                {validSupplier.map((supplier) => (
                  <MenuItem key={supplier} value={supplier}>
                    {supplier}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>brand</InputLabel>
              <Select
                value={newMaterial.brand}
                onChange={(e) => setNewMaterial({ ...newMaterial, brand: e.target.value })}
              >
                {validbrand.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Specifications</InputLabel>
              <Select
                value={newMaterial.specifications}
                onChange={(e) => setNewMaterial({ ...newMaterial, specifications: e.target.value })}
              >
                {validSpecifications.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleCreate}
              sx={{ mt: 2, backgroundColor: "#3f5930", "&:hover": { backgroundColor: "#6b7c61" } }}
              fullWidth
            >
              Create Material
            </Button>
          </Box>
        </Modal>

        {/* Confirm Delete Material Modal */}
        <ConfirmDeleteMaterialModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={confirmDelete}
          materialDescription={materialToDelete?.description}
        />
      </Box>
    </>
  );
};

export default Materials;
