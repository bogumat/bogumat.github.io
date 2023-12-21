function populateProjects(projects) {
    const projectsContainer = document.querySelector('.grid-section');
    let projectsHTML = '';
  
    projects.forEach(project => {
      projectsHTML += `
        <a href="${project.link}" class="grid-item">
          <div class="project-item">
            <img src="${project.imgSrc}" alt="${project.title}" class="project-image">
            <h3>${project.title} ${project.year}</h3>
          </div>
        </a>
      `;
    });
  
    projectsContainer.innerHTML = projectsHTML;
  }
  
  function fetchProjects() {
    fetch('projects.json')
      .then(response => response.json())
      .then(data => populateProjects(data))
      .catch(error => console.error('Error fetching projects:', error));
  }
  
  document.addEventListener('DOMContentLoaded', fetchProjects);
  