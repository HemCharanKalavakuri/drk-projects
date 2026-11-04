
// ==========================================
// DRK PROJECTS - WHATSAPP ENQUIRY FORM
// ==========================================

// Official DRK Projects WhatsApp number
// India country code +91, without + or spaces.

const BUSINESS_WHATSAPP = "918374270916";


// ==========================================
// HTML ELEMENTS
// ==========================================

const contactForm = document.getElementById("contactForm");

const formStatus = document.getElementById("formStatus");


// ==========================================
// FORM SUBMISSION
// ==========================================

if (contactForm && formStatus) {

    contactForm.addEventListener("submit", function(event) {

        event.preventDefault();


        // Get customer details

        const customerName =
            document.getElementById("customerName").value.trim();

        const subject =
            document.getElementById("subject").value;

        const message =
            document.getElementById("message").value.trim();


        // Validate fields

        if (
            customerName === "" ||
            subject === "" ||
            message === ""
        ) {

            formStatus.style.color = "#FF8585";

            formStatus.textContent =
                "Please complete all the fields.";

            return;

        }


        // Validate WhatsApp number

        if (!/^\d{10,15}$/.test(BUSINESS_WHATSAPP)) {

            formStatus.style.color = "#FF8585";

            formStatus.textContent =
                "WhatsApp number is not configured correctly.";

            return;

        }


        // Create WhatsApp message

        const whatsappMessage =

            "Hello DRK Projects!\n\n" +

            "I would like to make an enquiry.\n\n" +

            "Name: " + customerName + "\n" +

            "Enquiry Type: " + subject + "\n\n" +

            "Message: " + message + "\n\n" +

            "Thank you.";


        // Encode message

        const encodedMessage =
            encodeURIComponent(whatsappMessage);


        // Create WhatsApp URL

        const whatsappURL =
            "https://wa.me/" +
            BUSINESS_WHATSAPP +
            "?text=" +
            encodedMessage;


        // Open WhatsApp

        const whatsappWindow = window.open(
            whatsappURL,
            "_blank",
            "noopener,noreferrer"
        );


        // Display result

        if (whatsappWindow) {

            formStatus.style.color = "#6BDDA5";

            formStatus.textContent =
                "WhatsApp opened. Please send your enquiry there.";

        } else {

            formStatus.style.color = "#FF8585";

            formStatus.textContent =
                "WhatsApp could not open. Please allow pop-ups or use the WhatsApp contact link.";

        }

    });

}


console.log("DRK Projects WhatsApp contact form loaded successfully.");
