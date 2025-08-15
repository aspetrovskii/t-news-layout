import { showMessage } from "../front.mjs";

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
        showMessage(document, err.message);
    }
}

document.addEventListener("DOMContentLoaded", () =>{
    signupButton.addEventListener("click", () => {
        window.open("../signup/signup.html", "_self");
    });

    loginDialog.addEventListener('submit', handleLoginSubmit);
})