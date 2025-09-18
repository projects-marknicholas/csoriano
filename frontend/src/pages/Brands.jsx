// src/components/Brands.jsx
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
} from "@mui/material";
import { Add, Close, Edit, Delete } from '@mui/icons-material';
import Navbar from '../components/Navbar';
import AlertModal from '../components/AlertModal';
import { useAuthContext } from "../hooks/useAuthContext";

const BASE_URL = "http://localhost:4000/api/dropdowns/brands";

const Brands = () => {
  const { user } = useAuthContext();
  const [brands, setBrands] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
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

  // Fetch brands function - moved outside useEffect
  const fetchBrands = async (search = "") => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(`${BASE_URL}?search=${search}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setBrands(data);
      } else {
        showAlert("Error", data.error || "Failed to fetch brands", "error");
      }
    } catch (error) {
      showAlert("Error", "Network error while fetching brands", "error");
    }
  };

  // Fetch brands on component mount
  useEffect(() => {
    fetchBrands();
  }, [user]);

  const handleOpenDialog = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({ name: brand.name });
    } else {
      setEditingBrand(null);
      setFormData({ name: "" });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBrand(null);
    setFormData({ name: "" });
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Brand name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user || !user.token) return;
    const token = user.token;

    try {
      if (editingBrand) {
        // Update brand
        const res = await fetch(`${BASE_URL}/${editingBrand._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert("Success", "Brand updated successfully", "success");
          fetchBrands(searchTerm); // Refresh with current search term
        } else {
          showAlert("Error", data.error || "Failed to update brand", "error");
        }
      } else {
        // Add brand
        const res = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert("Success", "Brand added successfully", "success");
          fetchBrands(searchTerm); // Refresh with current search term
        } else {
          showAlert("Error", data.error || "Failed to add brand", "error");
        }
      }
    } catch (error) {
      showAlert("Error", "Network error while saving brand", "error");
    }

    handleCloseDialog();
  };

  const handleDelete = async (id) => {
    const token = user.token;
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("Success", data.message || "Brand deleted", "success");
        fetchBrands(searchTerm); // Refresh with current search term
      } else {
        showAlert("Error", data.error || "Failed to delete brand", "error");
      }
    } catch (error) {
      showAlert("Error", "Network error while deleting brand", "error");
    }
  };

  return (
    <>
      <Navbar />
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Brand Management</Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Brand
          </Button>
        </Box>

        {/* Search Filter */}
        <Box mb={2} display="flex" gap={1}>
          <TextField
            label="Search Brands"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchBrands(searchTerm.trim())}
          >
            Search
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Brand Name</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand._id}>
                  <TableCell>{brand.name}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(brand)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(brand._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No brands found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Brand Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editingBrand ? "Edit Brand" : "Add New Brand"}
            <IconButton
              onClick={handleCloseDialog}
              style={{ position: "absolute", right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              margin="dense"
              label="Brand Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="secondary">
              {editingBrand ? "Update" : "Add"} Brand
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

export default Brands;