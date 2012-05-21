/*
* Trello-Clone https://github.com/oo7ph/Trello-Clone
* Clone Trello Boards
*
* Authors:
*   Phillip Epstein <https://github.com/oo7ph>
*   Raine Lourie <https://github.com/RaineOrShine>
*/

/** Adds a button to the right board widget content area that allows the user to clone the current board. */
$("a:contains(Unpin from)").livequery(function() {
	var boardContent = $(this).parent().parent();
	var button = $('<li><a class="js-clone-board"> Clone Board </a></li>');
	$('a', button).click(function() {
		var name = prompt("Enter a name for the new board:", "Clone of " + boardView.model.get("name"));
		if(name) {
			cloneCurrentBoard(name);
		}
	});

	button.insertAfter($(this));
});
