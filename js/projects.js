
import { supabase } from "../config/supabase.js";


// ==========================================
// CONFIGURATION
// ==========================================

// Replace this with your actual WhatsApp number.
// Include country code, without + or spaces.
const BUSINESS_WHATSAPP = "918374270916";


// ==========================================
// HTML ELEMENTS
// ==========================================

const projectsGrid = document.getElementById("projectsGrid");

const projectsLoading = document.getElementById("projectsLoading");

const projectsError = document.getElementById("projectsError");

const projectsErrorMessage = document.getElementById("projectsErrorMessage");

const noProjects = document.getElementById("noProjects");

const searchInput = document.getElementById("projectSearch");

const filterButtons = document.querySelectorAll(".filter-btn");


// ==========================================
// VARIABLES
// ==========================================

let allProjects = [];

let selectedCategory = "all";


// ==========================================
// CATEGORY FORMAT
// ==========================================

function getCategoryLabel(category) {

    const categories = {
        ai: "ARTIFICIAL INTELLIGENCE",
        ml: "MACHINE LEARNING",
        dl: "DEEP LEARNING",
        nlp: "NATURAL LANGUAGE PROCESSING"
    };

    return categories[String(category).toLowerCase()] || category;

}


// ==========================================
// PRICE FORMAT
// ==========================================

function formatPrice(price) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);

}


// ==========================================
// CREATE TECHNOLOGY TAGS
// ==========================================

function createTechnologyTags(technologies) {

    const container = document.createElement("div");

    container.className = "technology-list";

    if (Array.isArray(technologies)) {

        technologies.forEach(function(technology) {

            const tag = document.createElement("span");

            tag.textContent = technology;

            container.appendChild(tag);

        });

    }

    return container;

}


// ==========================================
// CREATE PROJECT IMAGE
// ==========================================

function createProjectImage(project) {

    const imageContainer = document.createElement("div");

    imageContainer.className = "project-image";

    const categoryLabel = document.createElement("span");

    categoryLabel.className = "project-category";

    categoryLabel.textContent = getCategoryLabel(project.category);

    imageContainer.appendChild(categoryLabel);


    if (project.image_url) {

        const image = document.createElement("img");

        image.src = project.image_url;

        image.alt = project.name;

        image.loading = "lazy";

        image.style.width = "100%";

        image.style.height = "100%";

        image.style.objectFit = "cover";

        image.onerror = function() {
            imageContainer.classList.add("project-image-fallback");
            image.remove();
        };

        imageContainer.appendChild(image);

    } else {

        imageContainer.classList.add("project-image-fallback");

    }

    return imageContainer;

}


// ==========================================
// CREATE WHATSAPP ENQUIRY LINK
// ==========================================

function createEnquiryLink(project) {

    const link = document.createElement("a");

    link.className = "project-button";

    link.textContent = "Enquire →";

    link.target = "_blank";

    link.rel = "noopener noreferrer";


    const message =
        "Hello DRK Projects!\n\n" +
        "I am interested in the following project:\n\n" +
        "Project: " + project.name + "\n" +
        "Price: " + formatPrice(project.price) + "\n\n" +
        "Please share more details about this project.";

    link.href =
        "https://wa.me/" +
        BUSINESS_WHATSAPP +
        "?text=" +
        encodeURIComponent(message);

    return link;

}


// ==========================================
// CREATE DEMO VIDEO LINK
// ==========================================

function createDemoLink(demoUrl) {

    if (!demoUrl) {
        return null;
    }

    try {

        const url = new URL(demoUrl);

        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }

        const link = document.createElement("a");

        link.href = url.href;

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        link.className = "project-demo-link";

        link.textContent = "Watch Demo ↗";

        return link;

    } catch (error) {

        return null;

    }

}


// ==========================================
// CREATE PROJECT CARD
// ==========================================

function createProjectCard(project, index) {

    const card = document.createElement("article");

    card.className = "project-card";

    card.dataset.category = String(project.category).toLowerCase();


    // PROJECT IMAGE

    card.appendChild(createProjectImage(project));


    // PROJECT INFORMATION

    const info = document.createElement("div");

    info.className = "project-info";


    // META INFORMATION

    const meta = document.createElement("div");

    meta.className = "project-meta";


    const number = document.createElement("span");

    number.textContent =
        String(index + 1).padStart(2, "0") +
        " / " +
        String(project.category).toUpperCase() +
        " SOLUTION";


    const availability = document.createElement("span");

    availability.className = "availability";

    availability.textContent = "Available";


    meta.appendChild(number);

    meta.appendChild(availability);


    // PROJECT NAME

    const title = document.createElement("h2");

    title.textContent = project.name;


    // DESCRIPTION

    const description = document.createElement("p");

    description.textContent = project.description;


    // TECHNOLOGIES

    const technologies = createTechnologyTags(project.technologies);


    // PROJECT FOOTER

    const footer = document.createElement("div");

    footer.className = "project-footer";


    const priceContainer = document.createElement("div");


    const priceLabel = document.createElement("small");

    priceLabel.textContent = "PROJECT PRICE";


    const price = document.createElement("h3");

    price.textContent = formatPrice(project.price);


    priceContainer.appendChild(priceLabel);

    priceContainer.appendChild(price);


    footer.appendChild(priceContainer);

    footer.appendChild(createEnquiryLink(project));


    // APPEND ELEMENTS

    info.appendChild(meta);

    info.appendChild(title);

    info.appendChild(description);

    info.appendChild(technologies);

    footer.appendChild(document.createElement("span"));

    info.appendChild(footer);


    // OPTIONAL DEMO LINK

    const demoLink = createDemoLink(project.demo_url);

    if (demoLink) {

        info.appendChild(demoLink);

    }


    card.appendChild(info);

    return card;

}


// ==========================================
// DISPLAY PROJECTS
// ==========================================

function displayProjects(projects) {

    projectsGrid.innerHTML = "";

    projects.forEach(function(project, index) {

        const card = createProjectCard(project, index);

        projectsGrid.appendChild(card);

    });

}


// ==========================================
// FILTER AND SEARCH
// ==========================================

function filterProjects() {

    const searchText = searchInput.value.toLowerCase().trim();


    const filteredProjects = allProjects.filter(function(project) {

        const category = String(project.category).toLowerCase();

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;


        const technologyText = Array.isArray(project.technologies)
            ? project.technologies.join(" ")
            : "";


        const searchableText = [
            project.name,
            project.description,
            category,
            technologyText
        ].join(" ").toLowerCase();


        const matchesSearch =
            searchableText.includes(searchText);


        return matchesCategory && matchesSearch;

    });


    displayProjects(filteredProjects);


    projectsGrid.hidden = false;

    noProjects.hidden = filteredProjects.length !== 0;

}


// ==========================================
// FILTER BUTTONS
// ==========================================

filterButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        filterButtons.forEach(function(btn) {

            btn.classList.remove("active");

        });


        button.classList.add("active");


        selectedCategory = button.dataset.filter;


        filterProjects();

    });

});


// ==========================================
// SEARCH INPUT
// ==========================================

searchInput.addEventListener("input", function() {

    filterProjects();

});


// ==========================================
// FETCH PUBLISHED PROJECTS
// ==========================================

async function loadProjects() {

    projectsLoading.hidden = false;

    projectsError.hidden = true;

    projectsGrid.hidden = true;

    noProjects.hidden = true;


    try {

        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("status", "published")
            .order("created_at", { ascending: false });


        if (error) {

            throw error;

        }


        allProjects = data || [];


        projectsLoading.hidden = true;


        if (allProjects.length === 0) {

            projectsGrid.hidden = true;

            noProjects.hidden = false;

            noProjects.querySelector("h3").textContent =
                "No Published Projects Yet";

            noProjects.querySelector("p").textContent =
                "Our projects will appear here soon. Please check back later.";

            return;

        }


        // Reset category and search

        selectedCategory = "all";

        searchInput.value = "";


        filterButtons.forEach(function(button) {

            button.classList.toggle(
                "active",
                button.dataset.filter === "all"
            );

        });


        filterProjects();


        console.log("Projects loaded successfully:", allProjects.length);

    } catch (error) {

        console.error("Error loading projects:", error);

        projectsLoading.hidden = true;

        projectsGrid.hidden = true;

        noProjects.hidden = true;

        projectsError.hidden = false;

        projectsErrorMessage.textContent =
            error.message || "Unable to connect to the database.";

    }

}


// ==========================================
// INITIALIZE CUSTOMER PROJECTS PAGE
// ==========================================

loadProjects();

console.log("DRK Projects customer page initialized.");
