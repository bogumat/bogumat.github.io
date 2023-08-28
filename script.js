document.addEventListener("DOMContentLoaded", function() {
    fetch('projects.json')
      .then(response => response.json())
      .then(items => {
        const container = document.getElementById("grid-container");
  
        items.forEach(item => {
          const box = document.createElement("div");
          box.className = "grid-item";
  
          box.innerHTML = `
            <h2>${item.title}</h2>
            <div class="image" style="background-image: url(${item.imgSrc})"></div>
            <p>${item.desc}</p>
            <a href="${item.link}">More Info</a>
          `;
  
          container.appendChild(box);
        });
      })
      .catch(error => console.error('Error:', error));
  });
  