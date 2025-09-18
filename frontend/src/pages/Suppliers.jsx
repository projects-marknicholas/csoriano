import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import { Add, Close, Edit, Delete } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import AlertModal from '../components/AlertModal';
import { useAuthContext } from "../hooks/useAuthContext";

const BASE_URL = "http://localhost:4000/api/dropdowns";

const Suppliers = () => {
  const { user } = useAuthContext();
  const [suppliers, setSuppliers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  // Alert Modal States
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");

  // Function to show alerts
  const showAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };

  // Fetch suppliers function
  const fetchSuppliers = async (search = "") => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(`${BASE_URL}/suppliers?search=${search}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSuppliers(data);
      } else {
        showAlert("Error", data.error || "Failed to fetch suppliers", "error");
      }
    } catch (error) {
      showAlert("Error", "Network error while fetching suppliers", "error");
    }
  };

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, [user]);

  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({ 
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({ 
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSupplier(null);
    setFormData({ 
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const token = user?.token;

    try {
      if (editingSupplier) {
        // Update supplier
        const res = await fetch(`${BASE_URL}/suppliers/${editingSupplier._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert("Success", "Supplier updated successfully", "success");
          fetchSuppliers(searchTerm);
        } else {
          showAlert("Error", data.error || "Failed to update supplier", "error");
        }
      } else {
        // Add supplier
        const res = await fetch(`${BASE_URL}/suppliers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert("Success", "Supplier added successfully", "success");
          fetchSuppliers(searchTerm);
        } else {
          showAlert("Error", data.error || "Failed to add supplier", "error");
        }
      }
    } catch (error) {
      showAlert("Error", "Network error while saving supplier", "error");
    }

    handleCloseDialog();
  };

  const handleDelete = async (id) => {
    const token = user?.token;
    try {
      const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("Success", data.message || "Supplier deleted", "success");
        fetchSuppliers(searchTerm);
      } else {
        showAlert("Error", data.error || "Failed to delete supplier", "error");
      }
    } catch (error) {
      showAlert("Error", "Network error while deleting supplier", "error");
    }
  };

  return (
    <>
      <Navbar />
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Supplier Management</Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Supplier
          </Button>
        </Box>

        {/* Search Filter */}
        <Box mb={2} display="flex" gap={1}>
          <TextField
            label="Search Suppliers"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchSuppliers(searchTerm.trim())}
          >
            Search
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier._id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(supplier)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(supplier._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {suppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Supplier Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="md">
          <DialogTitle>
            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            <IconButton
              onClick={handleCloseDialog}
              style={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Supplier Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Contact Person"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="dense"
                  label="Address"
                  name="address"
                  multiline
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="secondary"
            >
              {editingSupplier ? 'Update' : 'Add'} Supplier
            </Button>
          </DialogActions>
        </Dialog>

        {/* Alert Modal */}
        <AlertModal
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
        />
      </Box>
    </>
  );
};

export default Suppliers;