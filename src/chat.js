import $ from "jquery";

function showIncomingChat(sender, msg) {
    $('#chats').append(
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
    $('#chats').append(
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

export { showIncomingChat, showSendingChat };