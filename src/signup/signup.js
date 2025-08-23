import { showMessage } from "../front.mjs";

const loginButton = document.getElementById("login-button");
const signupDialog = document.getElementById("signup-dialog");

async function signup(username, password, rePassword){
    const res = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rePassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
    const token = data.token;
    if(!token) throw new Error('Сервер не вернул токен досутпа');
    localStorage.setItem('access_token', token);
    return token;
}

async function handleSignupSubmit(e){
    e.preventDefault();

    const username = signupDialog.querySelector('input[placeholder="Логин"]').value;
    const password = signupDialog.querySelector('input[placeholder="Пароль"]').value;
    const rePassword = signupDialog.querySelector('input[placeholder="Повторите пароль"]').value;

    try{
        await signup(username, password, rePassword);
        window.open('../main/main-auth.html', '_self');
    } catch (err){
        showMessage(document, err.message);
    }
}

document.addEventListener("DOMContentLoaded", () =>{
    loginButton.addEventListener("click", () => {
        window.open("../login/index.html", "_self");
    });

    signupDialog.addEventListener('submit', handleSignupSubmit);
})