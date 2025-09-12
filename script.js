const API = "http://localhost:5000";

// ================= SIGNUP =================
async function signup() {
  const data = {
    name: document.getElementById("signup-name").value.trim(),
    email: document.getElementById("signup-email").value.trim(),
    password: document.getElementById("signup-pass").value,
    gpa: parseFloat(document.getElementById("signup-gpa").value),
    course: document.getElementById("signup-course").value.trim(),
  };

  if (!data.name || !data.email || !data.password || !data.gpa || !data.course) {
    alert("Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    alert(result.message);

    // Clear form fields
    ["signup-name", "signup-email", "signup-pass", "signup-gpa", "signup-course"]
      .forEach(id => document.getElementById(id).value = "");
  } catch (err) {
    alert("Error signing up: " + err);
  }
}

// ================= LOGIN =================
async function login() {
  const data = {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-pass").value,
  };

  if (!data.email || !data.password) {
    alert("Please fill both email and password!");
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (result.token) {
      localStorage.setItem("token", result.token);
      window.location = "dashboard.html";
    } else {
      alert(result.message);
    }
  } catch (err) {
    alert("Error logging in: " + err);
  }
}

// ================= LOAD SCHOLARSHIPS =================
async function loadScholarships() {
  try {
    const res = await fetch(`${API}/scholarships`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const list = await res.json();
    const container = document.getElementById("scholarship-list");

    if (container) {
      if (list.length === 0) {
        container.innerHTML = "<p>No scholarships available right now.</p>";
      } else {
        container.innerHTML = list.map(s => `
          <div class="form-container">
            <h3>${s.title}</h3>
            <p>${s.description}</p>
            <p>Deadline: ${s.deadline}</p>
            <form onsubmit="applyScholarship(event, ${s.id})">
              <input type="file" name="file" required />
              <button type="submit">Apply</button>
            </form>
          </div>
        `).join("");
      }
    }
  } catch (err) {
    console.error("Error loading scholarships:", err);
  }
}

// ================= APPLY SCHOLARSHIP =================
async function applyScholarship(event, id) {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const res = await fetch(`${API}/apply/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    const result = await res.json();
    alert(result.message);
  } catch (err) {
    alert("Error applying: " + err);
  }
}

// ================= ADD SCHOLARSHIP (ADMIN) =================
async function addScholarship() {
  const data = {
    title: document.getElementById("sch-title").value.trim(),
    description: document.getElementById("sch-desc").value.trim(),
    minGPA: parseFloat(document.getElementById("sch-gpa").value),
    course: document.getElementById("sch-course").value.trim(),
    deadline: document.getElementById("sch-deadline").value,
  };

  if (!data.title || !data.description || !data.minGPA || !data.course || !data.deadline) {
    alert("Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(`${API}/scholarships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    alert(result.message);

    // Clear form fields
    ["sch-title", "sch-desc", "sch-gpa", "sch-course", "sch-deadline"]
      .forEach(id => document.getElementById(id).value = "");

    // Refresh the applications list
    loadApplications();
  } catch (err) {
    alert("Error adding scholarship: " + err);
  }
}

// ================= LOAD APPLICATIONS (ADMIN) =================
async function loadApplications() {
  try {
    const res = await fetch(`${API}/applications`);
    const list = await res.json();
    const container = document.getElementById("app-list");

    if (container) {
      if (list.length === 0) {
        container.innerHTML = "<p>No applications yet.</p>";
      } else {
        container.innerHTML = list.map(a => `
          <div class="form-container">
            <p>Application ID: ${a.id}</p>
            <p>User ID: ${a.userId}</p>
            <p>Scholarship ID: ${a.scholarshipId}</p>
            <p>Status: ${a.status}</p>
            <p>File: <a href="/uploads/${a.file}" target="_blank">${a.file}</a></p>
          </div>
        `).join("");
      }
    }
  } catch (err) {
    console.error("Error loading applications:", err);
  }
}

// ================= AUTO-LOAD FOR PAGES =================
if (document.getElementById("scholarship-list")) loadScholarships();
if (document.getElementById("app-list")) loadApplications();
