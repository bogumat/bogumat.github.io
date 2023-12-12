document.addEventListener("DOMContentLoaded", function() {
    // Check if a header already exists
    if (!document.querySelector("header")) {
        var header = document.createElement("header");
        header.innerHTML = `
            <nav>
                <ul>
                    <li><a href="../index.html">Home</a></li>
                </ul>
            </nav>
        `;

        // Insert the header at the beginning of the body
        document.body.insertBefore(header, document.body.firstChild);
    }

    // Check if a footer already exists
    if (!document.querySelector("footer")) {
        var footer = document.createElement("footer");
        footer.innerHTML = `
            <p>&copy; ${new Date().getFullYear()} Matvey Boguslavskiy.</p>
        `;

        // Append the footer to the end of the body
        document.body.appendChild(footer);
    }
});
