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

async function checkParams(postId, userId) {
    if(userId){
        const res = await fetch('http://localhost:3000/api/checkUserId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if(!res.ok) return false;
    }
    if(postId){
        const res = await fetch('http://localhost:3000/api/checkPostId', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId })
        });

        if(!res.ok) return false;
    }

    return true;
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

    // const likeButtons = document.querySelectorAll('.heart-img');
    // likeButtons.forEach((el, index) => {
    //     el.addEventListener('click', handleLikeClick);
    // })
}

async function loadAndRenderPageContent() {
    const currentURL = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';
    const userId = params.get('userId') ?? '';
    const postId = params.get('postId') ?? '';

    if(currentURL==='/login')
        document.getElementById('signupButton').addEventListener('click', () => window.open('/signup', '_self'));
    if(currentURL==='/signup')
        document.getElementById('login-button').addEventListener('click', () => window.open('/login', '_self'));
    if(currentURL==='/main'){
        try{
            await renderPosts(q, userId, postId);
        } catch (err) {
            showMessage(document, err.message);
        };
    }
    if(currentURL==='/search'){
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q') ?? '';
        document.getElementById('users-search').addEventListener('click', handleUsersSearchClick);
        document.getElementById('posts-search').addEventListener('click', handlePostsSearchClick);
        await renderUsers(q);
    }
    if(currentURL==='/comments'){
        try {
            await renderPosts(q, userId, postId);
        } catch (err) {
            showMessage(document, err.message);
        } try {
            await renderComms(postId);
        } catch (err) {
            showMessage(document, err.message);
        };
        // document.getElementById('back-to-main').addEventListener('click', () => window.open('/main'));
    }
    if(currentURL==='/profile'){
        if(!currentUser){
            document.getElementById('edit-pic').style="visibility: hidden";
            document.getElementById('edit-name').style="visibility: hidden";
            document.getElementById('edit-info').style="visibility: hidden";
        } else if(currentUser.id !== userId){
            document.getElementById('edit-pic').style="visibility: hidden";
            document.getElementById('edit-name').style="visibility: hidden";
            document.getElementById('edit-info').style="visibility: hidden";
            document.getElementById('post-form').innerHTML='';
        }

        try {
            await renderPhoto(userId);
        } catch (err) {
            showMessage(document, err.message);
        } try {
            await renderName(userId);
        } catch (err) {
            showMessage(document, err.message);
        } try {
            await renderBio(userId);
        } catch (err) {
            showMessage(document, err.message);
        } try {
            await renderPosts(q, userId, postId);
        } catch (err) {
            showMessage(document, err.message);
        };
    }
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
    
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('postId') ?? '';
    const userId = params.get('userId') ?? '';
    const trueParams = await checkParams(postId, userId);
    if(!trueParams){
        window.location.href = '/main';
    }
        
    if(currentURL === '/profile' && !userId){
        if (!isAuth){
            window.location.href = `/main`;
        } else{
            window.location.href = `/profile?userId=${currentUser.id}`;
        }
    } 

    await loadAndRenderHeader();
    await setupFormHandlers();
    await loadAndRenderPageContent();
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

async function handleLikeClick(e) {
    e.preventDefault();

    const likeButton = e.currentTarget;
    const heartImg = likeButton.querySelector('.heart-img');
    const currentLikesNum = Number(likeButton.querySelector('.text').textContent);
    try{
        await like(likeButton.id);
        if (heartImg.src==='http://localhost:3000/public/heart.svg') {
            heartImg.src='/public/heart-solid.svg';
            likeButton.querySelector('.text').textContent = `${currentLikesNum+1}`;
        } else{
            heartImg.src='/public/heart.svg';
            likeButton.querySelector('.text').textContent = `${currentLikesNum-1}`;
        }
    } catch (err) {
        showMessage(document, err.message);
    }
}

async function handleDelPostClick(e) {
    e.preventDefault();
    
    const confirm = window.confirm('Вы уверены, что хотите удалить пост?');
    if (!confirm) return;

    const delButton = e.currentTarget;
    const postId = delButton.classList[1];
    try{
        await deletePost(postId);
        location.reload();
    } catch (err){
        showMessage(document, err.message);
    }
}

async function handleUsersSearchClick(e) {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';

    const usersSearchBtn = document.getElementById('users-search');
    const postsSearchBtn = document.getElementById('posts-search');

    postsSearchBtn.classList.remove('chosen');
    if(!usersSearchBtn.classList.contains('chosen')) usersSearchBtn.classList.add('chosen');

    document.querySelector('.posts-list').innerHTML='';

    await renderUsers(q);    
}

async function handlePostsSearchClick(e) {
    e.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';

    const usersSearchBtn = document.getElementById('users-search');
    const postsSearchBtn = document.getElementById('posts-search');

    usersSearchBtn.classList.remove('chosen');
    if(!postsSearchBtn.classList.contains('chosen')) postsSearchBtn.classList.add('chosen');

    document.querySelector('.users-list').innerHTML='';
    
    await renderPosts(q);    
}

async function handleDelCommClick(e) {
    e.preventDefault();
    
    const confirm = window.confirm('Вы уверены, что хотите удалить комментарий?');
    if (!confirm) return;

    const delButton = e.currentTarget;
    const commId = delButton.classList[1];
    try{
        await deleteComm(commId);
        location.reload();
    } catch (err){
        showMessage(document, err.message);
    }
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
        if(res.status === 401) throw new Error ('Войдите или зарегистрируйтесь');
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
        if(res.status === 401) throw new Error ('Войдите или зарегистрируйтесь');
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

async function like(postId) {
    const res = await fetchWithAuth('http://localhost:3000/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({postId})
    });

    const data = await res.json();
    if(!res.ok){
        if(res.status === 401) throw new Error ('Войдите или зарегистрируйтесь');
        throw new Error (data.error || 'Ошибка лайка поста');
    }

    return;
}

async function deletePost(postId) {
        const res = await fetchWithAuth('http://localhost:3000/api/deletePost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
    });

    const data = await res.json();
    if(!res.ok){
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка удаления поста');
    }

    return;
}

