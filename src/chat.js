import $ from "jquery";

function showSystemChat(msg) {
    $("#chats").append(
        `
        <div class="chatCenter">
            <div class="text flex max-w-max">
                <span class="block">${msg}</span>
            </div>
        </div>
        `
    );
    $("#chats").scrollTop($("#chats")[0].scrollHeight);
}

function showIncomingChat(sender, msg) {
    $("#chats").append(
        `
        <div class="chatL">
            <span class="block text-green-900 font-extrabold mb-1">${sender}</span>
            <div class="text flex max-w-max">
                <span class="block">${msg}</span>
                <span class="block mt-auto mb-0 mr-0 ml-4 text-xs text-gray-500 w-fit">10.01</span>
            </div>
        </div>
        `
    );
    $("#chats").scrollTop($("#chats")[0].scrollHeight);
}

function showSendingChat(msg) {
    $("#chats").append(
        `
        <div class="chatR">
            <div class="text flex max-w-max">
                <span class="block">${msg}</span>
                <span class="block mt-auto mb-0 mr-0 ml-4 text-xs text-gray-500 w-fit">01.10</span>
            </div>
        </div>
        `
    );
    $("#chats").scrollTop($("#chats")[0].scrollHeight);
}

function playerScore(scores) {
    let leaderboard = "";
    for (const key in scores) {
        leaderboard += `    
        <div class='text-white text-sm font-bold'>${scores[key].playerId}</div><div class='text-white text-sm font-bold'>${scores[key].score}</div>
        `;
    }
    return leaderboard;
}

function showLeaderboard(scores) {
    // $("#leaderboard").html(playerScore(scores));
    const urutan = playerScore(scores);
    // console.log(urutan);
    $("#leaderboard").html(
        `
        <div class='text-white col-span-2 text-center'>LEADERBOARD</div>
        ${urutan}
        `
    );
}

function removeAllPalyerList() {
    $("#playerlist").html(
        `
        <button id="checkallbtn" class="btn w-full text-center" >
                        Global
        </button>
        `
    );

    $("#checkallbtn").click(function () {
        checkAll();
    });
}

function addPlayerToList(playerId) {
    $("#playerlist").prepend(
        `
        <div class="flex gap-1">
            <input type="checkbox" class="my-auto playeroption" name="playercheckbox" id="${playerId}" value="${playerId}" >
            <label for="${playerId}" class="cursor-pointer">${playerId}</label>
        </div>
        `
    );
}

function checkAll() {
    var inputs = $(".playeroption");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].checked = true;
    }
}

function getAllChecked() {
    let checked = [];
    var inputs = $(".playeroption");
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].checked == true) {
            checked.push(inputs[i].value);
        }
    }

    return checked;
}

export {
    showIncomingChat,
    showSendingChat,
    checkAll,
    getAllChecked,
    addPlayerToList,
    showSystemChat,
    showLeaderboard,
    removeAllPalyerList,
};
