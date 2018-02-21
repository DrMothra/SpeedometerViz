//Speedometer visualisation


$(document).ready( () => {
    let host = window.document.location.host.replace(/:.*/, '');
    let ws = new WebSocket('ws://' + host + ':3000');
    ws.onmessage = function (event) {
        console.log("Speed = ", event.data);
    };
});
