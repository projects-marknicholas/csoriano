import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuthContext } from '../hooks/useAuthContext';
import Navbar from './Navbar';
import styles from '../css/ProjectProgress.module.css';
import { jsPDF } from 'jspdf'; // Import jsPDF for PDF generation
import 'jspdf-autotable'; // Import autoTable plugin for jsPDF
import sorianoLogo from '../assets/sorianoLogo.jpg'; // Assuming you want to include a logo in the BOM PDF

const ProjectProgress = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [bomDetailsOpen, setBomDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/project/${projectId}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });

        const fetchedProject = response.data.project || response.data;
        setProject(fetchedProject);
        console.log("Progress", response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) {
      fetchProject();
    }
  }, [projectId, user?.token]);

  const handleFloorClick = (floorId) => {
    setSelectedFloor(selectedFloor === floorId ? null : floorId);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image); // Open modal with clicked image
  };

  const handleCloseModal = () => {
    setSelectedImage(null); // Close modal
  };

  const toggleBomDetails = () => {
    setBomDetailsOpen(!bomDetailsOpen);
  };

  // Function to generate and download the BOM PDF
  const handleDownloadBOM = () => {
    if (!project || !project.bom) {
      console.error('No BOM data available.');
      return;
    }

    const { bom, name } = project;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20; // Starting y position for details

    // Add the logo at the top
    const imgWidth = pageWidth - 40; // Adjust width to make it centered and smaller than page width
    const imgHeight = imgWidth * 0.4; // Maintain aspect ratio
    doc.addImage(sorianoLogo, 'JPEG', 20, 10, imgWidth, imgHeight);
    yPosition += imgHeight + 10; // Adjust y position below the logo

    // Add Title
    doc.setFontSize(18);
    doc.text(`Client BOM: ${name || 'N/A'}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.setFontSize(12);
    yPosition += 10;

    // Project details
    doc.text(`Total Area: ${bom.projectDetails.totalArea || 'N/A'} sqm`, 10, yPosition);
    yPosition += 10;
    doc.text(`Number of Floors: ${bom.projectDetails.numFloors || 'N/A'}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Floor Height: ${bom.projectDetails.avgFloorHeight || 'N/A'} meters`, 10, yPosition);
    yPosition += 10;
    doc.text(`Room Count: ${bom.projectDetails.roomCount || 'N/A'}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Foundation Depth: ${bom.projectDetails.foundationDepth || 'N/A'} meters`, 10, yPosition);
    yPosition += 10;
    doc.text(`Location: ${bom.projectDetails.location?.name || 'N/A'} (${bom.projectDetails.location?.markup || 0}% markup)`, 10, yPosition);
    yPosition += 15;

    // BOM Costs
    doc.setFontSize(14);
    doc.text('Cost Summary:', 10, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.text(`Original Labor Cost: PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
      bom.originalCosts.laborCost || 0
    )}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Original Total Project Cost: PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
      bom.originalCosts.totalProjectCost || 0
    )}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Marked Up Labor Cost: PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
      bom.markedUpCosts.laborCost || 0
    )}`, 10, yPosition);
    yPosition += 10;
    
    // BOM Grand Total
    const grandTotal = `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
      bom.markedUpCosts.totalProjectCost || 0
    )}`;
    doc.setFontSize(16);
    doc.text(`Grand Total: ${grandTotal}`, 10, yPosition);
    yPosition += 20;

    // BOM Categories
    doc.setFontSize(14);
    doc.text('BOM Categories:', 10, yPosition);
    yPosition += 10;

    bom.categories.forEach((category, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.text(`${index + 1}. ${category.category.toUpperCase()} - PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(
        category.categoryTotal || 0
      )}`, 10, yPosition);
      yPosition += 8;

      // Add materials table for this category
      doc.autoTable({
        head: [['Item', 'Description', 'Quantity', 'Unit', 'Cost', 'Total Amount']],
        body: category.materials.map(material => [
          material.item,
          material.description,
          material.quantity,
          material.unit,
          `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.cost)}`,
          `PHP ${new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.totalAmount)}`,
        ]),
        startY: yPosition,
        headStyles: { fillColor: [41, 128, 185] },
        bodyStyles: { textColor: [44, 62, 80] },
        theme: 'grid',
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    });

    // Save the PDF
    doc.save(`Client_BOM_${name}.pdf`);
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading project details...
        </Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <Typography variant="h6">Project not found.</Typography>
      </Box>
    );
  }

  const startDate = new Date(project.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'Not yet completed';

  return (
    <div className={styles.container}>
      <Navbar />
      <Box p={3}>
        <Typography variant="h4" gutterBottom className={styles.title}>
          {project.name ? project.name.toUpperCase() : 'Untitled Project'}
        </Typography>
        <Typography className={styles.dateTitle} variant="body1" gutterBottom>
          Started on: {startDate}
        </Typography>
        {project.endDate && (
          <Typography className={styles.dateTitle} variant="body1" gutterBottom>
            Completed on: {endDate}
          </Typography>
        )}
        <Typography variant="body1" gutterBottom className={styles.progressTitle}>
          STATUS: {project.status ? project.status.toUpperCase() : 'UNKNOWN'}
        </Typography>

        {/* Project Details */}
        <Box mt={3} p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
          <Typography variant="h6" gutterBottom>
            Project Details
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Typography variant="body2">
              <strong>Total Area:</strong> {project.totalArea} sqm
            </Typography>
            <Typography variant="body2">
              <strong>Average Floor Height:</strong> {project.avgFloorHeight} meters
            </Typography>
            <Typography variant="body2">
              <strong>Room Count:</strong> {project.roomCount}
            </Typography>
            <Typography variant="body2">
              <strong>Foundation Depth:</strong> {project.foundationDepth} meters
            </Typography>
            <Typography variant="body2">
              <strong>Location:</strong> {project.location}
            </Typography>
            <Typography variant="body2">
              <strong>Contractor:</strong> {project.contractor}
            </Typography>
          </Box>
        </Box>

        {/* Timeline */}
        {project.timeline && (
          <Box mt={2} p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px' }}>
            <Typography variant="h6" gutterBottom>
              Project Timeline
            </Typography>
            <Typography variant="body2">
              <strong>Duration:</strong> {project.timeline.duration} {project.timeline.unit}
            </Typography>
          </Box>
        )}

        {/* BOM Section */}
        {project.bom && (
          <Box mt={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Button variant="contained" color="secondary" onClick={handleDownloadBOM}>
                Download your BOM
              </Button>
              <Button variant="outlined" onClick={toggleBomDetails}>
                {bomDetailsOpen ? 'Hide BOM Details' : 'Show BOM Details'}
              </Button>
            </Box>

            {bomDetailsOpen && (
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  Bill of Materials Summary
                </Typography>
                
                {/* Cost Summary */}
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Cost Summary
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    <Typography variant="body2">
                      <strong>Original Labor Cost:</strong> PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(project.bom.originalCosts.laborCost)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Original Total Project Cost:</strong> PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(project.bom.originalCosts.totalProjectCost)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Marked Up Labor Cost:</strong> PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(project.bom.markedUpCosts.laborCost)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Marked Up Total Project Cost:</strong> PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(project.bom.markedUpCosts.totalProjectCost)}
                    </Typography>
                  </Box>
                </Box>

                {/* Categories */}
                {project.bom.categories.map((category, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {category.category} - PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(category.categoryTotal)}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell>Quantity</TableCell>
                              <TableCell>Unit</TableCell>
                              <TableCell>Cost</TableCell>
                              <TableCell>Total Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {category.materials.map((material, matIndex) => (
                              <TableRow key={matIndex}>
                                <TableCell>{material.item}</TableCell>
                                <TableCell>{material.description}</TableCell>
                                <TableCell>{material.quantity}</TableCell>
                                <TableCell>{material.unit}</TableCell>
                                <TableCell>PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.cost)}</TableCell>
                                <TableCell>PHP {new Intl.NumberFormat('en-PH', { style: 'decimal', minimumFractionDigits: 2 }).format(material.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Floors and Progress */}
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Floors and Progress
          </Typography>
          
          {project.floors && project.floors.length > 0 ? (
            project.floors.map((floor) => (
              <Accordion
                key={floor._id}
                expanded={selectedFloor === floor._id}
                onChange={() => handleFloorClick(floor._id)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box width="100%" display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">{floor.name}</Typography>
                    <Box width="40%">
                      <LinearProgress
                        variant="determinate"
                        value={floor.progress || 0}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          [`& .MuiLinearProgress-bar`]: {
                            backgroundColor: '#a7b194',
                          },
                          backgroundColor: '#e0e0e0',
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" align="center">
                        {Math.round(floor.progress || 0)}%
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="h6">Tasks</Typography>

                  {/* Floor Images */}
                  {floor.images && floor.images.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                      {floor.images.map((image, index) => (
                        <Box key={index} textAlign="center" onClick={() => handleImageClick(image)}>
                          <img
                            src={image.path}
                            alt={`Floor ${floor.name} Image ${index + 1}`}
                            style={{
                              width: '150px',
                              height: '150px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          />
                          <Typography variant="body2" mt={1}>
                            {image.remark || 'No remark'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Task Images */}
                  {floor.tasks && floor.tasks.length > 0 ? (
                    floor.tasks.map((task) => (
                      <Box key={task._id} mb={4}>
                        {/* Task Name and Progress Bar */}
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="body1" sx={{ flex: 1 }}>
                            {task.name || 'Unnamed Task'}
                          </Typography>
                          <Typography variant="body2" sx={{ marginLeft: 2 }}>
                            {Math.round(task.progress || 0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={task.progress || 0}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            [`& .MuiLinearProgress-bar`]: {
                              backgroundColor: '#a7b194',
                            },
                            backgroundColor: '#e0e0e0',
                          }}
                        />

                        {/* Task Images */}
                        {task.images && task.images.length > 0 && (
                          <Box mt={2} display="flex" flexWrap="wrap" gap={2}>
                            {task.images.map((image, index) => (
                              <Box key={index} textAlign="center" onClick={() => handleImageClick(image)}>
                                <img
                                  src={image.path}
                                  alt={`Task ${task.name} Image ${index + 1}`}
                                  style={{
                                    width: '150px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                  }}
                                />
                                <Typography variant="body2" mt={1}>
                                  {image.remark || 'No remark'}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No tasks available for this floor.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No floors data available.
            </Typography>
          )}
        </Box>

        {/* Modal for Full-View Image */}
        <Dialog open={!!selectedImage} onClose={handleCloseModal} maxWidth="lg" fullWidth PaperProps={{
          style: {
            backgroundColor: 'transparent', 
            boxShadow: 'none', 
          },
        }}>
          <DialogContent sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleCloseModal}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0, 0, 0, 0.5)',
                color: '#fff',
              }}
            >
              <CloseIcon />
            </IconButton>
            {selectedImage && (
              <img
                src={selectedImage.path}
                alt={selectedImage.remark || 'Full view'}
                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
              />
            )}
            {selectedImage?.remark && (
              <Typography variant="body1" align="center" mt={2} sx={{ color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', p: 1 }}>
                {selectedImage.remark}
              </Typography>
            )}
          </DialogContent>
        </Dialog>

        <Typography variant="body2" color="textSecondary" mt={4}>
          LAST UPDATE:{' '}
          {project.updatedAt
            ? new Date(project.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'No updates available'}
        </Typography>
      </Box>
    </div>
  );
};

export default ProjectProgress;