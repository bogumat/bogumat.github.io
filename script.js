function populateProjects(projects) {
  // Target the 'project-grid' class inside the 'projects' section
  const projectsContainer = document.querySelector('#projects .project-grid');
  let projectsHTML = '';

  projects.forEach(project => {
    projectsHTML += `
      <div class="project-item">
        <h3><a href="${project.link}">${project.title}</a></h3>
      </div>
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
