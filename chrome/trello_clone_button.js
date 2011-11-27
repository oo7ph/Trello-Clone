/*
** Trello-Clone v0.1 - https://github.com/oo7ph/Trello-Clone
** Clone Trello Boards
**
** Orig:
** Phillip Epstein <https://github.com/oo7ph>
** Raine Lourie <https://github.com/RaineOrShine>
**
** Changelog:
** v0.1
** - Initial release
**
*/

/** Adds a button to the right board widget content area that allows the user to clone the current board. */
$("a:contains(Board Profile)").livequery(function() {
	var boardContent = $(this).parent();
	var button = $('<a class="button-link highlight-icon"> Clone Board </a>');
	button.click(function() {
		var name = prompt("Enter a name for the new board:", "Clone of " + boardView.model.get("name"));
		if(name) {
			cloneCurrentBoard(name);
		}
	});

	boardContent.append(button);
});
