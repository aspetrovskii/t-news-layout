import { showMessage } from "./front.mjs";

// ===== КОНСТАНТЫ И ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====

let currentUser = null;
let authToken = localStorage.getItem('auth_token');

const API_BASE = 'http://localhost:3000/api';

// ===== ФУНКЦИИ ИНИЦИАЛИЗАЦИИ СТРАНИЦЫ =====

async function checkAuth() {
    const savedUser = localStorage.getItem('current_user');
    if(savedUser && authToken) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

async function loadAndRenderHeader(){
    const currentURL = window.location.pathname;
    const leftHeader = document.querySelector('div[class="heading-left"]');
    const rightHeader = document.querySelector('div[class="heading-right"]');

    const logo = document.createElement('img');
    logo.className="heading-left-logo";
    logo.src="/public/tbank-logo.svg";
    logo.alt="TBank logo";
    logo.addEventListener('click', () => {
        window.open('/main', '_self');
    })

    const searchField = document.createElement('input');
    searchField.type="text";
    searchField.classList.add("heading-left");
    searchField.classList.add("field");
    searchField.placeholder="Поиск по T-News";
    searchField.addEventListener('keypress', (e) =>{
        if(e.key === 'Enter'){
            const query = e.target.value.trim();
            if (query) {
                window.open(`/search?q=${encodeURIComponent(query)}`);
            }
        }
    });

    const signupButtonHeader = document.createElement('button');
    signupButtonHeader.className="signup";
    signupButtonHeader.innerHTML=`
        <p class="text">Зарегистрироваться</p>
        <img class="heading-button-pic" src="/public/login-button.svg" alt="Зарегистрироваться">
    `;
    signupButtonHeader.addEventListener('click', ()=>{
        window.open('/signup', '_self');
    });

    const loginButtonHeader = document.createElement('button');
    loginButtonHeader.className="signup";
    loginButtonHeader.innerHTML=`
        <p class="text">Войти</p>
        <img class="heading-button-pic" src="/public/login-button.svg" alt="Войти">
    `;
    loginButtonHeader.addEventListener('click', ()=>{
        window.open('/login', '_self');
    });

    const logoutButtonHeader = document.createElement('button');
    logoutButtonHeader.className="signup";
    logoutButtonHeader.id='logout';
    logoutButtonHeader.innerHTML=`
        <p class="text">Выйти</p>
        <img class="heading-button-pic" src="/public/login-button.svg" alt="Выйти">
    `;
    logoutButtonHeader.addEventListener('click', ()=>{
        currentUser = null;
        localStorage.removeItem('current_user');
        localStorage.removeItem('auth_token');
        location.reload();
    });

    const profileButtonHeader = document.createElement('button');
    profileButtonHeader.className="signup";
    profileButtonHeader.innerHTML=`
        <img class="profile-button-pic" src="/public/profile-pic.svg" alt="Профиль">
    `;
    profileButtonHeader.addEventListener('click', () =>{
        window.open('/profile', '_self');
    });

    leftHeader.appendChild(logo);
    if(currentURL !== '/login' && currentURL!=='/signup'){
        leftHeader.appendChild(searchField);
        const isAuth = await checkAuth();
        if(isAuth){
            rightHeader.appendChild(logoutButtonHeader);
            rightHeader.appendChild(profileButtonHeader);
        } else {
            rightHeader.appendChild(signupButtonHeader);
            rightHeader.appendChild(loginButtonHeader);
        }
        if(currentURL === '/search'){
            const params = new URLSearchParams(window.location.search);
            const q = params.get('q') ?? '';
            const pageTitle = document.querySelector('title');
            pageTitle.textContent = `${q} — T-News`;
        }
    }
}

async function setupFormHandlers() {
    const loginDialog = document.getElementById("login-dialog");
    if(loginDialog) loginDialog.addEventListener('submit', handleLoginSubmit);

    const signupDialog = document.getElementById("signup-dialog");
    if(signupDialog) signupDialog.addEventListener('submit', handleSignupSubmit);

    const newPostForm = document.getElementById('post-form');
    if(newPostForm) newPostForm.addEventListener('submit', handleNewPostSubmit);

    const newCommentForm = document.getElementById('comment-form');
    if(newCommentForm) newCommentForm.addEventListener('submit', handleNewCommentSubmit);

    const editNameButton = document.getElementById('edit-name');
    if(editNameButton) editNameButton.addEventListener('click', handleEditNameClick);

    const editInfoButton = document.getElementById('edit-info');
    if(editInfoButton) editInfoButton.addEventListener('click', handleEditInfoClick);
}

async function setupActionHandlers(){

}

async function loadPageContent() {

}

// ===== ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ =====

document.addEventListener("DOMContentLoaded", () => {
    try {
        initApp();
    } catch (e) {
        showMessage(document, 'Ошибка инициализации приложения');
    }
})

async function initApp() {
    const currentURL = window.location.pathname;
    if(currentURL === '/') window.location.href = '/main';

    const isAuth = await checkAuth();
    if(isAuth && (currentURL === '/login' || currentURL==='/signup')) window.location.href = '/main';
    
    await loadAndRenderHeader();
    await setupFormHandlers();
    await setupActionHandlers();
    await loadPageContent();
}

// ===== ХЭНДЛЫ ОТПРАВКИ ФОРМ =====

async function handleLoginSubmit(e){
    e.preventDefault();
    const loginDialog = e.currentTarget;

    const username = loginDialog.querySelector('input[placeholder="Логин"]').value;
    const password = loginDialog.querySelector('input[placeholder="Пароль"]').value;

    try{
        await login(username, password);
        window.open('/main', '_self');
    } catch (err){
        showMessage(document, err.message);
    }
}

async function handleSignupSubmit(e){
    e.preventDefault();
    const signupDialog = e.currentTarget;

    const username = signupDialog.querySelector('input[placeholder="Логин"]').value;
    const password = signupDialog.querySelector('input[placeholder="Пароль"]').value;
    const rePassword = signupDialog.querySelector('input[placeholder="Повторите пароль"]').value;

    try{
        await signup(username, password, rePassword);
        window.open('/main', '_self');
    } catch (err){
        showMessage(document, err.message);
    }
}

async function handleNewPostSubmit(e){
    e.preventDefault();
    const newPostForm = e.currentTarget;

    const content = newPostForm.querySelector('textarea').value;

    try{
        await addPost(content);
        location.reload();
    } catch (err) {
        showMessage(document, err.message);
    }
}

async function handleNewCommentSubmit(e){
    e.preventDefault();
    const newCommentForm = e.currentTarget;

    const content = newCommentForm.querySelector('textarea').value;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get('postId') ?? '';

    try{
        await addComment(content, postId);
        location.reload();
    } catch (err) {
        showMessage(document, err.message);
    }
}

async function handleEditNameClick(e){
    e.preventDefault();

    const el = document.querySelector('p[class="name"]');

    const currentText = el.textContent;
    const textarea = document.createElement("textarea");
    textarea.className = "name";
    textarea.style.resize="none";
    textarea.value = currentText;

    const measure = document.createElement("div");
    measure.style.position = "absolute";
    measure.style.visibility = "hidden";
    measure.style.resize = "none";
    measure.style.minWidth = "120px";
    measure.style.whiteSpace = "pre-wrap";
    measure.style.font = window.getComputedStyle(el).font;
    measure.style.lineHeight = window.getComputedStyle(el).lineHeight;
    measure.style.width = `${el.offsetWidth + 25}px`;
    measure.style.padding = "0";
    measure.textContent = currentText;
    document.body.appendChild(measure);

    textarea.style.width = `${measure.offsetWidth}px`;
    textarea.style.height = `${measure.offsetHeight}px`;

    document.body.removeChild(measure);

    el.textContent = "";
    el.appendChild(textarea);
    textarea.focus();

    textarea.addEventListener("blur", async () => {
        const newText = textarea.value.trim();
        if (newText.length === 0 || newText === currentText) el.textContent = currentText;
        else {
            try{
                await editName(newText);
                el.textContent = newText;
                // location.reload();
            } catch (err) {
                showMessage(document, err.message);
                el.textContent = currentText;
            }
        }
    });

    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter") textarea.blur();
    });
}

