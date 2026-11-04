
import { supabase } from "../config/supabase.js";


// ==========================================
// DRK PROJECTS - ADMIN AUTHENTICATION
// ==========================================

const loginForm = document.getElementById("loginForm");

const loginButton = document.getElementById("loginButton");

const loginMessage = document.getElementById("loginMessage");


// Display messages

function showMessage(message, color = "#FF8585") {

    loginMessage.textContent = message;

    loginMessage.style.color = color;

}


// ==========================================
// CHECK EXISTING SESSION
// ==========================================

async function checkExistingSession() {

    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
        return;
    }

    const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin");

    if (!adminError && isAdmin === true) {

        window.location.href = "dashboard.html";

    }

}

checkExistingSession();


// ==========================================
// ADMIN LOGIN
// ==========================================

loginForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    loginButton.disabled = true;

    loginButton.textContent = "Signing In...";

    showMessage("Checking your login details...", "#70ACFF");


    try {

        // STEP 1: Authenticate with Supabase

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) {
            throw error;
        }


        // STEP 2: Verify admin permission

        const { data: isAdmin, error: adminError } =
            await supabase.rpc("is_admin");


        if (adminError) {

            await supabase.auth.signOut();

            throw adminError;

        }


        // STEP 3: Allow only authorized admins

        if (isAdmin !== true) {

            await supabase.auth.signOut();

            showMessage(
                "Access denied. This account is not an administrator."
            );

            return;

        }


        // STEP 4: Redirect to dashboard

        showMessage(
            "Login successful! Opening dashboard...",
            "#6BDDA5"
        );

        window.location.href = "dashboard.html";


    } catch (error) {

        console.error("Admin login error:", error);

        showMessage(
            error.message || "Login failed. Please try again."
        );

    } finally {

        loginButton.disabled = false;

        loginButton.textContent = "Sign In to Dashboard →";

    }

});
