// attach an additional click event to the card-menu element which will add a "Copy Card" link to the popover
$(".card-operation.js-card-menu").livequery("click", function() { 
	var cardEl = $(this).parents(".list-card:first");

	// set a short timeout to wait for the popover to appear
	setTimeout(function() {
		addCopyCardLink(cardEl.data("card"));
	}, 50);
});

/** Adds a "Copy Card" link to the currently active popover. */
var addCopyCardLink = function(cardModel) {

	// create the link
	var copyCardLink = $("<a>Copy Card</a>");

	// bind a click event that copies the card to the same list
	copyCardLink.bind("click", function() {
		copyCard(cardModel.getBoard().id, cardModel.getList().id, cardModel);
		$(".pop-over").hide();
	});

	// add the link to the end of the pop over menu
	$(".pop-over-list").append(
		$("<li>").append(copyCardLink)
	);
};