async function handleEditInfoClick(e){
    e.preventDefault();

    const el = document.querySelector('p[class="info"]');

    const currentText = el.textContent;
    const textarea = document.createElement("textarea");
    textarea.className = "info";
    textarea.style.resize="none";
    textarea.value = currentText;

    const measure = document.createElement("div");
    measure.style.position = "absolute";
    measure.style.visibility = "hidden";
    measure.style.resize = "none";
    measure.style.minWidth = "120px";
    measure.style.whiteSpace = "pre-wrap";
    measure.style.font = window.getComputedStyle(el).font;
    measure.style.lineHeight = window.getComputedStyle(el).lineHeight;
    measure.style.width = `${el.offsetWidth + 25}px`;
    measure.style.padding = "0";
    measure.textContent = currentText;
    document.body.appendChild(measure);

    textarea.style.width = `${measure.offsetWidth}px`;
    textarea.style.height = `${measure.offsetHeight}px`;

    document.body.removeChild(measure);

    el.textContent = "";
    el.appendChild(textarea);
    textarea.focus();

    textarea.addEventListener("blur", async () => {
        const newText = textarea.value.trim();
        if (newText.length === 0) el.textContent = currentText;
        else {
            try{
                await editInfo(newText);
                el.textContent = newText;
                // location.reload();
            } catch (err) {
                showMessage(document, err.message);
                el.textContent = currentText;
            }
        }
    });

    textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter") textarea.blur();
    });
}

