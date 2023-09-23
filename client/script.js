
// WebSocket-Verbindung herstellen
const isLocalhost = location.host.includes("localhost");
const websocketProtocol = isLocalhost ? "ws" : "wss";
const websocketUrl = `${websocketProtocol}://${location.host}`;
const socket = new WebSocket(websocketUrl);

// Benutzer-ID generieren
function generateUserId() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}
const userId = generateUserId();

// Zufälligen Benutzer abrufen
async function fetchRandomUser() {
  const response = await fetch("https://randomuser.me/api/");
  const data = await response.json();
  return data.results[0];
}

// WebSocket-Ereignisse
socket.addEventListener("open", async () => {
  console.log("WebSocket connected!");
  const user = await fetchRandomUser();
  const usernameInput = document.getElementById("username");
  usernameInput.value = user.name.first;

  const message = {
    type: "user",
    user: {
      id: userId,
      name: usernameInput.value,
    },
  };
  socket.send(JSON.stringify(message));
});

socket.addEventListener("message", (event) => {
  const messageObject = JSON.parse(event.data);
  console.log("Received message from server: " + messageObject.type);
  switch (messageObject.type) {
    case "users":
      showUsers(messageObject.users);
      break;
    case "message":
      showMessage(messageObject.message);
      break;
    default:
      console.error("Unknown message type: " + messageObject.type);
  }
});

socket.addEventListener("close", () => {
  console.log("WebSocket closed.");
});

socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

// Funktion zum Anzeigen von Benutzern
function showUsers(users) {
  const usersElement = document.getElementById("users");
  usersElement.innerHTML = "";
  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.innerHTML = "🟢 " + user.name;
    usersElement.appendChild(userElement);
  });
}

// Funktion zum Anzeigen von Nachrichten
function showMessage(message) {
  const messagesElement = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");

  if (message.user.id === userId) {
    messageElement.classList.add("message-sent");
  }

  const headerElement = document.createElement("div");
  headerElement.classList.add("message-header");
  headerElement.innerHTML = `<span class="username">${message.user.name}</span> at <span class="time">${message.time}</span>`;
  const messageTextElement = document.createElement("p");
  messageTextElement.classList.add("message-text");
  messageTextElement.textContent = message.message;

  messageElement.appendChild(headerElement);
  messageElement.appendChild(messageTextElement);
  messagesElement.appendChild(messageElement);
  messagesElement.scrollTop = messagesElement.scrollHeight;
}

// Benutzername ändern
function changeUsername() {
  const newUsername = document.getElementById("username").value;
  if (newUsername === "") return;
  const message = {
    type: "user",
    user: {
      id: userId,
      name: newUsername,
    },
  };
  socket.send(JSON.stringify(message));
}

// Nachricht senden
function sendMessage() {
  const messageText = document.getElementById("message").value;
  if (messageText === "") return;
  const message = {
    type: "message",
    message: {
      user: {
        id: userId,
        name: document.getElementById("username").value,
      },
      message: messageText,
      time: new Date().toLocaleTimeString(),
    },
  };
  socket.send(JSON.stringify(message));
  document.getElementById("message").value = "";
}

