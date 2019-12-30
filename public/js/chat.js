const socket = io();

// Elements
const form = document.querySelector('#msgForm');
const messageInput = form.querySelector('input');
const messageBtn = form.querySelector('button');
const sendLocationBtn = document.querySelector('#sendLocation');
const messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
    // New Message element
    const newMessage = messages.lastElementChild;

    // Height of new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // Visible Height
    const visibleHeight = messages.offsetHeight;

    // Height of messages container
    const contentHeight = messages.scrollHeight;

    // How far have I scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if (contentHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        text: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('locationSent', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm A')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
})

form.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable
    messageInput.setAttribute('disabled', true)
    messageBtn.setAttribute('disabled', true)
    
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        // enable
        messageInput.removeAttribute('disabled')
        messageBtn.removeAttribute('disabled')

        messageInput.value = '';
        messageInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('Message Delivered!');
    });
})

sendLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocaiton is not supported by your browser.')
    }

    sendLocationBtn.setAttribute('disabled', true);

    navigator.geolocation.getCurrentPosition((position) => {

        const { latitude, longitude } =  position.coords;

        socket.emit('sendLocation', {latitude, longitude}, () => {
            sendLocationBtn.removeAttribute('disabled');
            console.log('Locaiton Shared');
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});