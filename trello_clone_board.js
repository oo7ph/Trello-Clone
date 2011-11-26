var token = "4ec4c13d862588493a0b6592/93b1188a8a447de9e811a8b0b8dae8242c90ddb608a093e834fbb6c1eb6bb0f1";
var idBoard = boardView.model.get("id");
var log = function() { console.log(this, arguments); };

/** Copies the current board, including all lists and cards, into a new board with the given name.
	@param board.name
	@param board.privacy
	@param callback
*/
var cloneBoard = function(board, callback) {
	
	// create a new board
	createBoard(
		board,
		function(data) {
		
			var newBoardId = data._id;
			
			// archive default lists
			for(var i=0; i<data.lists.length; i++) {
				archiveList(newBoardId, data.lists[i]._id);
			}
			
			// copy lists from current board into the new board
			var listModels = boardView.model.listList.models;
			for(var i=0; i<listModels.length; i++) {
				copyList(newBoardId, listModels[i]);
			}
			
			// TODO: We have to wait until all ajax requests finish before redirecting
			// redirect to new board
			//location.href = "/board/" + newBoardId;
		}
	);
};

var copyList = function(toBoardId, listModel) {
	var list = listModel.toJSON();
	createList({
		idBoard: toBoardId,
		name: list.name,
		closed: list.closed
	}, function(data) {
		var newListId = data._id;
		var cardModels = listModel.cardList.models;
		for(var i=0; i<cardModels.length; i++) {
			var card = cardModels[i].toJSON();
			createCard({
				idBoard: toBoardId,
				idList: newListId,
				closed: card.closed,
				name: card.name
			});
		}
	});
}

/** Creates a new board with the given name. 
	@param board.name
	@param board.privacy
	@param callback
*/
var createBoard = function(board, callback) {
	var board = board || {};
	board.privacy = board.privacy || "private";
	post({
		url: "/api/board",
		success: callback,
		data: {
			"token": token,
			"method": "create",
			"data": {
				"attrs": {
					"name": board.name,
					"closed": false, 
					"prefs": {
						"permissionLevel" : board.privacy
					}
				},
				"idParents":[]
			}
		}
	});
};

/** Creates a new list with the given name on the given board. 
	@param list.idBoard
	@param list.name
	@param list.closed
	@param callback
*/
var createList = function(list, callback) {
	post({
		url: "/api/list",
		success: callback,
		data: {
			"token": token,
			"method": "create",
			"data": {
				"attrs":{
					"name": list.name,
					//"pos":65537,
					"closed": list.closed || false
				},
				"idParents":[list.idBoard]
			}
		}
	});
};

/** Creates a new list with the given name on the given board. 
	@param card.idBoard
	@param card.idList
	@param card.closed
	@param card.name
	@param callback
*/
var createCard = function(card, callback) {
	post({
		url: "/api/card",
		success: callback,
		data: {
			"token": token,
			"method": "create",
			"data": {
				"attrs":{
					"name": card.name,
					//"pos":65537,
					"closed": card.closed || false,
					"idBoard": card.idBoard,
					"idList": card.idList
				},
				"idParents":[card.idList,card.idBoard]
			}
		}
	});
};

/** Archive all lists in the given board */
var archiveAll = function(idBoard) {
	
};

/** Archives the given list. */
var archiveList = function(idBoard, idList, callback) {
	updateList({
		id: idList,
		updates: [
			{ "set": { "closed": true }}
		],
		idBoard: idBoard
	}, callback);
};

/** Updates a list.
	@param list.id
	@param list.updates
	@param list.idBoard
	@param callback
*/
var updateList = function(list, callback) {
	post({
		url: "/api/list/" + list.id,
		success: callback,
		data: {
			"token": token,
			"method": "update",
			"data": {
				"updates": list.updates,
				"idParents":[list.idBoard]
			}
		}
	});
};

/** Gets all current data for the given board. */
var getBoardData = function(idBoard, callback) {
	$.get("/data/board/" + idBoard + "/current", callback);
}

/** A simplified POST. 
	@param args.url
	@param args.data
	@param args.success
*/
var post = function(args) {
	$.ajax({
		type: "post",
		dataType: "json",
		contentType: "application/json",
		processData: false,
		url: args.url,
		data: JSON.stringify(args.data),
		success: args.success
	});
}