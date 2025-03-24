const { ipcRenderer } = require('electron');
/*
  ========================TODOLIST====================
  (x) Delete app function is supposed to be added
  ( ) GET Element is supposed to be added.
  ( ) Write a popup element for the form. 
  ( ) write a popup for showing the task. 
*/
document.getElementById("addBtn").addEventListener("click", ()=>{
  createForm();
  console.log("Form created successfully");
})
function createForm(){
  const popupoverlay = document.createElement("div");
  popupoverlay.classList.add("pop-up-overlay"); // Optional: Add a class for styling
  popupoverlay.innerHTML = `  <div class="pop-up-content">
      <input id="note-add-text" type="text" placeholder="Do the laundry...">
      <div class="add-task-tiles">
        <div class="add_task_tile_container">
          Due Date
          <input id="note-add-date" value="2025-05-05" type="date">
        </div>
       
        <div class="add_task_tile_container">
          Time
          <input id="note-add-time" value="15:00" type="time">
        </div>
      </div>
      <div class="form-cancel-div">
        <button class="cancelbtn"></button>
        <img src="img/star.png" id="addNoteButton" width="50px" height="50px">
      </div>
    </div>`;

  // Append the popupoverlay to the body
  document.body.appendChild(popupoverlay);


  setTimeout(() => {
    document.getElementById('addNoteButton').addEventListener('click', async () => {
      const note = {};
      note.text = document.getElementById("note-add-text").value;
      note.date = document.getElementById("note-add-date").value;
      note.time = document.getElementById("note-add-time").value;
      console.log(note);
      addTasks(note);
      popupoverlay.remove();
      listTasksToHomeBar();
    });
    const cancelbtn = document.querySelector('.cancelbtn').addEventListener('click',()=>{
      popupoverlay.remove();
    }) 

  }, 100);
}


getTasks()
async function getTasks(){
  const data = await ipcRenderer.invoke('list-tasks');
  console.log(data);
}
async function addTasks(note) {
  try {
    const task = {
      task: note.text,
      date: note.date,
      time: note.time
    }
     ipcRenderer.invoke('add-note',task);
     getTasks();
  } catch (error) {
    console.error('Failed to add note:', error);
    // Show an error message to the user
  }
}

async function databaseTest(){
  const note = {
    task: 'Complete project', // Non-empty string
    date: '2025-05-05',      // Valid date string
    time: '15:00',           // Valid time string
  };
  
  ipcRenderer.invoke('add-note', note);

  getTasks();
}


async function deleteTasks(taskid){
  ipcRenderer.invoke('delete-task',taskid)
  getTasks();
}
async function taskComplete(id){
  const payload = await ipcRenderer.invoke('complete-task',id)
  console.log("finished this god damn task");
  listTasksToHomeBar();
}
async function getTask(id) {
  try {
    const payload = await ipcRenderer.invoke('get-task', id);
    console.log(payload); // Parsed object
  } catch (error) {
    console.error('Failed to get task:', error);
  }
}

async function getNotFinishedTasks(){
  try{
    const payload = await ipcRenderer.invoke('list-tasks-notcomplete');
    console.log("This is the motherfucking not finished tasks",payload);
    return payload;
  }catch(err){
    console.log("fuck this god damn task manager.")
  }
}



listTasksToHomeBar()
async function listTasksToHomeBar(){
  const container = document.getElementById("home-tasks");
  container.innerHTML = ``;
  let payload = [];
  payload = await getNotFinishedTasks();
  for(let i=0;i<payload.length;i++){
    const row = document.createElement("tr");
    const column1 = document.createElement("td");
    column1.innerHTML = `<button onclick="taskComplete(${payload[i].id})" class="complete-button"></button>`;
    const column2 = document.createElement("td");
    column2.textContent = payload[i].task;
    const column3 = document.createElement("td");
    column3.textContent = payload[i].date;
    console.log(`Element ${i} added to the tasklist.`)
    row.appendChild(column1);
    row.appendChild(column2);
    row.appendChild(column3);
    container.appendChild(row);
  }
}


/*async function popupfortask(id){
  const payload = await getTask(1);
  const container = document.createElement("div");
  container.classList.add("pop-up-overlay");
  container.innerHTML = 
} */