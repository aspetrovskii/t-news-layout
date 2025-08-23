import { showMessage } from "../front.mjs";

// const postUserButtons = document.getElementsByClassName('post-user-button');

// function fetchWithAuth(url, options = {}) {
//   const token = localStorage.getItem('access_token');
//   const headers = options.headers ? new Headers(options.headers) : new Headers();
//   if (token) headers.set('Authorization', `Bearer ${token}`);
//   return fetch(url, { ...options, headers });
// }

// async function handleUserOpen(e) {
//     e.preventDefault();

    
// }

// document.addEventListener("DOMContentLoaded", () =>{
//     postUserButtons.forEach((el, index) => {
//         el.addEventListener('click', handleUserOpen);
//     })
// })







// const loginButton = document.getElementById("login-button");
// const signupDialog = document.getElementById("signup-dialog");

// async function signup(username, password, rePassword){
//     const res = await fetch('http://localhost:3000/api/signup', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ username, password, rePassword })
//     });

//     const data = await res.json();
//     if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
//     return data;
// }

// async function handleSignupSubmit(e){
//     e.preventDefault();

//     const username = signupDialog.querySelector('input[placeholder="Логин"]').value;
//     const password = signupDialog.querySelector('input[placeholder="Пароль"]').value;
//     const rePassword = signupDialog.querySelector('input[placeholder="Повторите пароль"]').value;

//     try{
//         await signup(username, password, rePassword);
//         window.open('../main/main-auth.html', '_self');
//     } catch (err){
//         showMessage(document, err.message);
//     }
// }

// // document.addEventListener("DOMContentLoaded", () =>{
    
// // })