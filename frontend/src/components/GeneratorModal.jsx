import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import axios from 'axios';

const GeneratorModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  handleChange,
  errors,
  projects,
  handleProjectSelect,
  selectedProject,
  isProjectBased,
  locations,
  handleLocationSelect,
  selectedLocation,
  isLoadingProjects,
  isLoadingBOM,
  templates,
}) => {
  const [localFormData, setLocalFormData] = useState(formData);
  const [localErrors, setLocalErrors] = useState(errors);

  useEffect(() => {
    setLocalFormData(formData);
    setLocalErrors(errors);
  }, [formData, errors]);

  const handleLocalChange = (e) => {
    handleChange(e);
    setLocalFormData({ ...localFormData, [e.target.name]: e.target.value });
  };

  const handleLocalSubmit = (e) => {
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isProjectBased ? 'Generate BOM with Project' : 'Custom Generate BOM'}
      </DialogTitle>
      <DialogContent>
        {isProjectBased && (
          <Box mb={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject?._id || ''}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={isLoadingProjects}
                label="Select Project"
              >
                {isLoadingProjects ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                  </MenuItem>
                ) : projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
        <Box mb={2}>
          <TextField
            fullWidth
            margin="normal"
            label="Total Area (sqm)"
            name="totalArea"
            value={localFormData.totalArea}
            onChange={handleLocalChange}
            error={!!errors.totalArea}
            helperText={errors.totalArea}
            type="number"
            disabled={isProjectBased && !!selectedProject}
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            margin="normal"
            label="Average Floor Height (meters)"
            name="avgFloorHeight"
            value={localFormData.avgFloorHeight}
            onChange={handleLocalChange}
            error={!!errors.avgFloorHeight}
            helperText={errors.avgFloorHeight}
            type="number"
            disabled={isProjectBased && !!selectedProject}
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            margin="normal"
            label="Number of Floors"
            name="numFloors"
            value={localFormData.numFloors}
            onChange={handleLocalChange}
            error={!!errors.numFloors}
            helperText={errors.numFloors}
            type="number"
            disabled={isProjectBased && !!selectedProject}
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            margin="normal"
            label="Room Count"
            name="roomCount"
            value={localFormData.roomCount}
            onChange={handleLocalChange}
            error={!!errors.roomCount}
            helperText={errors.roomCount}
            type="number"
            disabled={isProjectBased && !!selectedProject}
          />
        </Box>
        <Box mb={2}>
          <TextField
            fullWidth
            margin="normal"
            label="Foundation Depth (meters)"
            name="foundationDepth"
            value={localFormData.foundationDepth}
            onChange={handleLocalChange}
            error={!!errors.foundationDepth}
            helperText={errors.foundationDepth}
            type="number"
            disabled={isProjectBased && !!selectedProject}
          />
        </Box>
        <Box mb={2}>
          <FormControl fullWidth margin="normal" error={!!errors.selectedTemplateId}>
            <InputLabel>Template</InputLabel>
            <Select
              value={localFormData.selectedTemplateId}
              onChange={handleLocalChange}
              name="selectedTemplateId"
              label="Template"
              disabled={isProjectBased && !!selectedProject}
            >
              {templates.map((template) => (
                <MenuItem key={template._id} value={template._id}>
                  {template.title}
                </MenuItem>
              ))}
            </Select>
            {errors.selectedTemplateId && (
              <Typography color="error" variant="caption">
                {errors.selectedTemplateId}
              </Typography>
            )}
          </FormControl>
        </Box>
        <Box mb={2}>
          <FormControl fullWidth margin="normal" error={!!errors.location}>
            <InputLabel>Location</InputLabel>
            <Select
              value={selectedLocation}
              onChange={(e) => handleLocationSelect(e.target.value)}
              label="Location"
            >
              {locations.map((location) => (
                <MenuItem key={location.name} value={location.name}>
                  {location.name} ({location.markup}%)
                </MenuItem>
              ))}
            </Select>
            {errors.location && (
              <Typography color="error" variant="caption">
                {errors.location}
              </Typography>
            )}
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleLocalSubmit}
          color="primary"
          variant="contained"
          disabled={isLoadingBOM}
        >
          {isLoadingBOM ? <CircularProgress size={24} /> : 'Generate BOM'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GeneratorModal;