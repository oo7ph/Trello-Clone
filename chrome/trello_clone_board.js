var debugMode = false;
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

/** Copies a list and all its cards to a different board. */
var copyList = function(toBoardId, listModel) {
	var list = listModel.toJSON();
	//console.log(debugMode);
	createList({
		idBoard: toBoardId,
		name: debugMode ? (list.name + " --boardId:"+toBoardId) : list.name,
		pos: list.pos,
		closed: list.closed
	}, function(newList) {
		var newListId = newList._id;
		
		// copy cards
		var cardModels = listModel.cardList.models;
		for(var i=0; i<cardModels.length; i++) {
			copyCard(toBoardId, newListId, cardModels[i]);
		}
	});
}

/** Copies a card and all its checklists to a different list. */
var copyCard = function(toBoardId, toListId, cardModel) {
	var card = cardModel.toJSON();
	
	// create the new card
	createCard({
		idBoard: toBoardId,
		idList:  toListId,
		pos: 	 card.pos,
		desc: 	 card.desc,
		closed:  card.closed,
		name: 	 debugMode ? (card.name + " --listId:"+toListId) : card.name
	}, function(newCard) {
		var newCardId = newCard._id;
		//Update Card with Extra Attributes
		updateCard({
			idList:		toListId,
			idBoard:	toBoardId,
			idCard:		newCardId,
			updates:	_.map(
				card.labels,
				function(label){
					return {"addToSet":{labels:label}};
				}
			)
		});
		// copy checklists
		var checklistModels = cardModel.checklistList.models;
		for(var i=0; i<checklistModels.length; i++) {
			copyChecklist(toBoardId, toListId, newCardId, checklistModels[i]);
		}
	});
};

/** Copies a checklist and all its tasks to a different card. */
var copyChecklist = function(toBoardId, toListId, toCardId, checklistModel, callback) {
	var checklist = checklistModel.toJSON();
	
	// create a new checklist (add it to the board)
	createChecklist({
		idBoard: toBoardId,
		name: debugMode ? (checklist.name + " --cardId:"+toCardId) : checklist.name
	}, function(newChecklist) {
		var newChecklistId = newChecklist._id;
		
		// add the checklist to the card (separate step)
		addChecklistToCard({
			idBoard: toBoardId,
			idList: toListId,
			idCard: toCardId,
			idChecklist: newChecklistId
		}, function() {			
			// copy tasks to checklist
			var taskModels = checklistModel.checkItemList.models;
			for(var i=0; i<taskModels.length; i++) {
				var task = taskModels[i].toJSON();
				addTaskToChecklist({
					idChecklist: 	newChecklistId,
					name:		 	task.name,
					pos:		 	task.pos,
					idBoard: 	 	toBoardId
					//idPlaceholder: 	"???"
				});
			}
		});
	});
};

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
		method: "create",
		data: {
			"attrs": {
				"name": board.name,
				"closed": false, 
				"prefs": {
					"permissionLevel" : board.privacy
				}
			},
			"idParents":[]
		}
	});
};

/** Creates a new list with the given name on the given board. 
	@param list.idBoard
	@param list.name
	@param list.pos
	@param list.closed
	@param callback
*/
var createList = function(list, callback) {
	post({
		url: "/api/list",
		success: callback,
		method: "create",
		data: {
			"attrs":{
				"name": list.name,
				"pos":  list.pos,
				"closed": list.closed || false
			},
			"idParents":[list.idBoard]
		}
	});
};

/** Creates a card with the given name on the given board. 
	@param card.idBoard
	@param card.idList
	@param card.closed
	@param card.desc
	@param card.name
	@param callback
*/
var createCard = function(card, callback) {
	post({
		url: "/api/card",
		success: callback,
		method: "create",
		data: {
			"attrs": card,
			"idParents":[card.idList, card.idBoard]
		}
	});
};


/** Updates a card
	@param card.idList
	@param card.idBoard
	@param card.idCard
	@param card.updates
	@param callback
*/
var updateCard = function(card, callback) {
	post({
		url: "/api/card/" + card.idCard,
		success: callback,
		method: "update",
		data: {
			"updates": card.updates,
			"idParents":[card.idList, card.idBoard]
		}
	});
};


/** Creates a checklist on the given card. 
	@param checklist.idBoard
	@param checklist.name
	@param callback
*/
var createChecklist = function(checklist, callback) {
	post({
		url: "/api/checklist",
		success: callback,
		method: "create",
		data: {
			"attrs":{
				"name": checklist.name
			},
			"idParents":[checklist.idBoard]
		}
	});
};

/** Adds a task to a given checklist 
	@param task.idChecklist
	@param task.name
	@param task.pos
	@param task.idBoard
	@param task.idPlaceholder
	@param callback
*/
var addTaskToChecklist = function(task, callback) {
	post({
		url: "/api/checklist/" + task.idChecklist,
		success: callback,
		method: "addTask",
		data: {
			"name": task.name,
			"type": "check",
			"pos": task.pos,
			"idParents": [task.idBoard],
			"id": task.idPlaceholder
		}
	});
};

/** Add Checklist to Card
	@param card.idBoard
	@param card.idList
	@param card.idCard
	@param card.idChecklist
*/
var addChecklistToCard = function (card, callback){
	updateCard({
		idBoard:	card.idBoard,
		idList: 	card.idList,
		idCard: 	card.idCard,
		updates: [
			{ "addToSet": {	"idChecklists": card.idChecklist }}
		]
	}, callback);
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
		method: "update",
		data: {
			"updates": list.updates,
			"idParents":[list.idBoard]
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
	@param args.method
	@param args.success
*/
var post = function(args) {
	$.ajax({
		type: "post",
		dataType: "json",
		contentType: "application/json",
		processData: false,
		url: args.url,
		data: JSON.stringify({
			"token": token,
			"method": args.method,
			"data": args.data
		}),
		success: args.success
	});
}