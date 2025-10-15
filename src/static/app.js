document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing UI
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section
        let participantsHtml = '<div class="participants">';
        participantsHtml += '<h5>Participants</h5>';
        if (details.participants && details.participants.length > 0) {
          participantsHtml += "<ul>";
          details.participants.forEach((p) => {
            // Include a small delete button next to each participant
            participantsHtml += `<li><span class="participant-email">${p}</span><button class="delete-participant" data-activity="${encodeURIComponent(
              name
            )}" data-email="${encodeURIComponent(p)}" aria-label="Unregister ${p}">✖</button></li>`;
          });
          participantsHtml += "</ul>";
        } else {
          participantsHtml += '<div class="empty">No participants yet — be the first!</div>';
        }
        participantsHtml += "</div>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so participants list updates immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Delegate click handler for delete buttons
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-participant");
    if (!btn) return;

    const activityName = decodeURIComponent(btn.getAttribute("data-activity"));
    const email = decodeURIComponent(btn.getAttribute("data-email"));

    if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(
        email
      )}`, {
        method: "DELETE",
      });

      const result = await resp.json();
      if (resp.ok) {
        // Refresh activities list to reflect removal
        fetchActivities();
      } else {
        alert(result.detail || "Failed to unregister participant");
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      alert("Failed to unregister participant. See console for details.");
    }
  });
});
