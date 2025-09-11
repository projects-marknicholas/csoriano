import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../css/HouseSliders.module.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { TextField, Button } from "@mui/material"; // Material UI TextField and Button
import Pagination from "@mui/material/Pagination"; // Import Pagination from Material-UI

const HouseSliders = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const { user } = useAuthContext();

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(12); // Display 12 projects per page

  // Search Date State
  const [searchDate, setSearchDate] = useState(""); // Search Date for finished date only

  // Fetch all projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/project/contractor", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setProjects(response.data);
        setFilteredProjects(response.data); // Initially show all projects
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, [user]);

  console.log("Projects", projects);

  // Handle the search by finished date functionality
  const handleSearch = () => {
    if (!searchDate) {
      setFilteredProjects(projects); // If no date is selected, show all projects
      return;
    }

    const filtered = projects.filter((project) => {
      if (!project.updatedAt) return false; // Skip projects without a finishedAt date

      const finishedAtDate = new Date(project.updatedAt).toISOString().split('T')[0]; // Get only the date part in ISO format
      const searchFormattedDate = new Date(searchDate).toISOString().split('T')[0]; // Get only the date part from search date

      // Compare both the dates
      return finishedAtDate === searchFormattedDate;
    });

    // Sort filtered projects by finished date (ascending order)
    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateA - dateB; // Ascending order
    });

    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to the first page when search is performed
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Calculate the projects to display on the current page
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Search Section */}
        <div className={styles.searchContainer}>
          <h2>Search Projects by Finished Date</h2>
          <div className={styles.searchInputContainer}>
            <TextField
              type="date"
              id="searchDate"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className={styles.dateInput}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              className={styles.searchButton}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Project List */}
        <div className={styles.projectList}>
          {currentProjects.length > 0 ? (
            currentProjects.map((project) => (
              <Link
                to={`/projects/${project._id}`}
                key={project._id}
                className={styles.projectCard}
              >
                <div className={styles.projectImageContainer}>
                  {project.floors?.[0]?.images?.[0]?.path ? (
                    <img
                      src={project.floors[0].images[0].path}
                      alt={project.name || "Project Image"}
                      className={styles.projectImage}
                    />
                  ) : (
                    <div className={styles.projectImagePlaceholder}>
                      No Image Available
                    </div>
                  )}
                </div>
                <div className={styles.projectDetails}>
                  <h3>{project.name}</h3>
                  <p>
                    <strong>Total Area:</strong> {project.totalArea} sqm
                  </p>
                  <p>
                    <strong>Number of Floors:</strong> {project.numFloors}
                  </p>
                  <p>
                    <strong>Room Count:</strong> {project.roomCount}
                  </p>
                  <p>
                    <strong>Total Project Cost:</strong> ₱
                    {project.bom?.markedUpCosts?.totalProjectCost?.toLocaleString() || "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {project?.status ? project?.status : 'N/A'}
                  </p>
                  <p>
                    <strong>Finished At:</strong> {project?.updatedAt ? new Date(project.updatedAt).toISOString().split('T')[0] : 'N/A'}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p>No projects found for the selected finished date.</p>
          )}
        </div>

        {/* Pagination */}
        <div className={styles.paginationContainer}>
          <Pagination
            count={Math.ceil(filteredProjects.length / projectsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            variant="outlined"
            shape="rounded"
            sx={{
              display: "flex",
              justifyContent: "center", // This will center the pagination
              marginTop: "20px",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default HouseSliders;
