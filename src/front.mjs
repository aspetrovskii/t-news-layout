export function showMessage (document, message, DISPLAY_DURATION = 2000, ANIMATION_DURATION = 240) {
        const messageList = document.querySelector('ul[class="messages"]');
        
        const messageBox = document.createElement("li");
        
        const messageText = document.createElement("div");
        messageText.textContent = message;
        messageText.className = "message";

        messageBox.append(messageText);
        messageList.appendChild(messageBox);

        messageBox.className = "message-box visible";

        setTimeout(() => {messageBox.className="message-box invisible"}, DISPLAY_DURATION);

        setTimeout(() => {messageList.removeChild(messageBox)}, DISPLAY_DURATION + ANIMATION_DURATION);
}