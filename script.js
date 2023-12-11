const projects = [
    {
      title: "MEng Thesis",
      imageUrl: "images/thesis.png",
      description: "Improving Astronaut Dexterity using a Passive Telehaptic Exoskeleton"
    },
    {
      title: "Project 2",
      imageUrl: "path_to_project2_image.jpg",
      description: "Description of Project 2"
    }
  ]; // Added missing closing bracket
  
  function populateProjects() {
    // Target the 'project-grid' class inside the 'projects' section
    const projectsContainer = document.querySelector('#projects .project-grid');
    let projectsHTML = '';
  
    projects.forEach(project => {
      projectsHTML += `
        <div class="project-item">
          <img src="${project.imageUrl}" alt="${project.title}">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
        </div>
      `;
    });
  
    projectsContainer.innerHTML = projectsHTML;
  }
  
  document.addEventListener('DOMContentLoaded', populateProjects);
  