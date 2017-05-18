"use strict";

const showForm = function() {
    let button = document.getElementById("show-form");
    console.log(button.classList)
    button.classList.add("hidden");
    console.log(button.classList);
    document.getElementById("form-container").classList.remove("hidden");
    
}

let numFields = 2;
    let addField = function() {
        numFields += 1;
        let newOption = document.createElement("input");
        document.getElementsByClassName("bottom-field")[0].className = "form-control mid-field";
        newOption.type = "text";
        newOption.name = "option" + numFields;
        newOption.className = "form-control bottom-field";
        newOption.placeholder = "Answer " + numFields + " (Optional)";
        document.getElementById("new-poll").insertBefore(newOption, document.getElementById("add-field"));
    }
