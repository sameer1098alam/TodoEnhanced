let draggedItem = null;

document.addEventListener("DOMContentLoaded", () => {
  const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  storedTasks.forEach(task => renderTask(task));
  checkDueToday();
  renderCalendar();
  // Set mode from localStorage
  const mode = localStorage.getItem("mode");
  if (mode === "dark") {
    document.body.classList.add("dark");
    document.getElementById("modeToggle").checked = true;
  }
});

// Add task
function addTask() {
  const input = document.getElementById("taskInput");
  const dueDate = document.getElementById("dueDate").value;
  const priority = document.getElementById("priority").value;
  const category = document.getElementById("categoryInput").value;

  if (input.value.trim() === "") return;

  const task = {
    text: input.value.trim(),
    dueDate: dueDate,
    priority: priority,
    category: category,
    completed: false
  };

  renderTask(task);
  updateLocalStorageFromDOM();

  input.value = "";
  document.getElementById("dueDate").value = "";
  document.getElementById("priority").value = "Medium";
  document.getElementById("categoryInput").value = "";
}

// Render task
function renderTask(task) {
  const li = document.createElement("li");
  li.draggable = true;

  li.addEventListener("dragstart", () => {
    draggedItem = li;
    li.classList.add("dragging");
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("dragging");
    updateLocalStorageFromDOM();
  });

  li.addEventListener("dragover", e => e.preventDefault());
  li.addEventListener("drop", () => {
    const list = document.getElementById("taskList");
    list.insertBefore(draggedItem, li);
  });

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed || false;
  checkbox.addEventListener("change", () => {
    span.classList.toggle("completed", checkbox.checked);
    updateLocalStorageFromDOM();
  });

  const span = document.createElement("div");
  span.className = "task-info";
  if (task.completed) span.classList.add("completed");

  span.innerHTML = `<strong>${task.text}</strong><br>
    Due: ${task.dueDate || "No due date"} | Priority: <em>${task.priority}</em> | Category: ${task.category || "No category"}`;

  const actionDiv = document.createElement("div");
  actionDiv.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "edit";
  editBtn.onclick = function () {
    const newText = prompt("Edit Task", task.text);
    if (newText !== null && newText.trim() !== "") {
      span.innerHTML = `<strong>${newText}</strong><br>
        Due: ${task.dueDate || "No due date"} | Priority: <em>${task.priority}</em> | Category: ${task.category || "No category"}`;
      task.text = newText;
      updateLocalStorageFromDOM();
    }
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete";
  deleteBtn.onclick = function () {
    li.remove();
    updateLocalStorageFromDOM();
  };

  actionDiv.appendChild(editBtn);
  actionDiv.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(actionDiv);

  document.getElementById("taskList").appendChild(li);
}

// Update localStorage from the DOM
function updateLocalStorageFromDOM() {
  const taskItems = document.querySelectorAll("#taskList li");
  const tasks = [];

  taskItems.forEach(li => {
    const text = li.querySelector(".task-info strong").textContent;
    const info = li.querySelector(".task-info").textContent;
    const dueMatch = info.match(/Due: (.*?) \|/);
    const priorityMatch = info.match(/Priority: (.*?) \|/);
    const categoryMatch = info.match(/Category: (.*?)$/);
    const dueDate = dueMatch ? dueMatch[1].trim() : "";
    const priority = priorityMatch ? priorityMatch[1].trim() : "Medium";
    const category = categoryMatch ? categoryMatch[1].trim() : "";
    const completed = li.querySelector("input[type='checkbox']").checked;

    tasks.push({ text, dueDate, priority, category, completed });
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Sort tasks by due date
function sortTasksByDueDate() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  tasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));

  document.getElementById("taskList").innerHTML = "";
  tasks.forEach(task => renderTask(task));
}

// Search tasks
function searchTasks() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const listItems = document.querySelectorAll("#taskList li");

  listItems.forEach(li => {
    const taskText = li.querySelector("strong").textContent.toLowerCase();
    li.style.display = taskText.includes(query) ? "" : "none";
  });
}

// Export tasks (JSON or CSV)
function exportTasks(format) {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let content = "";

  if (format === "json") {
    content = JSON.stringify(tasks, null, 2);
    downloadFile(content, "tasks.json", "application/json");
  } else if (format === "csv") {
    content = "Task,Due Date,Priority,Completed,Category\n";
    tasks.forEach(t => {
      content += `"${t.text}","${t.dueDate}","${t.priority}",${t.completed},"${t.category}"\n`;
    });
    downloadFile(content, "tasks.csv", "text/csv");
  }
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Check if any task is due today
function checkDueToday() {
  const today = new Date().toISOString().split("T")[0];
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  const dueToday = tasks.filter(t => t.dueDate === today && !t.completed);
  if (dueToday.length > 0) {
    alert(`⏰ You have ${dueToday.length} task(s) due today!`);
  }
}

// Calendar view
function renderCalendar() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const calendarTasks = {};

  tasks.forEach(task => {
    if (task.dueDate) {
      const dueDate = task.dueDate;
      if (!calendarTasks[dueDate]) {
        calendarTasks[dueDate] = [];
      }
      calendarTasks[dueDate].push(task);
    }
  });

  const calendarDiv = document.getElementById("calendarTasks");
  calendarDiv.innerHTML = "";

  Object.keys(calendarTasks).forEach(date => {
    const taskListForDate = calendarTasks[date];
    const dateDiv = document.createElement("div");
    dateDiv.classList.add("calendar-date");
    dateDiv.innerHTML = `<strong>${date}</strong>`;

    taskListForDate.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.classList.add("calendar-task");
      taskDiv.innerHTML = `${task.text} - Priority: ${task.priority}`;
      dateDiv.appendChild(taskDiv);
    });

    calendarDiv.appendChild(dateDiv);
  });
}

// Toggle Dark/Light Mode
function toggleMode() {
  const body = document.body;
  body.classList.toggle("dark");
  localStorage.setItem("mode", body.classList.contains("dark") ? "dark" : "light");
}
