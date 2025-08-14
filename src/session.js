export let currentUser = {};

document.addEventListener("DOMContentLoaded", () => {
    const loggedIn = localStorage.getItem("loggedIn");
    if(loggedIn == undefined){
        localStorage.setItem("loggedIn", false);
    }

    
})