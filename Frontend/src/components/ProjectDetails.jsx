import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "../css/ProjectDetails.module.css";
import { useAuthContext } from '../hooks/useAuthContext';
import Navbar from './Navbar';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/project/${id}`, {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        });
        setProject(response.data);
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, user?.token]);

  if (loading) {
    return <p>Loading project details...</p>;
  }

  if (!project) {
    return <p>Project not found.</p>;
  }

  return (
    <>
      <Navbar />
      <div className={styles.detailsContainer}>
        <h1 className={styles.h123}>{project.name}</h1>
        
        {/* Display first available image from floors */}
        {project.floors && project.floors.length > 0 && project.floors[0].images && project.floors[0].images.length > 0 ? (
          <img
            src={project.floors[0].images[0].path}
            alt={project.name}
            className={styles.projectImage}
          />
        ) : (
          <div className={styles.projectImagePlaceholder}>No Image Available</div>
        )}
        
        <div className={styles.projectInfo}>
          <h2>Project Information</h2>
          <p><strong>Status:</strong> {project.status || "N/A"}</p>
          <p><strong>Owner:</strong> {project.user || "N/A"}</p>
          <p><strong>Contractor:</strong> {project.contractor || "N/A"}</p>
          <p><strong>Location:</strong> {project.location || "N/A"}</p>
          <p><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>

        {project.bom && (
          <div className={styles.bomDetails}>
            <h2>Bill of Materials</h2>
            <div className={styles.bomSummary}>
              <p><strong>Total Area:</strong> {project.totalArea || 0} sqm</p>
              <p><strong>Number of Floors:</strong> {project.numFloors || 0}</p>
              <p><strong>Room Count:</strong> {project.roomCount || 0}</p>
              <p><strong>Foundation Depth:</strong> {project.foundationDepth || 0} m</p>
              <p><strong>Labor Cost:</strong> ₱{(project.bom.markedUpCosts?.laborCost || 0).toLocaleString()}</p>
              <p><strong>Material Cost:</strong> ₱{(project.bom.markedUpCosts?.materialTotalCost || 0).toLocaleString()}</p>
              <p><strong>Total Project Cost:</strong> ₱{(project.bom.markedUpCosts?.totalProjectCost || 0).toLocaleString()}</p>
            </div>
            
            <h3>Materials Breakdown</h3>
            <table className={styles.bomTable}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Cost (₱)</th>
                  <th>Total Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                {project.bom.categories.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    {category.materials.map((material, materialIndex) => (
                      <tr key={materialIndex}>
                        {materialIndex === 0 && (
                          <td rowSpan={category.materials.length}>
                            {category.category}
                          </td>
                        )}
                        <td>{material.description || "N/A"}</td>
                        <td>{material.quantity || 0}</td>
                        <td>{material.unit || "N/A"}</td>
                        <td>₱{(material.cost || 0).toLocaleString()}</td>
                        <td>₱{(material.totalAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Floors and Tasks Section */}
        {project.floors && project.floors.length > 0 && (
          <div className={styles.floorsSection}>
            <h2>Floors and Progress</h2>
            {project.floors.map((floor, floorIndex) => (
              <div key={floorIndex} className={styles.floorContainer}>
                <h3>{floor.name} - {floor.progress}% complete</h3>
                
                {/* Floor Images */}
                {floor.images && floor.images.length > 0 && (
                  <div className={styles.floorImages}>
                    {floor.images.map((image, imgIndex) => (
                      <div key={imgIndex} className={styles.imageContainer}>
                        <img 
                          src={image.path} 
                          alt={`${floor.name} - Image ${imgIndex + 1}`} 
                          className={styles.floorImage}
                        />
                        {image.remark && <p className={styles.imageRemark}>{image.remark}</p>}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Tasks */}
                {floor.tasks && floor.tasks.length > 0 && (
                  <div className={styles.tasksContainer}>
                    <h4>Tasks</h4>
                    <table className={styles.tasksTable}>
                      <thead>
                        <tr>
                          <th>Task Name</th>
                          <th>Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floor.tasks.map((task, taskIndex) => (
                          <tr key={taskIndex}>
                            <td>{task.name}</td>
                            <td>{task.progress}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ProjectDetails;