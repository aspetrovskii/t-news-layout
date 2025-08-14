const signupButton = document.getElementById("signupButton");
const loginDialog = document.getElementById("login-dialog");

async function login(username, password){
    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка логина');
    return data;
}

async function handleLoginSubmit(e){
    e.preventDefault();

    const username = loginDialog.querySelector('input[placeholder="Логин"]').value;
    const password = loginDialog.querySelector('input[placeholder="Пароль"]').value;

    try{
        await login(username, password);
        window.open('../main/main-auth.html', '_self');
    } catch (err){
        const messageList = document.querySelector('ul[class="messages"]');
        
        const message = document.createElement("li");
        message.className = "message-box invisible";
        
        const messageText = document.createElement("div");
        messageText.textContent = err.message;
        messageText.className = "message";

        message.append(messageText);
        messageList.appendChild(message);

        message.className = "message-box visible";

        const TIME_TO_SEE = 2000;

        setTimeout(() => {message.className="message-box invisible"}, TIME_TO_SEE);

        setTimeout(() => {messageList.removeChild(message)}, TIME_TO_SEE+240);
    }
}

document.addEventListener("DOMContentLoaded", () =>{
    signupButton.addEventListener("click", () => {
        window.open("../signup/signup.html", "_self");
    });

    loginDialog.addEventListener('submit', handleLoginSubmit);
})