async function deleteComm(commId) {
        const res = await fetchWithAuth('http://localhost:3000/api/deleteComm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commId })
    });

    const data = await res.json();
    if(!res.ok){
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка удаления комментария');
    }

    return;
}

async function getPicSRC(userId) {
        const res = await fetch('http://localhost:3000/api/getPicSRC', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки аватара');
    }

    return data.picSRC;
}

async function getUserName(userId) {
        const res = await fetch('http://localhost:3000/api/getUserName', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки имени');
    }

    return data.name;
}

async function getUserBio(userId) {
        const res = await fetch('http://localhost:3000/api/getUserBio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки bio');
    }

    return data.bio;
}

// ===== ФУНКЦИИ ЗАГРУЗКИ С БЭКА =====

async function loadPosts(){ //массив объектов - постов
    const res = await fetch('http://localhost:3000/api/loadPosts', {
        method: 'POST', 
        // headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки постов');
    }

    return data.posts;
}

async function loadUser(userId) { //объект - юзер
    const res = await fetch('http://localhost:3000/api/loadUser', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify( { userId } )
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки пользователя');
    }

    return data.user;
}

async function loadUsers() { //массив объектов - юзеров
    const res = await fetch('http://localhost:3000/api/loadUsers', {
        method: 'POST', 
        // headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки пользователей');
    }

    return data.users;
}

async function isLiked(postId) {
    if(!currentUser) return false;
    const res = await fetchWithAuth('http://localhost:3000/api/isLiked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({postId})
    });

    const data = await res.json();
    if(!res.ok){
        if(res.status === 401) throw new Error ('Авторизуйтесь повторно');
        throw new Error (data.error || 'Ошибка проверки лайка поста');
    }

    return data.liked;
}

async function loadComms(postId){
    const res = await fetch('http://localhost:3000/api/loadComms', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({postId})
    });

    const data = await res.json();
    if(!res.ok){
        throw new Error (data.error || 'Ошибка загрузки комментариев');
    }

    return data.comms;
}

// ===== ФУНКЦИИ РЕНДЕРА ЗАГРУЖЕННОГО С БЭКА =====

async function renderUser(userId, postId) {
    const user = await loadUser(userId);

    const delButtonElem = document.createElement('button');

    const userElem = document.createElement('div');
    userElem.className='user';

    const avatarElem = document.createElement('img');
    avatarElem.className='avatar';
    avatarElem.src=`${user.avatar}`;
    avatarElem.alt="Author's avatar";

    const buttonElem = document.createElement('button');
    buttonElem.className='post-user-button';
    buttonElem.type='button';
    buttonElem.style='background: none; border: none';

    const pElem = document.createElement('p');
    pElem.className = 'name';
    pElem.textContent=`${user.name}`;

    buttonElem.appendChild(pElem);
    userElem.appendChild(avatarElem);
    userElem.appendChild(buttonElem);
    const auth = await checkAuth();
    if(auth && postId){
        if(userId === currentUser.id){
            delButtonElem.classList.add('comment-delete');
            delButtonElem.classList.add(`${postId}`);
            delButtonElem.title='Удалить';
            delButtonElem.type='button';
            delButtonElem.textContent=`🗑️`;
            userElem.appendChild(delButtonElem);
        }
    }

    return userElem;
}

async function renderLikeBtn(p){
    const isLikedTrue = await isLiked(p.id);
    const likeBtnElem = document.createElement('button');
    likeBtnElem.className='button primary less';
    likeBtnElem.type='button';
    likeBtnElem.id=`${p.id}`;
    if(isLikedTrue){
        likeBtnElem.innerHTML=`
            <div class="in-button">
                <img class="heart-img" src="/public/heart-solid.svg" alt="Like a post">
                <p class="text">${p.likesCount}</p>
            </div>
        `
    } else{
        likeBtnElem.innerHTML=`
            <div class="in-button">
                <img class="heart-img" src="/public/heart.svg" alt="Like a post">
                <p class="text">${p.likesCount}</p>
            </div>
        `
    }

    return likeBtnElem;
}

