import start from './start';

start.then(function () {

});

// // Saves options to chrome.storage.sync.
// function save() {
//   // var color = document.getElementById('color').value;
//   // var likesColor = document.getElementById('like').checked;
//   chrome.storage.sync.set({
//     favoriteColor: color,
//     likesColor: likesColor
//   }, function() {
//     // Update status to let user know options were saved.
//     var status = document.getElementById('status');
//     status.textContent = 'Options saved.';
//     setTimeout(function() {
//       status.textContent = '';
//     }, 750);
//   });
// }
//
// // Restores select box and checkbox state using the preferences
// // stored in chrome.storage.
// function restore() {
//   // Use default value color = 'red' and likesColor = true.
//   chrome.storage.sync.get({
//     favoriteColor: 'red',
//     likesColor: true
//   }, function(items) {
//     // document.getElementById('color').value = items.favoriteColor;
//     // document.getElementById('like').checked = items.likesColor;
//   });
// }
//
//
//
//
//
// document.addEventListener('DOMContentLoaded', restore);
// document.getElementById('save').addEventListener('click', save);
