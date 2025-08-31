require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const chatRoutes = require('./routes/chatRoutes');
const materialRoutes = require('./routes/materialsRoute');
const locationRoutes = require('./routes/locationsRoute');
const templatesRoutes = require('./routes/templatesRoute');
const bomRoutes = require('./routes/bomRoute');
const userRoutes = require('./routes/usersRoute');
const projectRoutes = require('./routes/projectRoute');
const preprojectRoutes = require('./routes/preprojectRoute');
const { authMiddleware, authorizeRoles } = require('./middlewares/authMiddleware');
const cors = require('cors');
const cron = require('node-cron'); 
const Project = require('./models/projectModel'); 

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});


app.use(cors({
  origin: ' http://localhost:5173', 
  // origin: 'https://csoriano.netlify.app',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true, 
  optionsSuccessStatus: 200, 
}));


app.use('/api/user', userRoutes);


app.use('/api/chat', chatRoutes);
app.use('/api/materials', authMiddleware, authorizeRoles(['designEngineer', 'admin', 'user']), materialRoutes);
app.use('/api/locations', authMiddleware, authorizeRoles(['designEngineer', 'admin', 'user']), locationRoutes);
app.use('/api/templates', authMiddleware, authorizeRoles(['designEngineer', 'admin']), templatesRoutes);
app.use('/api/bom', authMiddleware, authorizeRoles(['designEngineer', 'admin']), bomRoutes);
app.use('/api/project', authMiddleware, authorizeRoles(['designEngineer', 'admin', 'user']), projectRoutes);
app.use('/api/preprojects', authMiddleware, authorizeRoles(['designEngineer', 'admin', 'user']), preprojectRoutes);

// Function to calculate and update project progress
const updateDailyProgress = async () => {
  try {
    const ongoingProjects = await Project.find({ status: 'ongoing' });
    console.log(`Found ${ongoingProjects.length} ongoing projects to update.`);

    for (const project of ongoingProjects) {
      console.log(`Updating progress for project: ${project.name}`);

      // Recalculate progress using the `applyHybridProgress` method
      project.applyHybridProgress();
      await project.save();

      console.log(`Updated progress for project "${project.name}" to ${project.progress}%`);
    }

    console.log("All ongoing projects have been updated successfully.");
  } catch (error) {
    console.error("Error updating project progress:", error);
  }
};



mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log('Connected to DB and listening on ' + process.env.PORT);
      

      
      cron.schedule('0 0 * * *', () => {
        console.log("Running daily project progress update...");
        updateDailyProgress();
      }, {
        timezone: "Asia/Manila" 
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });