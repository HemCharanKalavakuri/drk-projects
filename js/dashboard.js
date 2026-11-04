
import { supabase } from "../config/supabase.js";

console.log("DRK DASHBOARD JAVASCRIPT LOADED");

// ==========================================
// ELEMENTS
// ==========================================

const totalProjects = document.getElementById("totalProjects");
const publishedProjects = document.getElementById("publishedProjects");
const draftProjects = document.getElementById("draftProjects");
const newEnquiries = document.getElementById("newEnquiries");

const logoutButton = document.getElementById("logoutButton");

const projectForm = document.getElementById("projectForm");
const projectId = document.getElementById("projectId");
const projectName = document.getElementById("projectName");
const projectDescription = document.getElementById("projectDescription");
const projectCategory = document.getElementById("projectCategory");
const projectPrice = document.getElementById("projectPrice");
const projectTechnologies = document.getElementById("projectTechnologies");
const projectImage = document.getElementById("projectImage");
const projectDemo = document.getElementById("projectDemo");
const projectStatus = document.getElementById("projectStatus");

const saveProjectButton = document.getElementById("saveProjectButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formTitle = document.getElementById("formTitle");
const projectFormMessage = document.getElementById("projectFormMessage");

const projectsList = document.getElementById("projectsList");
const projectSearch = document.getElementById("projectSearch");
const projectFilter = document.getElementById("projectFilter");
const refreshProjectsButton = document.getElementById("refreshProjectsButton");

const imagePreview = document.getElementById("imagePreview");
const imagePreviewContainer = document.getElementById("imagePreviewContainer");

const STORAGE_BUCKET = "project-images";

let allProjects = [];
let currentImageURL = null;


// ==========================================
// GENERAL HELPERS
// ==========================================

function showError(message) {
    console.error("Dashboard error:", message);
}

function showFormMessage(message, color = "#70ACFF") {
    projectFormMessage.textContent = message;
    projectFormMessage.style.color = color;
}

function createSlug(value) {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return slug + "-" + Date.now();
}

function getStoragePath(imageURL) {
    if (!imageURL) return null;

    const marker = "/storage/v1/object/public/" + STORAGE_BUCKET + "/";

    const position = imageURL.indexOf(marker);

    if (position === -1) return null;

    return decodeURIComponent(
        imageURL.substring(position + marker.length)
    );
}


// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

async function checkAdmin() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            window.location.replace("login.html");
            return false;
        }

        const { data: isAdmin, error: adminError } =
            await supabase.rpc("is_admin");

        if (adminError || isAdmin !== true) {
            await supabase.auth.signOut();
            window.location.replace("login.html");
            return false;
        }

        return true;

    } catch (error) {
        showError(error.message);
        window.location.replace("login.html");
        return false;
    }
}


// ==========================================
// DASHBOARD STATISTICS
// ==========================================

async function loadStatistics() {
    try {
        const { count: total, error: totalError } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true });

        if (totalError) throw totalError;

        const { count: published, error: publishedError } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("status", "published");

        if (publishedError) throw publishedError;

        const { count: drafts, error: draftsError } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("status", "draft");

        if (draftsError) throw draftsError;

        const { count: enquiries, error: enquiriesError } = await supabase
            .from("enquiries")
            .select("*", { count: "exact", head: true })
            .eq("status", "new");

        if (enquiriesError) throw enquiriesError;

        totalProjects.textContent = total ?? 0;
        publishedProjects.textContent = published ?? 0;
        draftProjects.textContent = drafts ?? 0;
        newEnquiries.textContent = enquiries ?? 0;

    } catch (error) {
        showError(error.message);
    }
}


// ==========================================
// IMAGE PREVIEW
// ==========================================

projectImage.addEventListener("change", function () {
    const file = projectImage.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showFormMessage("Please select a JPG, PNG or WEBP image.", "#FF8585");
        projectImage.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showFormMessage("Image size must be less than 5 MB.", "#FF8585");
        projectImage.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        imagePreview.src = event.target.result;
        imagePreviewContainer.hidden = false;
    };

    reader.readAsDataURL(file);
});


// ==========================================
// UPLOAD IMAGE TO SUPABASE STORAGE
// ==========================================

async function uploadProjectImage(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    const filePath =
        "projects/" + Date.now() + "-" +
        Math.random().toString(36).substring(2, 10) +
        "." + extension;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
        });

    if (error) throw error;

    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}


// ==========================================
// DELETE IMAGE FROM STORAGE
// ==========================================

async function deleteProjectImage(imageURL) {
    const path = getStoragePath(imageURL);

    if (!path) return;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

    if (error) {
        console.error("Image deletion failed:", error.message);
    }
}


// ==========================================
// ADD OR UPDATE PROJECT
// ==========================================

projectForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const editing = projectId.value !== "";
    const selectedImage = projectImage.files[0];

    if (!editing && !selectedImage) {
        showFormMessage("Please select a project image.", "#FF8585");
        return;
    }

    if (selectedImage && selectedImage.size > 5 * 1024 * 1024) {
        showFormMessage("Image size must be less than 5 MB.", "#FF8585");
        return;
    }

    saveProjectButton.disabled = true;
    saveProjectButton.textContent = editing ? "Updating..." : "Saving...";

    let uploadedImageURL = null;

    try {
        let imageURL = currentImageURL;

        // Upload a new image if selected
        if (selectedImage) {
            uploadedImageURL = await uploadProjectImage(selectedImage);
            imageURL = uploadedImageURL;
        }

        const technologies = projectTechnologies.value
            .split(",")
            .map(item => item.trim())
            .filter(item => item !== "");

        const projectData = {
            name: projectName.value.trim(),
            slug: createSlug(projectName.value),
            description: projectDescription.value.trim(),
            category: projectCategory.value,
            technologies: technologies,
            price: Number(projectPrice.value),
            image_url: imageURL,
            demo_url: projectDemo.value.trim() || null,
            status: projectStatus.value,
            updated_at: new Date().toISOString()
        };

        if (editing) {
            const { error } = await supabase
                .from("projects")
                .update(projectData)
                .eq("id", projectId.value);

            if (error) throw error;

            // Remove the previous image after successful update
            if (selectedImage && currentImageURL) {
                await deleteProjectImage(currentImageURL);
            }

            showFormMessage("Project updated successfully!", "#6BDDA5");

        } else {
            const { error } = await supabase
                .from("projects")
                .insert([projectData]);

            if (error) throw error;

            showFormMessage("Project added successfully!", "#6BDDA5");
        }

        resetProjectForm();

        await loadProjects();
        await loadStatistics();

    } catch (error) {
        // Clean up a newly uploaded image if database save failed
        if (uploadedImageURL) {
            await deleteProjectImage(uploadedImageURL);
        }

        console.error("Project save error:", error);
        showFormMessage(error.message || "Unable to save project.", "#FF8585");

    } finally {
        saveProjectButton.disabled = false;
        saveProjectButton.textContent = "Save Project";
    }
});


// ==========================================
// RESET PROJECT FORM
// ==========================================

function resetProjectForm() {
    projectForm.reset();

    projectId.value = "";
    currentImageURL = null;

    imagePreview.src = "";
    imagePreviewContainer.hidden = true;

    formTitle.textContent = "Add New Project";
    saveProjectButton.textContent = "Save Project";

    cancelEditButton.hidden = true;

    projectImage.required = true;
}


// ==========================================
// EDIT PROJECT
// ==========================================

function editProject(project) {
    projectId.value = project.id;

    projectName.value = project.name || "";
    projectDescription.value = project.description || "";
    projectCategory.value = project.category || "";
    projectPrice.value = project.price ?? "";
    projectTechnologies.value =
        Array.isArray(project.technologies)
            ? project.technologies.join(", ")
            : "";

    projectDemo.value = project.demo_url || "";
    projectStatus.value = project.status || "draft";

    currentImageURL = project.image_url || null;

    if (currentImageURL) {
        imagePreview.src = currentImageURL;
        imagePreviewContainer.hidden = false;
    } else {
        imagePreviewContainer.hidden = true;
    }

    // Image is optional when editing
    projectImage.required = false;

    formTitle.textContent = "Edit Project";
    saveProjectButton.textContent = "Update Project";

    cancelEditButton.hidden = false;

    showFormMessage("Editing: " + project.name, "#70ACFF");

    document.getElementById("add-project-section").scrollIntoView({
        behavior: "smooth"
    });
}

cancelEditButton.addEventListener("click", function () {
    resetProjectForm();
    showFormMessage("Editing cancelled.");
});


