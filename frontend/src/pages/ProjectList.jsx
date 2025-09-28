// src/components/ProjectList.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import sorianoLogo from "../assets/sorianoLogo.jpg";
import AlertModal from "../components/AlertModal";
import ChatComponent from "../components/ChatComponent";
import { uploadToCloudinary } from "../hooks/useCloudinary";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  Typography,
  InputLabel,
  FormControl,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  Redo as RedoIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import GeneratorModal from "../components/GeneratorModal";
import { Close, SwapHoriz  } from '@mui/icons-material';

const Notification = ({ message, onClose }) => (
  <div
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#f44336",
      color: "white",
      padding: "10px 20px",
      borderRadius: "5px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }}
    onClick={onClose}
  >
    <strong>New message:</strong> {message}
  </div>
);

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <span className={styles.closeButton} onClick={onClose}>
          &times;
        </span>
        <div className={styles.modalScrollableContent}>{children}</div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className={styles.loadingSpinnerContainer}>
    <div className={styles.spinner}></div>
    <p>Please wait, fetching projects...</p>
  </div>
);

const MaterialSearchModal = ({ isOpen, onClose, onMaterialSelect, materialToReplace, user, onMaterialAdd }) => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen && user && user.token) {
      axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/materials`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((response) => {
          setMaterials(response.data);
          setFilteredMaterials(response.data);
        })
        .catch((error) => {
          console.error('Error fetching materials:', error);
        });
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter((material) =>
        (material.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaterials(filtered);
    }
  }, [searchTerm, materials]);

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {materialToReplace ? `Replace Material: ${materialToReplace?.description || ''}` : 'Select Material'}
        <IconButton onClick={onClose} style={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search materials"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            margin="dense"
          />
          {/* <Button 
            variant="contained" 
            color="primary"
            onClick={onMaterialAdd}
            sx={{ mt: 1 }}
            startIcon={<AddIcon />}
          >
            Add New
          </Button> */}
        </Box>
        {filteredMaterials.length > 0 ? (
          <TableContainer style={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Cost (₱)</TableCell>
                  <TableCell>Specifications</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material._id} hover>
                    <TableCell>{material.description || 'No Description Available'}</TableCell>
                    <TableCell>{material.unit || 'N/A'}</TableCell>
                    <TableCell>{material.cost?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{material.specifications || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => onMaterialSelect(material)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>No materials found</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProject, setNewProject] = useState({
    name: "",
    user: "",
    numFloors: 1,
    floors: [],
    template: "",
    timeline: { duration: 0, unit: "months" },
    location: "",
    totalArea: 0,
    avgFloorHeight: 0,
    roomCount: 1,
    foundationDepth: 0,
  });

  const [createLoading, setCreateLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info"); // Default type
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  const [heightError, setHeightError] = useState("");
  const [floorError, setFloorError] = useState("");
  const [roomCountError, setRoomCountError] = useState("");
  const [foundationDepthError, setFoundationDepthError] = useState("");
  const [templates, setTemplates] = useState([]);
  const [totalAreaError, setTotalAreaError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    timeline: false,
    projectDates: false,
    postponedDates: false,
    resumedDates: false,
    floorsAndTasks: false,
    floors: {},
  });
  const [localImages, setLocalImages] = useState({}); // To store images by floor and task
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [projectImage, setProjectImage] = useState(null);
  const [projectImagePreview, setProjectImagePreview] = useState(null);
  const [chatProjectId, setChatProjectId] = useState(null);
  const [chatProjectName, setChatProjectName] = useState(null);
  const [isChat, setIsChat] = useState(false);
  const [materialToReplace, setMaterialToReplace] = useState(null);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);

  // BOM
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    totalArea: '',
    avgFloorHeight: '',
    selectedTemplateId: '',
    numFloors: '',
    roomCount: '',
    foundationDepth: '',
  });
  const [errors, setErrors] = useState({});
  const [bom, setBom] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isLoadingBOM, setIsLoadingBOM] = useState(false);
  const [selectedProjectForBOM, setSelectedProjectForBOM] = useState(null);

  // Add Material States
  const [addMaterialModalOpen, setAddMaterialModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    description: '',
    unit: '',
    cost: '',
    specifications: '',
    supplier: '',
    brand: ''
  });

const handleReplaceClick = (material) => {
  setMaterialToReplace(material);
  setMaterialModalOpen(true);
};

const handleMaterialSelect = (newMaterial) => {
  if (materialToReplace && bom) {
    // Update the materials with the selected replacement material and recalculate total amounts
    const updatedCategories = bom.categories.map((category) => {
      const updatedMaterials = category.materials.map((material) => {
        if (material._id === materialToReplace._id) {
          return {
            ...material,
            description: newMaterial.description,
            cost: parseFloat(newMaterial.cost),
            totalAmount: parseFloat((parseFloat(material.quantity) * parseFloat(newMaterial.cost)).toFixed(2)),
          };
        }
        return material;
      });
    
      const categoryTotal = updatedMaterials.reduce((sum, material) => sum + (parseFloat(material.totalAmount) || 0), 0);
    
      return { ...category, materials: updatedMaterials, categoryTotal: parseFloat(categoryTotal.toFixed(2)) };
    });
    

    // Recalculate the project cost and marked-up cost
    const { originalTotalProjectCost, markedUpTotalProjectCost } = calculateUpdatedCosts({
      ...bom,
      categories: updatedCategories,
    });

    
    setBom({
      ...bom,
      categories: updatedCategories,
      originalCosts: {
        ...bom.originalCosts,
        totalProjectCost: originalTotalProjectCost,
      },
      markedUpCosts: {
        ...bom.markedUpCosts,
        totalProjectCost: markedUpTotalProjectCost,
      },
    });

    // Close the material replacement modal and show success alert
    setMaterialModalOpen(false);
    showAlert("Success", "Material granted successfully.", "success");
  }
};

const calculateUpdatedCosts = (bom) => {
  const totalMaterialsCost = bom.categories.reduce((sum, category) => {
    const categoryTotal = category.materials.reduce((subSum, material) => {
      const materialTotal = parseFloat(material.totalAmount) || 0;
      return subSum + materialTotal;
    }, 0);
    return sum + categoryTotal;
  }, 0);

  const originalLaborCost = parseFloat(bom.originalCosts.laborCost) || 0;
  const originalTotalProjectCost = totalMaterialsCost + originalLaborCost;

  const markupPercentage = parseFloat(bom.projectDetails.location.markup) / 100 || 0;
  const markedUpTotalProjectCost = originalTotalProjectCost + (originalTotalProjectCost * markupPercentage);

  return {
    originalTotalProjectCost,
    markedUpTotalProjectCost,
  };
};

const handleChange = (e) => {
  const { name, value } = e.target;
  const updatedFormData = { ...formData };
  if (name === 'numFloors' && value > 5) {
    updatedFormData[name] = 5;
    setErrors({ ...errors, numFloors: 'Maximum allowed floors is 5. Resetting to 5.' });
    showAlert("Validation Error", "Maximum allowed floors is 5. Resetting to 5.", "error");
  } else if (name === 'avgFloorHeight') {
    if (value > 15) {
      updatedFormData[name] = 15;
      setErrors({ ...errors, avgFloorHeight: 'Maximum floor height is 15 meters. Resetting to 15.' });
      showAlert("Validation Error", "Maximum floor height is 15 meters. Resetting to 15.", "error");
    } else if (value < 0) {
      updatedFormData[name] = 0;
      setErrors({ ...errors, avgFloorHeight: 'Floor height cannot be negative. Resetting to 0.' });
      showAlert("Validation Error", "Floor height cannot be negative. Resetting to 0.", "error");
    } else {
      updatedFormData[name] = value;
    }
  } else {
    updatedFormData[name] = value;
  }
  setFormData(updatedFormData);
};

const validateForm = () => {
  const newErrors = {};
  const requiredFields = ['totalArea', 'avgFloorHeight', 'roomCount', 'foundationDepth'];
  requiredFields.forEach(field => !formData[field] && (newErrors[field] = 'This field is required'));
  if (!selectedLocation) {
    newErrors.location = 'Please select a location';
    showAlert("Validation Error", "Please select a location.", "error");
  }
  if (!formData.numFloors) {
    newErrors.numFloors = 'This field is required';
    showAlert("Validation Error", "Number of floors is required.", "error");
  }
  if (!formData.selectedTemplateId) {
    newErrors.selectedTemplateId = 'Please select a template';
    showAlert("Validation Error", "Please select a template.", "error");
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (validateForm()) {
    setIsLoadingBOM(true);
    const payload = {
      totalArea: parseFloat(formData.totalArea),
      numFloors: parseInt(formData.numFloors, 10),
      avgFloorHeight: parseFloat(formData.avgFloorHeight),
      templateId: formData.selectedTemplateId,
      locationName: selectedLocation,
      roomCount: parseInt(formData.roomCount, 10),
      foundationDepth: parseFloat(formData.foundationDepth),
    };
    axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/bom/generate`, payload, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((response) => {
        setBom(response.data.bom);
        setGeneratorModalOpen(false);
        showAlert("Success", "BOM generated successfully.", "success");
      })
      .catch((error) => {
        console.error('Error generating BOM:', error);
        showAlert("Error", error.response?.data?.error || "An unexpected error occurred.", "error");
      })
      .finally(() => setIsLoadingBOM(false));
  }
};

