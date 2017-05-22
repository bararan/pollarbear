"use strict";

let toggleActive = function(btn) {
    let activeBtns = document.getElementsByClassName("active")
    for (let i=0; i<activeBtns.length; i++) {
        activeBtns[i].classList.remove("active");
    }
    btn.classList.add("active")
}