// ==========================================
// DELETE PROJECT
// ==========================================

async function deleteProject(project) {
    const confirmed = window.confirm(
        'Are you sure you want to delete "' + project.name + '"?'
    );

    if (!confirmed) return;

    try {
        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", project.id);

        if (error) throw error;

        if (project.image_url) {
            await deleteProjectImage(project.image_url);
        }

        showFormMessage("Project deleted successfully!", "#6BDDA5");

        await loadProjects();
        await loadStatistics();

    } catch (error) {
        console.error("Project deletion error:", error);
        alert("Unable to delete project: " + error.message);
    }
}


// ==========================================
// CREATE PROJECT CARD
// ==========================================

function createProjectCard(project) {
    const card = document.createElement("article");
    card.className = "admin-project-card";

    const image = document.createElement("img");
    image.className = "admin-project-image";
    image.alt = project.name || "Project image";

    if (project.image_url) {
        image.src = project.image_url;
    } else {
        image.alt = "No project image";
    }

    const details = document.createElement("div");
    details.className = "admin-project-details";

    const name = document.createElement("h3");
    name.textContent = project.name;

    const category = document.createElement("p");
    category.textContent = "Category: " + project.category;

    const price = document.createElement("p");
    price.textContent = "Price: ₹" + Number(project.price).toLocaleString("en-IN");

    const technologies = document.createElement("p");
    technologies.textContent = "Technologies: " +
        (Array.isArray(project.technologies)
            ? project.technologies.join(", ")
            : "");

    const status = document.createElement("span");
    status.className = "project-status " + project.status;
    status.textContent = project.status.toUpperCase();

    const actions = document.createElement("div");
    actions.className = "project-card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", function () {
        editProject(project);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteProject(project);
    });

    actions.append(editButton, deleteButton);

    details.append(name, category, price, technologies, status, actions);
    card.append(image, details);

    return card;
}


// ==========================================
// DISPLAY PROJECTS
// ==========================================

function displayProjects(projects) {
    projectsList.replaceChildren();

    if (projects.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-panel";

        const heading = document.createElement("h3");
        heading.textContent = "No projects found";

        const paragraph = document.createElement("p");
        paragraph.textContent = "Add a project or change your search filter.";

        empty.append(heading, paragraph);
        projectsList.appendChild(empty);

        return;
    }

    projects.forEach(function (project) {
        projectsList.appendChild(createProjectCard(project));
    });
}


// ==========================================
// SEARCH AND FILTER
// ==========================================

function filterProjects() {
    const searchValue = projectSearch.value.toLowerCase().trim();
    const filterValue = projectFilter.value;

    const filteredProjects = allProjects.filter(function (project) {
        const matchesSearch =
            (project.name || "").toLowerCase().includes(searchValue) ||
            (project.description || "").toLowerCase().includes(searchValue) ||
            (project.category || "").toLowerCase().includes(searchValue);

        const matchesStatus =
            filterValue === "all" || project.status === filterValue;

        return matchesSearch && matchesStatus;
    });

    displayProjects(filteredProjects);
}

projectSearch.addEventListener("input", filterProjects);
projectFilter.addEventListener("change", filterProjects);


// ==========================================
// LOAD PROJECTS FROM SUPABASE
// ==========================================

async function loadProjects() {
    projectsList.textContent = "Loading projects...";

    try {
        const { data, error } = await supabase
            .from("projects")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        allProjects = data || [];

        filterProjects();

    } catch (error) {
        console.error("Loading projects failed:", error);

        projectsList.textContent =
            "Unable to load projects: " + error.message;
    }
}

refreshProjectsButton.addEventListener("click", async function () {
    await loadProjects();
    await loadStatistics();
});


// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {
    logoutButton.addEventListener("click", async function (event) {
        event.preventDefault();

        logoutButton.disabled = true;
        logoutButton.textContent = "Logging out...";

        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            window.location.replace("login.html");

        } catch (error) {
            console.error("Logout failed:", error);

            logoutButton.disabled = false;
            logoutButton.textContent = "↪ Logout";

            alert("Logout failed: " + error.message);
        }
    });
}


// ==========================================
// START DASHBOARD
// ==========================================

async function startDashboard() {
    const isAdmin = await checkAdmin();

    if (isAdmin) {
        await loadStatistics();
        await loadProjects();
    }
}

startDashboard();
