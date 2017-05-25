"use strict";

const showForm = function() {
    let button = document.getElementById("show-form");
    button.classList.add("hidden");
    document.getElementById("poll-form").classList.remove("hidden");
    
}

let numFields = 1;
let addField = function() {
    numFields += 1;

    let newGroup = document.createElement("div");
    newGroup.className = "input-group answer-field";
    newGroup.id = "group" + numFields;
    
    let newAnswer = document.createElement("input");
    newAnswer.type = "text";
    newAnswer.name = "answer" + numFields;
    newAnswer.className = "form-control";
    newAnswer.placeholder = "Answer " + (numFields + 1) + " (Optional)";

    let removeBtn = document.createElement("span");
    removeBtn.className = "input-group-addon";
    removeBtn.innerHTML = '<a href="#" onclick="removeField(' + numFields + ')"><span class="glyphicon glyphicon-remove"/></a>';

    newGroup.appendChild(newAnswer);
    newGroup.appendChild(removeBtn);

    document.getElementById("new-poll").insertBefore(newGroup, document.getElementById("add-field"));
}

let removeField = function(id) {
    while (id < numFields) {
        let nextValue = document.getElementsByName("answer" + (id + 1))[0].value; 
        document.getElementsByName("answer" + id)[0].value = nextValue;
        id++;
    }
    document.getElementById("group" + numFields).remove();
    numFields -= 1;
}