const handleGenerateBOMPDF = (version = 'client') => {
  if (!bom) return;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;
  doc.addImage(sorianoLogo, 'JPEG', 20, 10, pageWidth - 40, (pageWidth - 40) * 0.2);
  yPosition += 30;
  doc.setFontSize(18);
  doc.text("Generated BOM", pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  doc.text(`Project: ${selectedProjectForBOM?.name || 'Custom'}`, 10, yPosition);
  yPosition += 10;
  if (version === 'client') {
    doc.text(`Grand Total: PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}`, 10, yPosition);
    yPosition += 15;
    bom.categories.forEach((cat, i) => {
      doc.text(cat.category.toUpperCase(), 10, yPosition);
      yPosition += 5;
      doc.autoTable({
        head: [['Item', 'Quantity', 'Unit Cost (PHP)', 'Total (PHP)']],
        body: cat.materials.map(m => [m.item, new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.ceil(m.quantity)) || 'N/A', `PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(m.cost)}`, `PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(m.totalAmount)}`]),
        startY: yPosition,
      });
      yPosition = doc.lastAutoTable.finalY + 5;
    });
  } else {
    // Simplified design engineer version for brevity
    doc.text(`Grand Total: PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}`, 10, yPosition);
    yPosition += 15;
    doc.text(`Marked-Up Total: PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}`, 10, yPosition);
    yPosition += 20;
    bom.categories.forEach((cat, i) => {
      doc.text(cat.category.toUpperCase(), 10, yPosition);
      yPosition += 5;
      doc.autoTable({
        head: [['Item', 'Quantity', 'Unit Cost (PHP)', 'Total (PHP)']],
        body: cat.materials.map(m => [m.item, new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.ceil(m.quantity)) || 'N/A', `PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(m.cost)}`, `PHP ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(m.totalAmount)}`]),
        startY: yPosition,
      });
      yPosition = doc.lastAutoTable.finalY + 5;
    });
  }
  doc.save(`BOM_${version}_${selectedProjectForBOM?.name || 'custom'}.pdf`);
};

const closeGeneratorModal = () => {
  setGeneratorModalOpen(false);
  setFormData({ totalArea: '', avgFloorHeight: '', selectedTemplateId: '', numFloors: '', roomCount: '', foundationDepth: '' });
  setSelectedLocation("");
  setErrors({});
  setSelectedProjectForBOM(null);
};

const handleLocationSelect = (locationName) => {
  setSelectedLocation(locationName);
};

// Add Material Functions
const handleAddMaterialClick = () => {
  setMaterialModalOpen(true);
};

const handleMaterialAdd = () => {
  setMaterialModalOpen(false);
  setAddMaterialModalOpen(true);
  showAlert("Success", "Material added successfully!", "success");
};

const handleCreateMaterial = async () => {
  try {
    if (!newMaterial.description || !newMaterial.cost || !newMaterial.unit) {
      showAlert("Error", "Please fill in description, cost, and unit fields.", "error");
      return;
    }

    const materialData = {
      description: newMaterial.description,
      unit: newMaterial.unit,
      cost: parseFloat(newMaterial.cost),
      specifications: newMaterial.specifications,
      supplier: newMaterial.supplier,
      brand: newMaterial.brand
    };

    const response = await axios.post(
      `${import.meta.env.VITE_LOCAL_URL}/api/materials`,
      materialData,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      }
    );

    // Refresh materials list
    const materialsResponse = await axios.get(
      `${import.meta.env.VITE_LOCAL_URL}/api/materials`,
      {
        headers: { Authorization: `Bearer ${user.token}` },
      }
    );

    setAddMaterialModalOpen(false);
    setNewMaterial({ 
      description: '', 
      unit: '', 
      cost: '', 
      specifications: '', 
      supplier: '', 
      brand: '' 
    });
    showAlert("Success", "Material added successfully!", "success");
    
    // Reopen material modal with updated list
    setMaterialModalOpen(true);
  } catch (error) {
    console.error('Error creating material:', error);
    showAlert("Error", "Failed to add material. Please try again.", "error");
  }
};

// const handleSaveBOM = (BomId) => {
//   if (!BomId) {
//     showAlert("Error", "No project selected. Please select a project before saving.", "error");
//     return;
//   }

//   const payload = {
//     bom: {
//       projectDetails: bom.projectDetails,
//       categories: bom.categories,
//       originalCosts: bom.originalCosts,
//       markedUpCosts: bom.markedUpCosts,
//     },
//   };
//   console.log('Selected Project ID:', BomId);

