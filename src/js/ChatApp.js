export default class ChatApp {
  constructor(serverUrl = "ws://localhost:8080") {
    this.ws = new WebSocket(serverUrl);
    this.nickname = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById("continueButton").onclick = () =>
      this.registerUser();
    document.getElementById("messageInput").onkeypress = (e) =>
      this.handleMessageInput(e);
  }

  registerUser() {
    this.nickname = document.getElementById("nicknameInput").value;
    this.ws.send(JSON.stringify({ type: "register", nickname: this.nickname }));
  }

  handleMessageInput(e) {
    if (e.key === "Enter") {
      const message = e.target.value;
      this.ws.send(
        JSON.stringify({
          type: "message",
          nickname: this.nickname,
          message: message,
        }),
      );
      e.target.value = "";
    }
  }

  updateUserList(users) {
    const userList = document.getElementById("userList");
    userList.innerHTML = users
      .map(
        (user) => `
          <div class="user-item">
              <div class="avatar"></div>
              <div class="user-name ${user === this.nickname ? "you" : ""}">${user === this.nickname ? "You" : user}</div>
          </div>
      `,
      )
      .join("");
  }

  appendMessage(data) {
    const messagesContainer = document.getElementById("messagesContainer");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    if (data.nickname === this.nickname) {
      messageElement.classList.add("you");
      messageElement.innerHTML = `
              <div class="meta">You, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${new Date().toLocaleDateString()}</div>
              <div>${data.message}</div>
          `;
    } else {
      messageElement.classList.add("other");
      messageElement.innerHTML = `
              <div class="meta">${data.nickname}, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${new Date().toLocaleDateString()}</div>
              <div>${data.message}</div>
          `;
    }

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  setupCustomScrollbar() {
    const chatBox = document.getElementById("messagesContainer");
    const scrollUp = document.getElementById("scrollUp");
    const scrollDown = document.getElementById("scrollDown");
    const scrollThumb = document.getElementById("customScrollThumb");
    const scrollBar = document.getElementById("customScrollBar");

    let isDragging = false;
    let startY, startScrollTop;

    const updateScrollThumb = () => {
      const chatBoxHeight = chatBox.scrollHeight;
      const chatBoxVisibleHeight = chatBox.clientHeight;
      const scrollBarHeight = scrollBar.clientHeight - 40;
      const thumbHeight = Math.max(
        (chatBoxVisibleHeight / chatBoxHeight) * scrollBarHeight,
        20,
      );
      const thumbTop =
        (chatBox.scrollTop / (chatBoxHeight - chatBoxVisibleHeight)) *
        (scrollBarHeight - thumbHeight);
      scrollThumb.style.height = `${thumbHeight}px`;
      scrollThumb.style.transform = `translateY(${thumbTop}px)`;
    };

    scrollUp.addEventListener("click", () => {
      chatBox.scrollBy({ top: -50, behavior: "smooth" });
    });

    scrollDown.addEventListener("click", () => {
      chatBox.scrollBy({ top: 50, behavior: "smooth" });
    });

    chatBox.addEventListener("scroll", updateScrollThumb);
    window.addEventListener("resize", updateScrollThumb);
    updateScrollThumb();

    scrollThumb.addEventListener("mousedown", (e) => {
      isDragging = true;
      startY = e.clientY;
      startScrollTop = chatBox.scrollTop;
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const chatBoxHeight = chatBox.scrollHeight;
      const chatBoxVisibleHeight = chatBox.clientHeight;
      const scrollBarHeight = scrollBar.clientHeight - 40;
      const thumbHeight = scrollThumb.clientHeight;
      const maxScroll = chatBoxHeight - chatBoxVisibleHeight;
      const scrollPercent = deltaY / (scrollBarHeight - thumbHeight);
      chatBox.scrollTop = startScrollTop + scrollPercent * maxScroll;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      document.body.style.userSelect = "";
    });
  }

  start() {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "registered":
          document.getElementById("nicknameModal").style.display = "none";
          document.getElementById("chatContainer").style.display = "flex";
          document.getElementById("errorMessage").style.display = "none";
          this.setupCustomScrollbar();
          break;
        case "error":
          document.getElementById("errorMessage").textContent = data.message;
          document.getElementById("errorMessage").style.display = "block";
          break;
        case "users":
          this.updateUserList(data.users);
          break;
        case "message":
          this.appendMessage(data);
          break;
      }
    };
  }
}
