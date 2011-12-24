// attach an additional click event to the card-menu element which will add a "Copy Card" link to the popover
$(".card-operation.js-card-menu").livequery("click", function() { 
	var cardEl = $(this).parents(".list-card:first");

	// set a short timeout to wait for the popover to appear
	setTimeout(function() {
		addCopyCardLink(cardEl);
	}, 50);
});

/** Adds a "Copy Card" link to the currently active popover. */
var addCopyCardLink = function(cardEl) {
	var copyCardLink = $("<a>Copy Card</a>");
	copyCardLink.bind("click", function() {
		var cardModel = cardEl.data("card");
		copyCard(cardModel.getBoard().id, cardModel.getList().id, cardModel);
	});

	$(".pop-over-list").append(
		$("<li>").append(copyCardLink)
	);
};
