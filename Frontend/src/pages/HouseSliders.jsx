import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../css/HouseSliders.module.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const HouseSliders = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const { user } = useAuthContext();

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
        setFilteredProjects(response.data.filter(project => project.status === "finished"));
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, [user]);

  // Handle the filter logic
  const handleFilter = () => {
    const min = parseInt(minBudget, 10) || 0;
    const max = parseInt(maxBudget, 10) || Infinity;

    const filtered = projects.filter(
      (project) =>
        project.bom?.markedUpCosts?.totalProjectCost >= min &&
        project.bom?.markedUpCosts?.totalProjectCost <= max &&
        project.status === "finished"
    );
    setFilteredProjects(filtered);
  };

  // Validation to ensure values are non-negative
  const handleMinBudgetChange = (e) => {
    const value = e.target.value;
    setMinBudget(value < 0 ? "0" : value);
  };

  const handleMaxBudgetChange = (e) => {
    const value = e.target.value;
    setMaxBudget(value < 0 ? "0" : value);
  };

  const budgetOptions = [
    { label: "1M", value: 1000000 },
    { label: "1.5M", value: 1500000 },
    { label: "2M", value: 2000000 },
    { label: "2.5M", value: 2500000 },
    { label: "3M", value: 3000000 },
    { label: "3.5M", value: 3500000 },
  ];

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {/* Filter Section */}
        <div className={styles.filterContainer}>
          <h2>Filter by Budget</h2>
          <div className={styles.inputContainer}>
            <label htmlFor="minBudget">Min Budget</label>
            <input
              id="minBudget"
              type="number"
              placeholder="Enter minimum budget"
              value={minBudget}
              onChange={handleMinBudgetChange}
              className={styles.budgetInput}
            />
            <select
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className={styles.budgetSelect}
            >
              <option value="">Choose Min Budget</option>
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="maxBudget">Max Budget</label>
            <input
              id="maxBudget"
              type="number"
              placeholder="Enter maximum budget"
              value={maxBudget}
              onChange={handleMaxBudgetChange}
              className={styles.budgetInput}
            />
            <select
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className={styles.budgetSelect}
            >
              <option value="">Choose Max Budget</option>
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleFilter} className={styles.filterButton}>
            Filter
          </button>
        </div>

        {/* Project List */}
        <div className={styles.projectList}>
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
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
                </div>
              </Link>
            ))
          ) : (
            <p>No finished projects found within the specified budget range.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default HouseSliders;