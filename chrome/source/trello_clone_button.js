/*
* Trello-Clone https://github.com/oo7ph/Trello-Clone
* Clone Trello Boards
*
* Authors:
*   Phillip Epstein <https://github.com/oo7ph>
*   Raine Lourie <https://github.com/RaineOrShine>
*/

/** Adds a button to the right board widget content area that allows the user to clone the current board. */
$("a:contains(Board Menu)").livequery(function() {
	var boardContent = $(this).parent();
	var button = $('<a class="button-link highlight-icon"><span class="app-icon small-icon add-icon"></span> Clone Board </a>');
	button.click(function() {
		var name = prompt("Enter a name for the new board:", "Clone of " + boardView.model.get("name"));
		if(name) {
			cloneCurrentBoard(name);
		}
	});

	boardContent.append(button);
});
