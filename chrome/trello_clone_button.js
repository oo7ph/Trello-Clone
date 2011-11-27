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