async function renderPost(p){
    const postElem = document.createElement('li');
    const authorElem = await renderUser(p.authorId, p.id);
    const likeButtonElem = await renderLikeBtn(p);

    const commentsButtonElem = document.createElement('button');
    commentsButtonElem.className='button secondary less';
    commentsButtonElem.type='button';
    commentsButtonElem.innerHTML=`
        <button class="button secondary less" type="button">
            <div class="in-button">
                <p class="text">Комментарии ${p.commentsCount}</p>
            </div>
        </button>
    `;
    
    postElem.innerHTML = `
    <div class="post">
        <section class="post-section" id='user-in-${p.id}'>
        </section>
        <section class="post-section" id="two">
            <p class="post-text">${p.content}</p>
        </section>
        <section class="post-section" id='buttons-in-${p.id}'>
        </section>
    </div>
    `;

    authorElem.querySelector('.post-user-button').addEventListener('click', () => window.open(`/profile?userId=${p.authorId}`, '_self'));
    const deleteBtn = authorElem.querySelector('.comment-delete');
    if(deleteBtn) deleteBtn.addEventListener('click', handleDelPostClick);
    likeButtonElem.addEventListener('click', handleLikeClick);
    commentsButtonElem.addEventListener('click', () =>{
        if(window.location.pathname !== '/comments') window.open(`/comments?postId=${p.id}`, '_self');
    } );

    document.body.appendChild(postElem);
    document.getElementById(`user-in-${p.id}`).appendChild(authorElem);
    document.getElementById(`buttons-in-${p.id}`).appendChild(likeButtonElem);
    document.getElementById(`buttons-in-${p.id}`).appendChild(commentsButtonElem);
    document.body.removeChild(postElem);

    return postElem;
}

async function renderComm(c){
    const commElem = document.createElement('li');
    commElem.className='comment';

    const authorElem = await renderUser(c.authorId, c.id);
    
    const commentContent = document.createElement('div');
    commentContent.className='comment-content';

    const commentHeader = document.createElement('div');
    commentHeader.className='comment-header';

    const commentText = document.createElement('p');
    commentText.className='comment-text';
    commentText.innerHTML=`${c.content}`;

    document.body.appendChild(commentHeader);
    commentHeader.appendChild(authorElem);
    document.body.removeChild(commentHeader);
    document.body.appendChild(commentContent);
    commentContent.appendChild(commentHeader);
    commentContent.appendChild(commentText);
    document.body.removeChild(commentContent);
    
    document.body.appendChild(commElem);
    commElem.appendChild(commentContent);
    document.body.removeChild(commElem);

    authorElem.querySelector('.post-user-button').addEventListener('click', () => window.open(`/profile?userId=${c.authorId}`, '_self'));
    const deleteBtn = authorElem.querySelector('.comment-delete');
    if(deleteBtn) deleteBtn.addEventListener('click', handleDelCommClick);

    return commElem;
}

// ===== ФУНКЦИИ ОТРИСОВКИ =====

async function renderPhoto(userId) {
    const picture = document.getElementById('user-photo');
    try{
        const picSRC = await getPicSRC(userId);
        picture.src=`${picSRC}`;
    } catch (err){
        showMessage(document, err.message);
    }
}

async function renderName(userId) {
    const name = document.getElementById('name');
    try{
        const userName = await getUserName(userId);
        name.textContent=`${userName}`;
    } catch (err){
        showMessage(document, err.message);
    }
}

async function renderBio(userId) {
    const bio = document.getElementById('bio');
    try{
        const userBio = await getUserBio(userId);
        bio.textContent=`${userBio}`;
    } catch (err){
        showMessage(document, err.message);
    }
}

async function renderPosts(q, userId, postId) {
    let posts = await loadPosts();

    if(q) posts = posts.filter(p => p.content.toLowerCase().includes(q.toLowerCase()));
    if(userId) posts = posts.filter(p => p.authorId === userId);
    if(postId) posts = posts.filter(p => p.id === postId);

    const postsList = document.querySelector('.posts-list');
    posts.forEach(async (p) => {
        const postElem = await renderPost(p);
        postsList.appendChild(postElem);
    });
}

async function renderUsers(q) {
    let users = await loadUsers();

    if(q) users = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));

    const usersList = document.querySelector('.users-list');
    users.forEach(async (u) => {
        const userLiElem = document.createElement('li');
        const userElem = await renderUser(u.id);
        userElem.querySelector('.post-user-button').addEventListener('click', () => window.open(`/profile?userId=${u.id}`, '_self'));
        usersList.appendChild(userLiElem);
        userLiElem.appendChild(userElem);
    });
}

async function renderComms(postId) {
    let comms = await loadComms(postId);

    const commsList = document.querySelector('.comments-list');
    comms.forEach(async (c) => {
        const commElem = await renderComm(c);
        commsList.appendChild(commElem);
    });
}

// ===== РАБОТА С API =====

function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = options.headers ? new Headers(options.headers) : new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}

async function tryRefresh() {
  const res = await fetch('/api/refresh', { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    sessionStorage.removeItem('access_token');
    throw new Error('Refresh failed');
  }
  const { token } = await res.json();
  sessionStorage.setItem('access_token', token);
  return token;
}