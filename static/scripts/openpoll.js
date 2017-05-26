"use strict";

let numFields = document.getElementsByClassName("input-group").length;

let palette = ['indigo', 'orange', 'chartreuse',
               'magenta', 'gold', 'cyan',
               'hotpink', 'yellow', 'lightskyblue',
               'coral', 'lawngreen', 'violet'
                ];

window.onload = function() {
    let firstBtn = document.getElementsByClassName("inputwrap")[0];
    toggleActive(firstBtn);
    createChart();
}

let toggleActive = function(btn) {
    let activeBtns = document.getElementsByClassName("active")
    for (let i=0; i<activeBtns.length; i++) {
        activeBtns[i].classList.remove("active");
    }
    btn.classList.add("active")
}

let createChart = function() {
    let answers  = [];
    let votes = [];
    let colours = [];
    const ansFields = document.getElementsByName("answer");
    const countFields = document.getElementsByClassName("count");
    for (let i=0; i<ansFields.length; i++) {
        answers.push(ansFields[i].value);
        votes.push(parseInt(countFields[i].value));
        if (i < palette.length) {
            colours.push(palette[i]);
        } else {
            // generate a random rgb color if we exhaust colors in the palette:
            let r = Math.floor(Math.random() * 256);
            let g = Math.floor(Math.random() * 256);
            let b = Math.floor(Math.random() * 256);
            colours.push("rgba(" + r + "," + g + "," + b + ")");
        }
    }
    let ctx = document.getElementById("results-display").getContext("2d");
    var myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: answers,
        datasets: [{
            label: '# of Votes',
            data: votes,
            backgroundColor: colours,
            borderColor: "palegoldenrod",
            }]
        }
    });
}

let openEdit = function() {
    document.getElementById("edit-poll").classList.remove("hidden");
    document.getElementById("poll-display").classList.add("hidden");
}

let addField = function() {
    numFields += 1;

    let newGroup = document.createElement("div");
    newGroup.className = "input-group answer-field";
    newGroup.id = "group" + numFields;
    
    let newAnswer = document.createElement("input");
    newAnswer.type = "text";
    newAnswer.name = "answer" + numFields;
    newAnswer.className = "form-control";
    newAnswer.placeholder = "New answer";

    let removeBtn = document.createElement("span");
    removeBtn.className = "input-group-addon";
    removeBtn.innerHTML = '<a href="#" onclick="removeField(' + numFields + ')"><span class="glyphicon glyphicon-remove"/></a>';

    newGroup.appendChild(newAnswer);
    newGroup.appendChild(removeBtn);

    document.getElementById("poll-form").insertBefore(newGroup, document.getElementById("add-field"));
}

let removeField = function(id) {
    if (id < 2 && numFields < 3) {
        return alert("You need at least two answers for your poll!")
    }
    numFields -=1;
    while (id < numFields) {
        let nextAnswer = document.getElementsByName("answer" + (id + 1))[0].value;
        let nextCount = document.getElementsByName("count" + (id + 1))[0].value;
        document.getElementsByName("answer" + id)[0].value = nextAnswer;
        document.getElementsByName("count" + id)[0].value = nextCount
        id++;
    }
    document.getElementById("group" + numFields).remove();
}

let ensureChecked = function(form) {
    if (!form.answer.value) {
        alert("You must select at least one answer before you can submit!")
        return false;
    }
    return true;
}