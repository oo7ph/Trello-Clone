// attach an additional click event to the open-list-menu element which will add a "Clone List" link to the popover
$(".js-open-list-menu").livequery("click", function() { 
	var listEl = $(this).parents(".list:first").get(0);

	// find the list model that matches this element (janktastic)
	var listModel = _.find(boardView.model.listList.models, function(listModel) {
		return listModel.view.el == listEl;
	});

	// set a short timeout to wait for the popover to appear
	setTimeout(function() {
		addCloneListLink(listModel);
	}, 50);
});

/** Adds a "Clone List" link to the currently active popover. */
var addCloneListLink = function(listModel) {

	// create the link
	var cloneListLink = $("<a>Clone List</a>");

	// bind a click event that copies the list
	cloneListLink.bind("click", function() {
		copyList(listModel.getBoard().id, listModel);
		$(".pop-over").hide();
	});

	// add the link to the end of the pop over menu
	$(".pop-over-list").append(
		$("<li>").append(cloneListLink)
	);
};

