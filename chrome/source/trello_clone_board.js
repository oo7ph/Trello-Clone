/*
* Trello-Clone https://github.com/oo7ph/Trello-Clone
* Clone Trello Boards
*
* Authors:
*   Phillip Epstein <https://github.com/oo7ph>
*   Raine Lourie <https://github.com/RaineOrShine>
*/

var debugMode = false;
var log = function() { console.log(this, arguments); };

/**Clones the current board
	@param newBoardName
	@param callback
*/
var cloneCurrentBoard = function(newBoardName) {
	cloneBoard(boardView.model.toJSON(), newBoardName);
}

/** Copies a given board, including all lists and cards, into a new board with the given name.
	@param fromBoard @see createBoard
	@param newBoardName
	@param callback
*/

var cloneBoard = function(fromBoard, newBoardName) {
	// create a new board
	createBoard(
		_.extend({},fromBoard,{name:newBoardName}),
		function(data) {
		
			var newBoardId = data._id;

			var archiveListQueue = _.map(data.lists, function(list) {
				return function(callback) {
					archiveList(newBoardId, list._id, callback);
				};
			});
			
			// copy lists from current board into the new board
			var listModels = boardView.model.listList.models;
			var copyListQueue = _.map(listModels, function(listModel) {
				return function(callback) {
					copyList(newBoardId, listModel, callback);
				};
			});
			callAfterDone(archiveListQueue.concat(copyListQueue), function() {
				// redirect to new board
				location.href = "https://trello.com/board/" + newBoardId;
			});
		}
	);
};

/** Copies a list and all its cards to a different board. */
var copyList = function(toBoardId, listModel, callback) {
	var list = listModel.toJSON();
	createList({
		idBoard: toBoardId,
		name: debugMode ? (list.name + " --boardId:"+toBoardId) : list.name,
		pos: list.pos,
		closed: list.closed
	}, function(newList) {
		var newListId = newList._id;
		
		// copy cards
		var cardModels = listModel.cardList.models;
		var copyCardQueue = _.map(cardModels, function(cardModel) {
			return function(callback) {
				copyCard(toBoardId, newListId, cardModel, callback);
			};
		});
		
		callAfterDone(copyCardQueue, callback);
	});
}

/** Copies a card and all its checklists to a different list. */
var copyCard = function(toBoardId, toListId, cardModel, callback) {
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

		// update card with extra attributes
		var updateAction = function(callback) {
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
			}, callback);
			
		};

		// copy checklists
		var checklistModels = cardModel.checklistList.models;
		var copyQueue = _.map(checklistModels, function(checklistModel) {
			return function(callback) {
				copyChecklist(toBoardId, toListId, newCardId, checklistModel, callback);
			};
		});

		// callback();
		callAfterDone([updateAction].concat(copyQueue), callback);
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
			var addTaskQueue = _.map(taskModels, function(taskModel) {
				return function(callback) {
					var task = taskModel.toJSON();
					addTaskToChecklist({
						idChecklist: 	newChecklistId,
						name:		 	task.name,
						pos:		 	task.pos,
						idBoard: 	 	toBoardId
						//idPlaceholder: 	"???"
					}, callback);
				};
			});
			
			callAfterDone(addTaskQueue, callback);
		});
	});
};

/** Creates a new board with the given name. 
	@param board.name
	@param board.desc
	@param board.labelNames
	@param board.idOrganization
	@param board.prefs
	@param board.privacy
	@param callback
*/
var createBoard = function(board, callback) {
	var board = board || {};
	board.privacy = board.privacy || "private";
	var attributes = {
		"name": board.name,
		"desc": board.desc,
		"labelNames": board.labelNames,
		"prefs": board.prefs,
		"closed": false, 
		"prefs": {
			"permissionLevel" : board.privacy
		}
	};

	if(board.idOrganization){
		attributes.idOrganization = board.idOrganization;
	}

	post({
		url: "/api/board",
		success: callback,
		method: "create",
		data: {
			"attrs": attributes,
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
};

/** A simplified POST. 
	@param args.url
	@param args.data
	@param args.method
	@param args.success
*/
var post = function(args) {

	var isToken = function(s) { return s.indexOf("token=") === 0; };
	var tokenKeyValue = _.find(document.cookie.split(/\W*;\W*/), isToken);
	var token = unescape(tokenKeyValue.split("=")[1]);

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
};


/*******************
 * Utility
 *******************/

/** Invokes a callback after all the given asynchronous functions have completed. All asynchronous functions must accept a single callback argument. */
var callAfterDone = function(queue, callback) {

	var count = queue.length;

	if(count === 0) {
		callback();
	}
	else {
		var decAndCheck = function() {
			if(--count <= 0) {
				callback();
			}
		};

		for(var i=0; i<queue.length; i++) {
			queue[i](decAndCheck);
		}
	}
};