//   axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/project/${BomId}/boms`, payload, {
//     headers: { Authorization: `Bearer ${user.token}` },
//   })
//     .then(() => {
//       setBom(null);
//       showAlert("Success", "BOM saved to the project!", "success");
//     })
//     .catch((error) => {
//       console.error('Failed to save BOM to project:', error.response || error.message || error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to save BOM to the project.';
//       showAlert("Error", errorMessage, "error");
//     });
// };
  // BOM END

  // Pop-out notification state
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState("");

  const toggleDetails = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleFloor = (index) => {
    setExpandedSections((prev) => ({
      ...prev,
      floors: {
        ...prev.floors,
        [index]: !prev.floors[index],
      },
    }));
  };

  const showAlert = (title, message, type = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertOpen(true);
  };
  

  const togggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  const toggleFloorExpansion = (index) => {
    if (expandedFloors.includes(index)) {
      setExpandedFloors(expandedFloors.filter((i) => i !== index));
    } else {
      setExpandedFloors([...expandedFloors, index]);
    }
  };

  // Fetch project details for the modal
  const fetchProjectDetails = async (projectId) => {
    const response = await axios.get(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    const project = response.data;
    setNewProject({
      ...project,
      floors: project.floors.map((floor) => ({
        ...floor,
        _id: floor._id, // Ensure floor ID is included
      })),
    });
  };

  const handleProjectImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setProjectImage(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setProjectImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProjectImage = () => {
    setProjectImage(null);
    setProjectImagePreview(null);
  };

  // Fetch all projects, locations, and templates
  useEffect(() => {
    if (!user || !user.token) return;
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [
          projectsResponse,
          locationsResponse,
          templatesResponse,
          usersResponse,
        ] = await Promise.all([
          axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/project/contractor`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/locations`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/templates`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/user/get`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        // Handle different possible response structures for projects
        let projectsData = projectsResponse.data;
        
        // Check if the response has a data property (common pattern)
        if (projectsResponse.data && projectsResponse.data.data) {
          projectsData = projectsResponse.data.data;
        }
        
        // Check if the response has a projects property
        if (projectsResponse.data && projectsResponse.data.projects) {
          projectsData = projectsResponse.data.projects;
        }
        
        // Ensure projectsData is an array
        if (!Array.isArray(projectsData)) {
          console.error("Projects data is not an array:", projectsData);
          projectsData = [];
        }

        setProjects(projectsData);
        setLocations(locationsResponse.data);
        setUsers(usersResponse.data);

        // Sort templates based on 'tier' property
        const desiredOrder = ["economy", "standard", "premium"];
        const sortedTemplates = [...templatesResponse.data.templates].sort(
          (a, b) => {
            const tierA = (a.tier || "").toLowerCase();
            const tierB = (b.tier || "").toLowerCase();
            return desiredOrder.indexOf(tierA) - desiredOrder.indexOf(tierB);
          }
        );
        setTemplates(sortedTemplates);

        // Debugging Logs - check the actual structure
        console.log("Fetched Projects:", projectsData);
        console.log("Projects Response Structure:", projectsResponse.data);
        console.log("Fetched Templates:", sortedTemplates);
        console.log("Fetched Locations:", locationsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        showAlert(
          "Error",
          "Failed to fetch projects, locations, or templates. Please try again later.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    console.log("Projects state:", projects);
    console.log("Filtered projects:", filterProjects());
  }, [projects, searchTerm]);

  const handleUpdateTaskImageRemark = (
    floorIndex,
    taskIndex,
    imageIndex,
    newRemark
  ) => {
    setNewProject((prevProject) => {
      const updatedFloors = [...prevProject.floors];
      const updatedTasks = [...updatedFloors[floorIndex].tasks];
      const updatedTaskImages = [...updatedTasks[taskIndex].images];
      updatedTaskImages[imageIndex].remark = newRemark; // Update the remark
      updatedTasks[taskIndex].images = updatedTaskImages; // Update images for the task
      updatedFloors[floorIndex].tasks = updatedTasks; // Update tasks for the floor
      return { ...prevProject, floors: updatedFloors };
    });
  };

  const handleFloorHeightChange = (e) => {
    const inputValue = e.target.value;

    // Update the state with the raw input value
    setNewProject({ ...newProject, avgFloorHeight: inputValue });

    // If the input is empty, clear the error and return
    if (inputValue === "") {
      setHeightError("");
      return;
    }

    const value = parseFloat(inputValue);

    if (isNaN(value)) {
      setHeightError("Please enter a valid number.");
      showAlert(
        "Validation Error",
        "Please enter a valid number for floor height.",
        "error"
      );
    } else if (value < 0) {
      setHeightError("The floor height cannot be negative.");
      showAlert(
        "Validation Error",
        "The floor height cannot be negative.",
        "error"
      );
    } else if (value > 15) {
      setHeightError("The floor height cannot exceed 15 meters.");
      showAlert(
        "Validation Error",
        "The floor height cannot exceed 15 meters.",
        "error"
      );
    } else {
      setHeightError("");
      setNewProject({ ...newProject, avgFloorHeight: value });
    }
  };

  const handleImageUpload = (e, floorIndex, taskIndex = null) => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      showAlert(
        "Error",
        "No files selected. Please select images to upload.",
        "error"
      );
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = {
          preview: reader.result,
          file,
          isLocal: true,
          remark: "",
        };

        setLocalImages((prev) => {
          const updatedImages = { ...prev };

          // Initialize floor if not present
          if (!updatedImages[floorIndex]) {
            updatedImages[floorIndex] = { images: [], tasks: {} };
          }

          // Add image to task or floor, avoiding duplicates
          if (taskIndex !== null) {
            // Task image handling
            if (!updatedImages[floorIndex].tasks[taskIndex]) {
              updatedImages[floorIndex].tasks[taskIndex] = { images: [] };
            }

            // Add image only if it does not exist already (check by file name)
            if (
              !updatedImages[floorIndex].tasks[taskIndex].images.some(
                (img) => img.file.name === file.name
              )
            ) {
              updatedImages[floorIndex].tasks[taskIndex].images.push(newImage);
            }
          } else {
            // Floor image handling

            // Add image only if it does not exist already (check by file name)
            if (
              !updatedImages[floorIndex].images.some(
                (img) => img.file.name === file.name
              )
            ) {
              updatedImages[floorIndex].images.push(newImage);
            }
          }
          return updatedImages;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (floorIndex, imageIndex, taskIndex = null) => {
    setLocalImages((prev) => {
      const updated = { ...prev };
      if (taskIndex !== null) {
        // Remove task image
        updated[floorIndex].tasks[taskIndex].images.splice(imageIndex, 1);
        if (updated[floorIndex].tasks[taskIndex].images.length === 0) {
          delete updated[floorIndex].tasks[taskIndex];
        }
      } else {
        // Remove floor image
        updated[floorIndex].images.splice(imageIndex, 1);
      }
      return updated;
    });
  };

  const handleTotalAreaChange = (e) => {
    const inputValue = e.target.value;

    // Update the state with the raw input value
    setNewProject({ ...newProject, totalArea: inputValue });

    // If the input is empty, clear the error and return
    if (inputValue === "") {
      setTotalAreaError("");
      return;
    }

    const value = parseFloat(inputValue);

    if (isNaN(value)) {
      setTotalAreaError("Please enter a valid number.");
      showAlert(
        "Validation Error",
        "Please enter a valid number for total area.",
        "error"
      );
    } else if (value <= 0) {
      setTotalAreaError("Total area must be greater than 0.");
      showAlert(
        "Validation Error",
        "Total area must be greater than 0.",
        "error"
      );
    } else {
      setTotalAreaError("");
      setNewProject({ ...newProject, totalArea: value });
    }
  };

  const handleToggleProgressMode = async (projectId, isAutomatic) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/progress-mode`,
        { isAutomatic },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Log the entire response.data to examine its structure
      console.log("Response Data:", response.data);

      // Attempt to access the project data, with more fallback and error handling
      const updatedProject = response.data?.project || response.data;

      if (updatedProject && updatedProject._id) {
        // Update the projects list with the newly retrieved project
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project._id === updatedProject._id ? updatedProject : project
          )
        );
        showAlert(
          "Success",
          `Progress mode set to ${isAutomatic ? "Automatic" : "Manual"}.`,
          "success"
        );
      } else {
        console.error(
          "Error: Updated project data is undefined or missing _id in the response:",
          response.data
        );
        showAlert("Error", "Failed to retrieve updated project data.", "error");
      }
    } catch (error) {
      console.error("Error toggling progress mode:", error);
      showAlert(
        "Error",
        "Failed to toggle progress mode. Please try again.",
        "error"
      );
    }
  };

  // Handle input change for numFloors with validation
  const handleNumFloorsChange = (e) => {
    const inputValue = e.target.value;

    // Update the state with the raw input value
    setNewProject({ ...newProject, numFloors: inputValue });

    // If the input is empty, clear the error and return
    if (inputValue === "") {
      setFloorError("");
      return;
    }

    const value = parseInt(inputValue, 10);

    if (isNaN(value)) {
      setFloorError("Please enter a valid number.");
      showAlert(
        "Validation Error",
        "Please enter a valid number for the number of floors.",
        "error"
      );
    } else if (value < 1) {
      setFloorError("The number of floors cannot be less than 1.");
      showAlert(
        "Validation Error",
        "The number of floors cannot be less than 1.",
        "error"
      );
    } else if (value > 2) {
      setFloorError("Invalid input. Projects are restricted to a maximum of 2 floors.");
      showAlert(
        "Validation Error",
        "The number of floors cannot exceed 2.",
        "error"
      );
    } else {
      setFloorError("");
      setNewProject({ ...newProject, numFloors: value });
    }
  };

  // Function to handle project deletion after confirmation
  const handleConfirmDelete = () => {
    if (selectedProject) {
      handleDeleteProject();
    } else {
      console.error("No project selected for deletion.");
      showAlert("Error", "No project selected for deletion.", "error");
    }
  };

  // Function to handle when the user cancels the delete operation
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedProject(null);
  };

  // Handle creating a new project
  const handleCreateProject = async () => {
    setCreateLoading(true);
    try {
      if (!newProject.template) {
        showAlert("Error", "Please select a template.", "error");
        return;
      }
      if (newProject.totalArea <= 0) {
        showAlert("Error", "Total area must be greater than 0.", "error");
        return;
      }

      let projectImageUrl = '';
      
      // Upload project image to Cloudinary if available
      if (projectImage) {
        try {
          projectImageUrl = await uploadToCloudinary(projectImage);
        } catch (error) {
          showAlert("Error", "Failed to upload project image. Please try again.", "error");
          return;
        }
      }

      const defaultFloors = Array.from(
        { length: newProject.numFloors },
        (_, i) => ({
          name: `FLOOR ${i + 1}`,
          progress: 0,
          tasks: [],
        })
      );

      const projectData = {
        name: newProject.name,
        user: newProject.user,
        template: newProject.template,
        location: newProject.location,
        totalArea: newProject.totalArea,
        avgFloorHeight: newProject.avgFloorHeight,
        roomCount: newProject.roomCount,
        foundationDepth: newProject.foundationDepth,
        numFloors: newProject.numFloors,
        timeline: newProject.timeline,
        contractor: user.Username,
        projectImage: projectImageUrl, // Store the Cloudinary URL
        floors: defaultFloors,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_LOCAL_URL}/api/project`,
        projectData,
        {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      setProjects([...projects, response.data.data]);
      resetProjectForm();
      setProjectImage(null);
      setProjectImagePreview(null);
      setIsModalOpen(false);
      showAlert("Success", "Project created successfully!", "success");
    } catch (error) {
      if (error.response && error.response.status === 404) {
        showAlert(
          "Error",
          "The selected template was not found. Please select a valid template.",
          "error"
        );
      } else {
        console.error("Error creating project:", error);
        showAlert(
          "Error",
          "Failed to create project. Please try again.",
          "error"
        );
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const refreshProjects = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/project/contractor`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      let projectsData = response.data;
      // Handle different response structures as you did in useEffect
      if (response.data && response.data.data) {
        projectsData = response.data.data;
      }
      if (response.data && response.data.projects) {
        projectsData = response.data.projects;
      }
      
      setProjects(projectsData);
    } catch (error) {
      console.error("Error refreshing projects:", error);
    }
  };

  // Handle updating an existing project
  const handleUpdateProject = async () => {
    try {
      const projectId = newProject._id;
      let projectImageUrl = newProject.projectImage; // Keep existing image by default
      
      // Upload new project image to Cloudinary if available
      if (projectImage) {
        try {
          projectImageUrl = await uploadToCloudinary(projectImage);
        } catch (error) {
          showAlert("Error", "Failed to upload project image. Please try again.", "error");
          return;
        }
      }

      const projectData = {
        name: newProject.name,
        user: newProject.user,
        template: newProject.template,
        location: newProject.location,
        totalArea: newProject.totalArea,
        avgFloorHeight: newProject.avgFloorHeight,
        roomCount: newProject.roomCount,
        foundationDepth: newProject.foundationDepth,
        timeline: newProject.timeline,
        projectImage: projectImageUrl, // Store the Cloudinary URL
      };

      // Handle floors and tasks (existing code)
      const updatedFloors = await Promise.all(
        newProject.floors.map(async (floor, floorIndex) => {
          const floorId = floor._id;
          let uploadedFloorImages = [];

          // Upload new floor images to Cloudinary
          if (localImages[floorIndex]?.images?.length) {
            uploadedFloorImages = await Promise.all(
              localImages[floorIndex].images.map(async (img) => {
                try {
                  const imageUrl = await uploadToCloudinary(img.file);
                  return {
                    path: imageUrl,
                    remark: img.remark || "",
                  };
                } catch (error) {
                  console.error("Error uploading floor image:", error);
                  return null;
                }
              })
            );
            // Filter out any failed uploads
            uploadedFloorImages = uploadedFloorImages.filter(img => img !== null);
          }

          // Handle tasks
          const updatedTasks = await Promise.all(
            floor.tasks.map(async (task, taskIndex) => {
              const taskId = task._id;
              let uploadedTaskImages = [];

              // Upload new task images to Cloudinary
              if (localImages[floorIndex]?.tasks?.[taskIndex]?.images?.length) {
                uploadedTaskImages = await Promise.all(
                  localImages[floorIndex].tasks[taskIndex].images.map(
                    async (img) => {
                      try {
                        const imageUrl = await uploadToCloudinary(img.file);
                        return {
                          path: imageUrl,
                          remark: img.remark || "",
                        };
                      } catch (error) {
                        console.error("Error uploading task image:", error);
                        return null;
                      }
                    }
                  )
                );
                // Filter out any failed uploads
                uploadedTaskImages = uploadedTaskImages.filter(img => img !== null);
              }

              // Merge existing and new images
              const allTaskImages = [
                ...(task.images || []),
                ...uploadedTaskImages,
              ];

              return {
                ...task,
                images: allTaskImages,
              };
            })
          );

          // Merge existing and new floor images
          const allFloorImages = [
            ...(floor.images || []),
            ...uploadedFloorImages,
          ];

          return {
            ...floor,
            images: allFloorImages,
            tasks: updatedTasks,
          };
        })
      );

      // Add floors to the project data
      projectData.floors = updatedFloors;

      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${editProjectId}`,
        projectData,
        {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      const updatedProjectResponse = await axios.get(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${editProjectId}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // Update the projects in the state with the updated project
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === editProjectId ? updatedProjectResponse.data : project
        )
      );

      refreshProjects();

      // Reset local images
      setLocalImages({});
      
      // Reset image states
      setProjectImage(null);
      setProjectImagePreview(null);

      // Reset form and close modal
      resetProjectForm();
      setIsEditing(false);
      setIsModalOpen(false);
      showAlert("Success", "Project updated successfully!", "success");
    } catch (error) {
      console.error("Error updating project:", error);
      showAlert(
        "Error",
        "Failed to update project. Please try again.",
        "error"
      );
    }
  };

  const handleSaveBOM = (BomId) => {
    if (!BomId) {
      showAlert("Error", "No project selected. Please select a project before saving.", "error");
      return;
    }
  
    const payload = {
      bom: {
        projectDetails: bom.projectDetails,
        categories: bom.categories,
        originalCosts: bom.originalCosts,
        markedUpCosts: bom.markedUpCosts,
      },
    };
    console.log('Selected Project ID:', BomId);

    axios.post(`${import.meta.env.VITE_LOCAL_URL}/api/project/${BomId}/boms`, payload, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(() => {
        setBom(null);
        showAlert("Success", "BOM saved to the project!", "success");
      })
      .catch((error) => {
        console.error('Failed to save BOM to project:', error.response || error.message || error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to save BOM to the project.';
        showAlert("Error", errorMessage, "error");
      });
  };

  // Reset the project form
  const resetProjectForm = () => {
    setNewProject({
      name: "",
      contractor: "",
      user: "",
      numFloors: "",
      template: "",
      floors: [],
      timeline: {
        duration: "",
        unit: "months",
      },
      location: "",
      totalArea: "",
      avgFloorHeight: "",
      roomCount: "",
      foundationDepth: "",
    });
    setProjectImage(null);
    setProjectImagePreview(null);
    // Reset validation errors
    setHeightError("");
    setFloorError("");
    setRoomCountError("");
    setFoundationDepthError("");
  };

  const handleStartProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/start`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const updatedProject = response.data.project;

      // Update the projects state with the updated project
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success", "Project started successfully!", "success");
    } catch (error) {
      console.error("Error starting project:", error);
      showAlert("Error", "Failed to start project. Please try again.", "error");
    }
  };

  const handleChat = async (projectName, projectId) => {
    setChatProjectName(projectName);
    setChatProjectId(projectId);
    setIsChat(true);
  };

  const handlePostponeProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/postpone`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedProject = response.data.project;

      // Update projects state directly with the new status
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success", "Project postponed successfully!", "success");
    } catch (error) {
      console.error("Error postponing project:", error);
      showAlert(
        "Error",
        "Failed to postpone project. Please try again.",
        "error"
      );
    }
  };

  const handleResumeProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/resume`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedProject = response.data.project;

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success", "Project resumed successfully!", "success");
    } catch (error) {
      console.error("Error resuming project:", error);
      showAlert(
        "Error",
        "Failed to resume project. Please try again.",
        "error"
      );
    }
  };

  const handleEndProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/end`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const updatedProject = response.data.project;

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      
      showAlert("Success", "Project ended successfully!", "success");
    } catch (error) {
      console.error("Error ending project:", error);
      showAlert("Error", "Failed to end project. Please try again.", "error");
    }
  };
  const handleDeleteExistingImage = (floorIndex, imageIndex) => {
    setImageToDelete({ type: "floor", floorIndex, imageIndex });
    setShowImageDeleteModal(true);
  };

  const handleDeleteExistingTaskImage = (floorIndex, taskIndex, imageIndex) => {
    setImageToDelete({ type: "task", floorIndex, taskIndex, imageIndex });
    setShowImageDeleteModal(true);
  };

  const handleUpdateImageRemark = (floorIndex, imageIndex, newRemark) => {
    setNewProject((prevProject) => {
      const updatedFloors = [...prevProject.floors];
      updatedFloors[floorIndex].images[imageIndex].remark = newRemark; // Update the remark
      return { ...prevProject, floors: updatedFloors };
    });
  };

  const handleConfirmDeleteImage = async () => {
    const { type, floorIndex, taskIndex, imageIndex } = imageToDelete;

    try {
      const projectId = newProject._id; // Get the project ID

      if (type === "floor") {
        const floor = newProject.floors[floorIndex];
        const floorId = floor._id; // Get the floor ID
        const image = floor.images[imageIndex];
        const imageId = image._id; // Get the image ID

        // Ensure IDs are valid before making the API call
        if (!projectId || !floorId || !imageId) {
          showAlert("Error", "Invalid IDs for deleting floor image.", "error");
          return;
        }

        // Send delete request to the server
        await axios.delete(
          `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/floors/${floorId}/images/${imageId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        // Remove the image from the state
        // Remove the image from the state
        const updatedFloors = [...newProject.floors];
        if (type === "floor") {
          updatedFloors[floorIndex].images = updatedFloors[
            floorIndex
          ].images.filter((_, idx) => idx !== imageIndex);
        } else if (type === "task") {
          updatedFloors[floorIndex].tasks[taskIndex].images = updatedFloors[
            floorIndex
          ].tasks[taskIndex].images.filter((_, idx) => idx !== imageIndex);
        }
        setNewProject({ ...newProject, floors: updatedFloors });
      } else if (type === "task") {
        const floor = newProject.floors[floorIndex];
        const floorId = floor._id; // Get the floor ID
        const task = floor.tasks[taskIndex];
        const taskId = task._id; // Get the task ID
        const image = task.images[imageIndex];
        const imageId = image._id; // Get the image ID

        // Send delete request to the server
        await axios.delete(
          `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/floors/${floorId}/tasks/${taskId}/images/${imageId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        // Remove the image from the state
        // Remove the image from the state
        const updatedFloors = [...newProject.floors];
        if (type === "floor") {
          updatedFloors[floorIndex].images = updatedFloors[
            floorIndex
          ].images.filter((_, idx) => idx !== imageIndex);
        } else if (type === "task") {
          updatedFloors[floorIndex].tasks[taskIndex].images = updatedFloors[
            floorIndex
          ].tasks[taskIndex].images.filter((_, idx) => idx !== imageIndex);
        }
        setNewProject({ ...newProject, floors: updatedFloors });
      }

      showAlert("Success", "Image deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting image:", error);
      showAlert("Error", "Failed to delete image. Please try again.", "error");
    } finally {
      setShowImageDeleteModal(false);
      setImageToDelete(null);
    }
  };

  const handleCancelDeleteImage = () => {
    setShowImageDeleteModal(false);
    setImageToDelete(null);
  };

  // Handle editing a project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setIsEditing(true);
    setEditProjectId(project._id);

    const floorsWithProgress = project.floors.map((floor) => ({
      ...floor,
      progress: floor.progress || 0,
      images: (floor.images || []).filter(Boolean),
      tasks: floor.tasks.map((task) => ({
        ...task,
        progress: task.progress || 0,
        images: (task.images || []).filter(Boolean),
      })),
    }));

    const isValidTemplateId = /^[0-9a-fA-F]{24}$/.test(project.template);

    setNewProject({
      ...project,
      floors: floorsWithProgress,
      location: project.location || "",
      totalArea: project.totalArea || 0,
      avgFloorHeight: project.avgFloorHeight || 0,
      template: isValidTemplateId ? project.template : "",
    });

    // Set project image preview if it exists
    if (project.projectImage) {
      setProjectImagePreview(project.projectImage);
    }

    setIsModalOpen(true);
  };

  // Handle updating project status
  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      const updatedProject = response.data.project;
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        )
      );
      showAlert("Success", "Project status updated successfully!", "success");
    } catch (error) {
      console.error("Error updating project status:", error);
      showAlert(
        "Error",
        "Failed to update project status. Please try again.",
        "error"
      );
    }
  };

  // Helper functions for floors and tasks
  const handleFloorChange = (floorIndex, key, value, isManual = false) => {
    const updatedFloors = newProject.floors.map((floor, index) => {
      if (index === floorIndex) {
        // For progress field, ensure it's a valid number between 0-100
        if (key === "progress") {
          const numericValue = parseInt(value, 10);
          const validProgress = isNaN(numericValue) 
            ? 0 
            : Math.min(100, Math.max(0, numericValue));
          
          return { 
            ...floor, 
            [key]: validProgress,
            isManual: isManual // Set the manual flag
          };
        }
        
        return { ...floor, [key]: value };
      }
      return floor;
    });
    
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const handleTaskChange = (floorIndex, taskIndex, key, value, isManual = false) => {
    const updatedTasks = newProject.floors[floorIndex].tasks.map((task, index) => {
      if (index === taskIndex) {
        // For progress field, ensure it's a valid number between 0-100
        if (key === "progress") {
          const numericValue = parseInt(value, 10);
          const validProgress = isNaN(numericValue) 
            ? 0 
            : Math.min(100, Math.max(0, numericValue));
          
          return { 
            ...task, 
            [key]: validProgress,
            isManual: isManual // Set the manual flag
          };
        }
        
        return { ...task, [key]: value };
      }
      return task;
    });
    
    const updatedFloors = newProject.floors.map((floor, index) => {
      if (index === floorIndex) {
        return { ...floor, tasks: updatedTasks };
      }
      return floor;
    });
    
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const addTaskToFloor = (floorIndex) => {
    const updatedFloors = newProject.floors.map((floor, i) =>
      i === floorIndex
        ? {
            ...floor,
            tasks: [
              ...floor.tasks,
              { name: "", progress: 0, isManual: false, images: [] }, // Initialize images
            ],
          }
        : floor
    );
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const addFloor = () => {
    if (newProject.floors.length >= 5) {
      showAlert("Error", "Cannot add more than 5 floors.", "error");
      return;
    }

    const newFloorIndex = newProject.floors.length + 1;
    const updatedFloors = [
      ...newProject.floors,
      {
        name: `FLOOR ${newFloorIndex}`,
        progress: 0,
        tasks: [],
        isManual: false,
        images: [], // Initialize images as an empty array
      },
    ];
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const deleteFloor = (index) => {
    const updatedFloors = newProject.floors.filter((_, i) => i !== index);
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  const deleteTask = (floorIndex, taskIndex) => {
    const updatedTasks = newProject.floors[floorIndex].tasks.filter(
      (_, i) => i !== taskIndex
    );
    const updatedFloors = newProject.floors.map((floor, i) =>
      i === floorIndex ? { ...floor, tasks: updatedTasks } : floor
    );
    setNewProject({ ...newProject, floors: updatedFloors });
  };

  // View project details in the modal
  const handleViewProjectDetails = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const saveImageRemarkToServer = async (
    floorIndex,
    imageIndex,
    imageId,
    newRemark
  ) => {
    try {
      const projectId = newProject._id;
      const floorId = newProject.floors[floorIndex]._id;

      await axios.patch(
        `${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}/floors/${floorId}/images/${imageId}`,
        { remark: newRemark },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      showAlert("Success", "Image remark updated successfully!", "success");
    } catch (error) {
      console.error("Error updating image remark:", error);
      showAlert(
        "Error",
        "Failed to update image remark. Please try again.",
        "error"
      );
    }
  };

  // Handle changes and validation for roomCount
  const handleRoomCountChange = (e) => {
    const inputValue = e.target.value;

    // Update the state with the raw input value
    setNewProject({ ...newProject, roomCount: inputValue });

    // If the input is empty, clear the error and return
    if (inputValue === "") {
      setRoomCountError("");
      return;
    }

    const value = parseInt(inputValue, 10);

    if (isNaN(value)) {
      setRoomCountError("Please enter a valid number.");
      showAlert(
        "Validation Error",
        "Please enter a valid number for room count.",
        "error"
      );
    } else if (value < 1) {
      setRoomCountError("Room count must be at least 1.");
      showAlert("Validation Error", "Room count must be at least 1.", "error");
    } else {
      setRoomCountError("");
      setNewProject({ ...newProject, roomCount: value });
    }
  };

  // Handle changes and validation for foundationDepth
  const handleFoundationDepthChange = (e) => {
    const inputValue = e.target.value;

    // Update the state with the raw input value
    setNewProject({ ...newProject, foundationDepth: inputValue });

    // If the input is empty, clear the error and return
    if (inputValue === "") {
      setFoundationDepthError("");
      return;
    }

    const value = parseFloat(inputValue);

    if (isNaN(value)) {
      setFoundationDepthError("Please enter a valid number.");
      showAlert(
        "Validation Error",
        "Please enter a valid number for foundation depth.",
        "error"
      );
    } else if (value <= 0) {
      setFoundationDepthError("Foundation depth must be greater than 0.");
      showAlert(
        "Validation Error",
        "Foundation depth must be greater than 0.",
        "error"
      );
    } else {
      setFoundationDepthError("");
      setNewProject({ ...newProject, foundationDepth: value });
    }
  };

  // Define handleDeleteClick function
  const handleDeleteClick = (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  // Filter projects based on search term
  const filterProjects = () => {
    if (!searchTerm) return projects;
    return projects.filter(
      (project) =>
        project &&
        project.name &&
        project.status !== "finished" &&
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredProjects = filterProjects();
  const theme = createTheme({
    palette: {
      primary: {
        main: "#a7b194", // Set your desired color here
      },
      secondary: {
        main: "#6f7d5e", // Optional: Set a complementary secondary color
      },
    },
  });

  console.log("BOM", selectedProjectForBOM);

  return (
    <>
      <ThemeProvider theme={theme}>
        <Navbar />
        <Box p={3}>

          <Typography variant="h4" gutterBottom>
            Projects
          </Typography>

          {isLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="50vh"
            >
              <CircularProgress />
              <Typography ml={2}>Please wait, fetching projects...</Typography>
            </Box>
          ) : (
            <>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <TextField
                  label="Search project list"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                  sx={{ mr: 2 }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    resetProjectForm();
                    setIsModalOpen(true);
                  }}
                >
                  + Create Project
                </Button>
              </Box>
              <Typography variant="subtitle1" gutterBottom>
                Total Projects: {filteredProjects.filter((project) => project.status !== "finished").length}
              </Typography>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Floor Plan Image</TableCell>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Project Owner</TableCell>
                      <TableCell>Project Design Engineer</TableCell>
                      <TableCell>Date Created</TableCell>
                      <TableCell>Cost Tier</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProjects.filter((project) => project.status !== "finished").map((project) => (
                      <TableRow key={project._id} hover>
                        <TableCell
                          onClick={() => handleViewProjectDetails(project)}
                          style={{ cursor: "pointer" }}
                        >
                          {project.projectImage ? (
                            <img 
                              src={project.projectImage} 
                              alt="Project" 
                              style={{ 
                                width: "50px", 
                                height: "50px", 
                                objectFit: "cover",
                                borderRadius: "4px"
                              }} 
                            />
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell
                          onClick={() => handleViewProjectDetails(project)}
                          style={{ cursor: "pointer" }}
                        >
                          {project.name || "N/A"}
                        </TableCell>
                        <TableCell
                          onClick={() => handleViewProjectDetails(project)}
                          style={{ cursor: "pointer" }}
                        >
                          {project.user || "N/A"}
                        </TableCell>
                        <TableCell
                          onClick={() => handleViewProjectDetails(project)}
                          style={{ cursor: "pointer" }}
                        >
                          {project.contractor || "N/A"}
                        </TableCell>
                        <TableCell
                          onClick={() => handleViewProjectDetails(project)}
                          style={{ cursor: "pointer" }}
                        >
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {templates.find(
                            (template) => template._id === project.template
                          )?.title || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Typography
                            color={
                              project.status === "finished" ? "green" : "orange"
                            }
                          >
                            {project.status || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {project.status === "not started" ||
                          project.status === "finished" ? (
                            <Tooltip title="Start Project">
                              <IconButton
                                onClick={() => handleStartProject(project._id)}
                                color="secondary"
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            </Tooltip>
                          ) : project.status === "ongoing" ? (
                            <>
                              <Tooltip title="Postpone Project">
                                <IconButton
                                  onClick={() =>
                                    handlePostponeProject(project._id)
                                  }
                                  color="secondary"
                                >
                                  <PauseIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="End Project">
                                <IconButton
                                  onClick={() => handleEndProject(project._id)}
                                  color="secondary"
                                >
                                  <StopIcon />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            project.status === "postponed" && (
                              <Tooltip title="Resume Project">
                                <IconButton
                                  onClick={() =>
                                    handleResumeProject(project._id)
                                  }
                                  color="secondary"
                                >
                                  <RedoIcon />
                                </IconButton>
                              </Tooltip>
                            )
                          )}
                          <Tooltip title="Edit Project">
                            <IconButton
                              onClick={() => handleEditProject(project)}
                              color="secondary"
                              disabled={project.status === "finished"}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              project.isAutomaticProgress
                                ? "Switch to Manual Mode"
                                : "Switch to Automatic Mode"
                            }
                          >
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              onClick={() =>
                                handleToggleProgressMode(
                                  project._id,
                                  !project.isAutomaticProgress
                                )
                              }
                              sx={{ ml: 1 }}
                              disabled={project.status === "finished"}
                            >
                              {project.isAutomaticProgress
                                ? "Automatic"
                                : "Manual"}
                            </Button>
                          </Tooltip>&nbsp;
                          <Tooltip>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              sx={{ ml: 1 }}
                              onClick={() => handleChat(project.name, project._id)}
                            >
                              Chat
                            </Button>
                          </Tooltip>
                          <Tooltip title="Generate BOM">
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              sx={{ ml: 1 }}
                              onClick={() => {
                                setSelectedProjectForBOM(project);
                                setFormData({
                                  totalArea: project.totalArea || '',
                                  avgFloorHeight: project.avgFloorHeight || '',
                                  selectedTemplateId: project.template || '',
                                  numFloors: project.floors.length.toString() || '',
                                  roomCount: project.roomCount || '',
                                  foundationDepth: project.foundationDepth || ''
                                });
                                setSelectedLocation(project.location || '');
                                setGeneratorModalOpen(true);
                              }}
                            >
                              Generate BOM
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete Project">
                            <IconButton
                              onClick={() => handleDeleteClick(project)}
                              color="secondary"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Create/Edit Project Modal */}
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              {isEditing ? "Edit Project" : "Create New Project"}
              <IconButton
                aria-label="close"
                onClick={() => setIsModalOpen(false)}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Typography variant="subtitle1" gutterBottom>
                Floor Plan Image
              </Typography>
              
              {projectImagePreview ? (
                <Box position="relative" display="inline-block">
                  <img
                    src={projectImagePreview}
                    alt="Project Preview"
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveProjectImage}
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button variant="contained" component="label">
                  Upload Floor Plan
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleProjectImageUpload}
                  />
                </Button>
              )}

              {/* Project Name */}
              <TextField
                fullWidth
                margin="dense"
                label="Project Name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
              />

              {/* Project Owner */}
              <FormControl fullWidth margin="dense">
                <InputLabel>Select Project Owner (User)</InputLabel>
                <Select
                  value={newProject.user}
                  onChange={(e) =>
                    setNewProject({ ...newProject, user: e.target.value })
                  }
                  label="Select Project Owner (User)"
                >
                  {users.length > 0 ? (
                    users.map((userOption) => (
                      <MenuItem
                        key={userOption._id}
                        value={userOption.Username}
                      >
                        {userOption.Username}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No Users Available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Template */}
              <FormControl fullWidth margin="dense">
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={newProject.template}
                  onChange={(e) =>
                    setNewProject({ ...newProject, template: e.target.value })
                  }
                  label="Select Template"
                >
                  {templates && templates.length > 0 ? (
                    templates.map((template) => (
                      <MenuItem key={template._id} value={template._id}>
                        {template.title}
                        {template.tier && ` (${template.tier})`}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No Templates Available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Location */}
              <FormControl fullWidth margin="dense">
                <InputLabel>Select Project Location</InputLabel>
                <Select
                  value={newProject.location}
                  onChange={(e) =>
                    setNewProject({ ...newProject, location: e.target.value })
                  }
                  label="Select Project Location"
                >
                  {locations && locations.length > 0 ? (
                    locations.map((locationOption) => (
                      <MenuItem
                        key={locationOption._id}
                        value={locationOption.name}
                      >
                        {locationOption.name} - {locationOption.markup}% markup
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No Locations Available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              {/* Total Area */}
              <TextField
                fullWidth
                margin="dense"
                label="Total Area (sqm)"
                type="number"
                value={newProject.totalArea}
                onChange={handleTotalAreaChange}
                error={!!totalAreaError}
                helperText={totalAreaError}
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />

              {/* Floor Height */}
              <TextField
                fullWidth
                margin="dense"
                label="Floor Height (meters)"
                type="number"
                value={newProject.avgFloorHeight}
                onChange={handleFloorHeightChange}
                error={!!heightError}
                helperText={heightError}
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />

              {/* Room Count */}
              <TextField
                fullWidth
                margin="dense"
                label="Number of Rooms"
                type="number"
                value={newProject.roomCount}
                onChange={handleRoomCountChange}
                error={!!roomCountError}
                helperText={roomCountError}
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />

              {/* Foundation Depth */}
              <TextField
                fullWidth
                margin="dense"
                label="Foundation Depth (meters)"
                type="number"
                value={newProject.foundationDepth}
                onChange={handleFoundationDepthChange}
                error={!!foundationDepthError}
                helperText={foundationDepthError}
                InputProps={{
                  inputProps: { min: 0 },
                }}
              />

              {/* Number of Floors */}
              {!isEditing && (
                <TextField
                  fullWidth
                  margin="dense"
                  label="Number of Floors"
                  type="number"
                  value={newProject.numFloors}
                  onChange={handleNumFloorsChange}
                  error={!!floorError}
                  helperText={floorError}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
              )}

              {/* Project Timeline */}
              <Box display="flex" alignItems="center" mt={2}>
                <TextField
                  label="Duration"
                  type="number"
                  value={newProject.timeline.duration}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value, 10));
                    setNewProject({
                      ...newProject,
                      timeline: { ...newProject.timeline, duration: value },
                    });
                  }}
                  sx={{ mr: 2 }}
                  InputProps={{
                    inputProps: { min: 0 },
                  }}
                />
                <FormControl>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={newProject.timeline.unit}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        timeline: {
                          ...newProject.timeline,
                          unit: e.target.value,
                        },
                      })
                    }
                    label="Unit"
                  >
                    <MenuItem value="weeks">Weeks</MenuItem>
                    <MenuItem value="months">Months</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Floors and Tasks */}
              {newProject.floors.map((floor, floorIndex) => (
                <Accordion key={floorIndex}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{floor.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Floor Progress */}
                    <TextField
                      fullWidth
                      margin="dense"
                      label="Progress"
                      type="number"
                      value={floor.progress || 0}
                      onChange={(e) =>
                        handleFloorChange(
                          floorIndex,
                          "progress",
                          e.target.value,
                          true
                        )
                      }
                    />

                    <Box mt={2} mb={2}>
                      <Button
                        variant="contained"
                        component="label"
                        sx={{ mt: 1 }}
                      >
                        Upload Floor Image
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          multiple
                          onChange={(e) => handleImageUpload(e, floorIndex)}
                        />
                      </Button>

                      <Box mt={2} mb={2}>
                        <Typography variant="subtitle2">
                          Existing Floor Images
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={2}>
                          {(newProject.floors[floorIndex]?.images || [])
                            .filter(Boolean)
                            .map((img, imageIndex) => (
                              <Box
                                key={imageIndex}
                                position="relative"
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                              >
                                {/* Image Display */}
                                <img
                                  src={img.isLocal ? img.preview : img.path}
                                  alt={`Floor Image ${imageIndex + 1}`}
                                  style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                  }}
                                />

                                {/* Remark Field */}
                                <TextField
                                  fullWidth
                                  margin="dense"
                                  label="Remark"
                                  value={img.remark || ""}
                                  onChange={(e) =>
                                    handleUpdateImageRemark(
                                      floorIndex,
                                      imageIndex,
                                      e.target.value
                                    )
                                  }
                                  sx={{ mt: 1 }}
                                />

                                {/* Delete Button */}
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDeleteExistingImage(
                                      floorIndex,
                                      imageIndex
                                    )
                                  }
                                  style={{
                                    position: "absolute",
                                    top: 5,
                                    right: 5,
                                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                        </Box>
                      </Box>

                      {/* Floor Images */}
                      {localImages[floorIndex]?.images?.map(
                        (img, imageIndex) => (
                          <Box
                            key={imageIndex}
                            mt={2}
                            position="relative"
                            display="inline-block"
                          >
                            <img
                              src={img.preview}
                              alt={`Floor Image ${imageIndex + 1}`}
                              style={{
                                width: "150px",
                                height: "150px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleRemoveImage(floorIndex, imageIndex)
                              }
                              style={{
                                position: "absolute",
                                top: 5,
                                right: 5,
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )
                      )}
                    </Box>

                    {/* Tasks */}
                    {floor.tasks.map((task, taskIndex) => (
                      <Box
                        key={taskIndex}
                        mt={2}
                        mb={2}
                        p={2}
                        border={1}
                        borderRadius={1}
                      >
                        {/* Task Name */}
                        <TextField
                          fullWidth
                          margin="dense"
                          label="Task Name"
                          value={task.name}
                          onChange={(e) =>
                            handleTaskChange(
                              floorIndex,
                              taskIndex,
                              "name",
                              e.target.value
                            )
                          }
                        />

                        {/* Task Progress */}
                        <TextField
                          fullWidth
                          margin="dense"
                          label="Task Progress"
                          type="number"
                          value={task.progress || 0}
                          onChange={(e) =>
                            handleTaskChange(
                              floorIndex,
                              taskIndex,
                              "progress",
                              e.target.value,
                              true
                            )
                          }
                        />

                        {/* Task Image and Remark */}
                        <Box mt={2} mb={2}>
                          <Button
                            variant="contained"
                            component="label"
                            sx={{ mt: 1 }}
                          >
                            Upload Task Image
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              multiple
                              onChange={(e) =>
                                handleImageUpload(e, floorIndex, taskIndex)
                              }
                            />
                          </Button>
                        </Box>

                        <Box mt={2} mb={2}>
                      <Typography variant="subtitle2">
                        Existing Tasks Images
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={2}>
                        {(task.images || [])
                          .filter(Boolean)
                          .map((img, imageIndex) => (
                            <Box
                              key={imageIndex}
                              position="relative"
                              display="flex"
                              flexDirection="column"
                              alignItems="center"
                            >
                              {/* Image Display */}
                              <img
                                src={img.path}
                                alt={`Floor Image ${imageIndex + 1}`}
                                style={{
                                  width: "150px",
                                  height: "150px",
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                }}
                              />

                              <TextField
                                fullWidth
                                margin="dense"
                                label="Remark"
                                value={img.remark || ""} // Display the current remark for task images
                                onChange={
                                  (e) =>
                                    handleUpdateTaskImageRemark(
                                      floorIndex,
                                      taskIndex,
                                      imageIndex,
                                      e.target.value
                                    ) // Handle remark changes for task images
                                }
                                sx={{ mt: 1 }}
                              />

                              {/* Delete Button */}
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteExistingTaskImage(
                                    floorIndex,
                                    taskIndex,
                                    imageIndex
                                  )
                                }
                                style={{
                                  position: "absolute",
                                  top: 5,
                                  right: 5,
                                  backgroundColor:
                                    "rgba(255, 255, 255, 0.8)",
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                      </Box>
                    </Box>

                    {/* Task Images */}
                    {localImages[floorIndex]?.tasks[taskIndex]?.images?.map(
                      (img, imageIndex) => (
                        <Box
                          key={imageIndex}
                          mt={2}
                          position="relative"
                          display="inline-block"
                        >
                          <img
                            src={img.preview}
                            alt="Task Preview"
                            style={{
                              width: "150px",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleRemoveImage(
                                floorIndex,
                                imageIndex,
                                taskIndex
                              )
                            }
                            style={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              backgroundColor: "rgba(255, 255, 255, 0.8)",
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    )}

                    {isEditing && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => deleteTask(floorIndex, taskIndex)}
                        sx={{ mt: 1 }}
                      >
                        Delete Task
                      </Button>
                    )}
                  </Box>
                ))}
                {/* Add Task and Delete Floor Buttons */}
                {isEditing && (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => addTaskToFloor(floorIndex)}
                      sx={{ mt: 1 }}
                    >
                      Add Task
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => deleteFloor(floorIndex)}
                      sx={{ mt: 1, ml: 2 }}
                    >
                      Delete Floor
                    </Button>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          ))}

          {isEditing && (
            <Button variant="contained" onClick={addFloor} sx={{ mt: 2 }}>
              Add Floor
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button
            onClick={isEditing ? handleUpdateProject : handleCreateProject}
            variant="contained"
            color="secondary"
          >
            {isEditing ? "Update Project" : "Create Project"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProject && (
        <Dialog
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Project Details - {selectedProject.name}
            <IconButton
              aria-label="close"
              onClick={() => setShowDetailsModal(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {/* Project Image */}
            {selectedProject.projectImage && (
              <Box mb={2}>
                <Typography variant="subtitle2">Floor Plan Image:</Typography>
                <img
                  src={selectedProject.projectImage}
                  alt="Project"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              </Box>
            )}

            {/* Basic Information */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Basic Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  <strong>Project Owner:</strong>{" "}
                  {selectedProject.user || "N/A"}
                </Typography>
                <Typography>
                  <strong>Project Design Engineer:</strong>{" "}
                  {selectedProject.contractor || "N/A"}
                </Typography>
                <Typography>
                  <strong>Template:</strong>{" "}
                  {templates.find(
                    (template) => template._id === selectedProject.template
                  )?.title || "N/A"}
                </Typography>
                <Typography>
                  <strong>Status:</strong>{" "}
                  {selectedProject.status.charAt(0).toUpperCase() +
                    selectedProject.status.slice(1)}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Location */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Location</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  <strong>Location Name:</strong>{" "}
                  {selectedProject.location || "N/A"}
                </Typography>
                <Typography>
                  <strong>Markup:</strong>{" "}
                  {locations.find(
                    (loc) => loc.name === selectedProject.location
                  )?.markup || "N/A"}
                  %
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Specifications */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Specifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  <strong>Total Area:</strong> {selectedProject.totalArea}{" "}
                  sqm
                </Typography>
                <Typography>
                  <strong>Floor Height:</strong>{" "}
                  {selectedProject.avgFloorHeight} meters
                </Typography>
                <Typography>
                  <strong>Number of Rooms:</strong>{" "}
                  {selectedProject.roomCount}
                </Typography>
                <Typography>
                  <strong>Foundation Depth:</strong>{" "}
                  {selectedProject.foundationDepth} meters
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Timeline */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Timeline</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  <strong>Duration:</strong>{" "}
                  {selectedProject.timeline.duration}{" "}
                  {selectedProject.timeline.unit}
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Project Dates */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Project Dates</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  <strong>Start Date:</strong>{" "}
                  {selectedProject.startDate
                    ? new Date(
                        selectedProject.startDate
                      ).toLocaleDateString()
                    : "N/A"}
                </Typography>
                <Typography>
                  <strong>End Date:</strong>{" "}
                  {selectedProject.endDate
                    ? new Date(selectedProject.endDate).toLocaleDateString()
                    : "N/A"}
                </Typography>
                {/* Postponed Dates */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Postponed Dates</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedProject.postponedDates.length > 0 ? (
                      selectedProject.postponedDates.map((date, index) => (
                        <Typography key={index}>
                          {new Date(date).toLocaleDateString()}
                        </Typography>
                      ))
                    ) : (
                      <Typography>No postponed dates</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
                {/* Resumed Dates */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Resumed Dates</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedProject.resumedDates.length > 0 ? (
                      selectedProject.resumedDates.map((date, index) => (
                        <Typography key={index}>
                          {new Date(date).toLocaleDateString()}
                        </Typography>
                      ))
                    ) : (
                      <Typography>No resumed dates</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </AccordionDetails>
            </Accordion>

            {/* Floors and Tasks */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Floors and Tasks</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {selectedProject.floors.map((floor, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {floor.name} - Progress: {floor.progress}%
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {floor.tasks.length > 0 ? (
                        floor.tasks.map((task, taskIndex) => (
                          <Box key={taskIndex} mb={2}>
                            <Typography>
                              <strong>Task Name:</strong> {task.name}
                            </Typography>
                            <Typography>
                              <strong>Task Progress:</strong>{" "}
                              {task.progress}%
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography>No tasks available</Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </AccordionDetails>
            </Accordion>

            {/* BOM Section */}
            {selectedProject.bom &&
            selectedProject.bom.categories.length > 0 ? (
              <>
                <Typography variant="h6" mt={2}>
                  Bill of Materials (BOM)
                </Typography>
                <Typography>
                  <strong>Total Project Cost:</strong> ₱
                  {selectedProject.bom.markedUpCosts?.totalProjectCost?.toLocaleString(
                    "en-PH",
                    { minimumFractionDigits: 2 }
                  )}
                </Typography>
                <Typography>
                  <strong>Labor Cost:</strong> ₱
                  {selectedProject.bom.markedUpCosts?.laborCost?.toLocaleString(
                    "en-PH",
                    { minimumFractionDigits: 2 }
                  )}
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleGenerateBOMPDF("client")}
                  sx={{ mt: 2, mr: 2 }}
                >
                  Download BOM for Client
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleGenerateBOMPDF("Design Engineer")}
                  sx={{ mt: 2 }}
                >
                  Download BOM for Design Engineer
                </Button>
              </>
            ) : (
              <Typography mt={2}>
                <strong>BOM data is not available for this project.</strong>
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Confirm Delete Image Dialog */}
      <Dialog
        open={showImageDeleteModal}
        onClose={handleCancelDeleteImage}
        aria-labelledby="confirm-delete-image-title"
      >
        <DialogTitle id="confirm-delete-image-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this image?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDeleteImage}>Cancel</Button>
          <Button
            onClick={handleConfirmDeleteImage}
            color="secondary"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={showDeleteModal}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Are you sure you want to delete the project "
            {selectedProject?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="secondary"
            variant="contained"
            autoFocus
            disabled={selectedProject?.status === "finished"}
          >
            Delete
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
  </ThemeProvider>

  <ChatComponent projectName={chatProjectName} projectId={chatProjectId} user="DesignEngineer" isChatOpen={isChat} onClose={() => setIsChat(false)} />
  <GeneratorModal
    isOpen={generatorModalOpen}
    onClose={closeGeneratorModal}
    onSubmit={handleSubmit}
    formData={formData}
    handleChange={handleChange}
    errors={errors}
    projects={projects}
    handleProjectSelect={() => {}} 
    selectedProject={selectedProjectForBOM}
    isProjectBased={true}
    locations={locations}
    handleLocationSelect={handleLocationSelect}
    selectedLocation={selectedLocation}
    isLoadingProjects={isLoading}
    isLoadingBOM={isLoadingBOM}
    templates={templates}
  />

{bom && (
  <Dialog
    open={!!bom}
    onClose={() => setBom(null)}
    fullWidth
    maxWidth="lg"
  >
    <DialogTitle>
      Generated BOM for {selectedProjectForBOM?.name || 'Custom Project'}
      <IconButton
        aria-label="close"
        onClick={() => setBom(null)}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent dividers>
      <TableContainer>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell><strong>Project Name</strong></TableCell>
              <TableCell>{selectedProjectForBOM?.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Project Owner</strong></TableCell>
              <TableCell>{selectedProjectForBOM?.user}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Room Count</strong></TableCell>
              <TableCell>{selectedProjectForBOM?.roomCount}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Foundation Depth</strong></TableCell>
              <TableCell>{selectedProjectForBOM?.foundationDepth}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Grand Total</strong></TableCell>
              <TableCell>PHP {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Total Area</strong></TableCell>
              <TableCell>{bom.projectDetails.totalArea} sqm</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Number of Floors</strong></TableCell>
              <TableCell>{bom.projectDetails.numFloors}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Floor Height</strong></TableCell>
              <TableCell>{bom.projectDetails.avgFloorHeight} meters</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell>{bom.projectDetails.location.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Markup</strong></TableCell>
              <TableCell>{bom.projectDetails.location.markup}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={4}>
        <Typography variant="h6">Cost Details</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Total Project Cost</TableCell>
                <TableCell>Labor Cost</TableCell>
                <TableCell>Location Markup</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>PHP {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(bom.markedUpCosts.totalProjectCost || 0)}</TableCell>
                <TableCell>PHP {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(bom.markedUpCosts.laborCost || 0)}</TableCell>
                <TableCell>{bom.projectDetails.location.markup}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Materials</Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAddMaterialClick}
            startIcon={<AddIcon />}
          >
            Add Material
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Unit Cost (PHP)</TableCell>
                <TableCell>Total (PHP)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bom.categories.map((cat, ci) => cat.materials.map((mat, mi) => (
                <TableRow key={`${ci}-${mi}`}>
                  <TableCell>{cat.category.toUpperCase()}</TableCell>
                  <TableCell>{mat.item}</TableCell>
                  <TableCell>{mat.description}</TableCell>
                  <TableCell>{mat.quantity ? Math.ceil(mat.quantity) : 'N/A'}</TableCell>
                  <TableCell>{mat.unit}</TableCell>
                  <TableCell>PHP {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(mat.cost || 0)}</TableCell>
                  <TableCell>PHP {new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(mat.totalAmount || 0)}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => handleReplaceClick(mat)}
                      startIcon={<SwapHoriz />}
                    >
                      Replace
                    </Button>
                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => handleGenerateBOMPDF('client')}
      >
        Download Client PDF
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => handleGenerateBOMPDF('designEngineer')}
      >
        Download Engineer PDF
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => handleSaveBOM(selectedProjectForBOM?._id)}
      >
        Save BOM
      </Button>
      <Button
        variant="contained"
        color="secondary"
        onClick={() => setBom(null)}
      >
        Close
      </Button>
    </DialogActions>
  </Dialog>
)}

<MaterialSearchModal
  isOpen={materialModalOpen}
  onClose={() => setMaterialModalOpen(false)}
  onMaterialSelect={handleMaterialSelect}
  onMaterialAdd={handleMaterialAdd}
  materialToReplace={materialToReplace}
  user={user}
/>

{/* Add Material Modal */}
<Dialog open={addMaterialModalOpen} onClose={() => setAddMaterialModalOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>
    Add New Material
    <IconButton onClick={() => setAddMaterialModalOpen(false)} style={{ position: 'absolute', right: 8, top: 8 }}>
      <Close />
    </IconButton>
  </DialogTitle>
  <DialogContent dividers>
    <TextField
      fullWidth
      margin="dense"
      label="Description"
      value={newMaterial.description}
      onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
      required
    />
    <TextField
      fullWidth
      margin="dense"
      label="Unit"
      value={newMaterial.unit}
      onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
      placeholder="e.g., bags, pieces, meters"
      required
    />
    <TextField
      fullWidth
      margin="dense"
      label="Cost (₱)"
      type="number"
      value={newMaterial.cost}
      onChange={(e) => setNewMaterial({...newMaterial, cost: e.target.value})}
      required
    />
    <TextField
      fullWidth
      margin="dense"
      label="Specifications"
      value={newMaterial.specifications}
      onChange={(e) => setNewMaterial({...newMaterial, specifications: e.target.value})}
    />
    <TextField
      fullWidth
      margin="dense"
      label="Supplier"
      value={newMaterial.supplier}
      onChange={(e) => setNewMaterial({...newMaterial, supplier: e.target.value})}
    />
    <TextField
      fullWidth
      margin="dense"
      label="Brand"
      value={newMaterial.brand}
      onChange={(e) => setNewMaterial({...newMaterial, brand: e.target.value})}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setAddMaterialModalOpen(false)}>Cancel</Button>
    <Button onClick={handleCreateMaterial} variant="contained" color="primary">
      Add Material
    </Button>
  </DialogActions>
</Dialog>
</>
);
};

export default ProjectList;