// ===== ФУНКЦИИ ЗАПРОСОВ НА БЭК =====

async function login(username, password){
    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка логина');
    const token = data.token;
    const user = data.user;
    if(!token) throw new Error('Сервер не вернул токен досутпа');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));

    return token;
}

async function signup(username, password, rePassword){
    const res = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rePassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
    const token = data.token;
    const user = data.user;
    if(!token) throw new Error('Сервер не вернул токен досутпа');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    return token;
}

async function addPost(content){
    content = content.trim();
    const res = await fetchWithAuth('http://localhost:3000/api/addPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    const data = await res.json();
    if (!res.ok) {
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка создания поста');
    }
    location.reload();

    return;
}

async function addComment(content, postId){
    content = content.trim();
    const res = await fetchWithAuth('http://localhost:3000/api/addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, postId })
    });

    const data = await res.json();
    if (!res.ok) {
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка создания комментария');
    }
    location.reload();

    return;
}

async function editName (newText){
    const res = await fetchWithAuth('http://localhost:3000/api/editName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newText })
    });

    const data = await res.json();
    if(!res.ok){
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка редактирования имени');
    }

    const token = data.token;
    const user = data.user;
    if(!token) throw new Error('Сервер не вернул токен досутпа');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));

    return token;
}

async function editInfo (newText){
    const res = await fetchWithAuth('http://localhost:3000/api/editInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newText })
    });

    const data = await res.json();
    if(!res.ok){
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка редактирования bio');
    }

    localStorage.setItem('current_user', JSON.stringify(data.user));

    return;
}

// ===== ФУНКЦИИ ПОДГРУЗКИ С БЭКА =====



// ===== ФУНКЦИИ РЕНДЕРА ЗАГРУЖЕННОГО С БЭКА =====

// ===== ХЭНДЛЫ ДЕЙСТВИЙ НА ЭЛЕМЕНТАХ =====

// ===== РАБОТА С API =====

function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = options.headers ? new Headers(options.headers) : new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}