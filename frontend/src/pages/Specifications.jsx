// src/components/Specifications.jsx
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

const BASE_URL = "http://localhost:4000/api/dropdowns";

const Specifications = () => {
  const { user } = useAuthContext();
  const [specs, setSpecs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
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

  // Fetch specifications function
  const fetchSpecifications = async (search = "") => {
    if (!user || !user.token) return;

    try {
      const res = await fetch(`${BASE_URL}/specifications?search=${search}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSpecs(data);
      } else {
        showAlert("Error", data.error || "Failed to fetch specifications", "error");
      }
    } catch (error) {
      showAlert("Error", "Network error while fetching specifications", "error");
    }
  };

  // Fetch specifications on component mount
  useEffect(() => {
    fetchSpecifications();
  }, [user]);

  const handleOpenDialog = (spec = null) => {
    if (spec) {
      setEditingSpec(spec);
      setFormData({ name: spec.name });
    } else {
      setEditingSpec(null);
      setFormData({ name: '' });
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSpec(null);
    setFormData({ name: '' });
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
      newErrors.name = 'Specification is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const token = user?.token;

    try {
      if (editingSpec) {
        // Update specification
        const res = await fetch(`${BASE_URL}/specifications/${editingSpec._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert("Success", "Specification updated successfully", "success");
          fetchSpecifications(searchTerm);
        } else {
          showAlert("Error", data.error || "Failed to update specification", "error");
        }
      } else {
        // Add specification
        const res = await fetch(`${BASE_URL}/specifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          showAlert("Success", "Specification added successfully", "success");
          fetchSpecifications(searchTerm);
        } else {
          showAlert("Error", data.error || "Failed to add specification", "error");
        }
      }
    } catch (error) {
      showAlert("Error", "Network error while saving specification", "error");
    }

    handleCloseDialog();
  };

  const handleDelete = async (id) => {
    const token = user?.token;
    try {
      const res = await fetch(`${BASE_URL}/specifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert("Success", data.message || "Specification deleted", "success");
        fetchSpecifications(searchTerm);
      } else {
        showAlert("Error", data.error || "Failed to delete specification", "error");
      }
    } catch (error) {
      showAlert("Error", "Network error while deleting specification", "error");
    }
  };

  return (
    <>
      <Navbar />
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Specification Management</Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Specification
          </Button>
        </Box>

        {/* Search Filter */}
        <Box mb={2} display="flex" gap={1}>
          <TextField
            label="Search Specifications"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchSpecifications(searchTerm.trim())}
          >
            Search
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Specification</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {specs.map((spec) => (
                <TableRow key={spec._id}>
                  <TableCell>{spec.name}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenDialog(spec)}
                      sx={{ mr: 1 }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(spec._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {specs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No specifications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add/Edit Specification Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>
            {editingSpec ? 'Edit Specification' : 'Add New Specification'}
            <IconButton
              onClick={handleCloseDialog}
              style={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              margin="dense"
              label="Specification"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="secondary"
            >
              {editingSpec ? 'Update' : 'Add'} Specification
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

export default Specifications;