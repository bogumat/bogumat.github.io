document.addEventListener('DOMContentLoaded', function() {
    const header = document.createElement('header');
    header.innerHTML = `
      <link rel="icon" type="image/x-icon" href="/images/favicon.png">
      <nav>
        <a href="../index.html#projects">Projects</a>
        <a href="../index.html#contact">Contact</a>
        <a href="https://matbogus.substack.com/">Blog</a>
        <a href="https://drive.google.com/file/d/1ZZhML2OPZIkJq1OYjqin42RYiO3gINbT/view?usp=sharing">CV</a>
      </nav>
    `;
    document.body.insertBefore(header, document.body.firstChild);
  
    const footer = document.createElement('footer');
    footer.innerHTML = `
      Matvey Boguslavskiy &copy; 2023
    `;
    document.body.appendChild(footer);
  });
  