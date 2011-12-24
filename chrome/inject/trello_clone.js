var trello_clone_source = "var debugMode = false;\nvar log = function() { console.log(this, arguments); };\n\n\x2F**Clones the current board\n\t@param newBoardName\n\t@param callback\n*\x2F\nvar cloneCurrentBoard = function(newBoardName) {\n\tcloneBoard(boardView.model.toJSON(), newBoardName);\n}\n\n\x2F** Copies a given board, including all lists and cards, into a new board with the given name.\n\t@param fromBoard @see createBoard\n\t@param newBoardName\n\t@param callback\n*\x2F\n\nvar cloneBoard = function(fromBoard, newBoardName) {\n\t\x2F\x2F create a new board\n\tcreateBoard(\n\t\t_.extend({},fromBoard,{name:newBoardName}),\n\t\tfunction(data) {\n\t\t\n\t\t\tvar newBoardId = data._id;\n\t\t\t\n\t\t\t\x2F\x2F archive default lists\n\t\t\t\x2F\x2Ffor(var i=0; i\x3Cdata.lists.length; i++) {\n\t\t\t\x2F\x2F\tarchiveList(newBoardId, data.lists[i]._id);\n\t\t\t\x2F\x2F}\n\n\t\t\tvar archiveListQueue = _.map(data.lists, function(list) {\n\t\t\t\treturn function(callback) {\n\t\t\t\t\tarchiveList(newBoardId, list._id, callback);\n\t\t\t\t};\n\t\t\t});\n\t\t\t\n\t\t\t\x2F\x2F copy lists from current board into the new board\n\t\t\tvar listModels = boardView.model.listList.models;\n\t\t\t\x2F\x2Ffor(var i=0; i\x3ClistModels.length; i++) {\n\t\t\t\x2F\x2F\tcopyList(newBoardId, listModels[i], log);\n\t\t\t\x2F\x2F}\n\t\t\t\n\t\t\tvar copyListQueue = _.map(listModels, function(listModel) {\n\t\t\t\treturn function(callback) {\n\t\t\t\t\tcopyList(newBoardId, listModel, callback);\n\t\t\t\t};\n\t\t\t});\n\t\t\tcallAfterDone(archiveListQueue.concat(copyListQueue), function() {\n\t\t\t\t\x2F\x2F redirect to new board\n\t\t\t\tlocation.href = \"https:\x2F\x2Ftrello.com\x2Fboard\x2F\" + newBoardId;\n\t\t\t});\n\t\t}\n\t);\n};\n\n\x2F** Copies a list and all its cards to a different board. *\x2F\nvar copyList = function(toBoardId, listModel, callback) {\n\tvar list = listModel.toJSON();\n\tcreateList({\n\t\tidBoard: toBoardId,\n\t\tname: debugMode ? (list.name + \" --boardId:\"+toBoardId) : list.name,\n\t\tpos: list.pos,\n\t\tclosed: list.closed\n\t}, function(newList) {\n\t\tvar newListId = newList._id;\n\t\t\n\t\t\x2F\x2F copy cards\n\t\tvar cardModels = listModel.cardList.models;\n\t\t\x2F\x2Ffor(var i=0; i\x3CcardModels.length; i++) {\n\t\t\x2F\x2F\tcopyCard(toBoardId, newListId, cardModels[i], log);\n\t\t\x2F\x2F}\n\n\t\tvar copyCardQueue = _.map(cardModels, function(cardModel) {\n\t\t\treturn function(callback) {\n\t\t\t\tcopyCard(toBoardId, newListId, cardModel, callback);\n\t\t\t};\n\t\t});\n\t\tcallAfterDone(copyCardQueue, callback);\n\t});\n}\n\n\x2F** Copies a card and all its checklists to a different list. *\x2F\nvar copyCard = function(toBoardId, toListId, cardModel, callback) {\n\tvar card = cardModel.toJSON();\n\t\n\t\x2F\x2F create the new card\n\tcreateCard({\n\t\tidBoard: toBoardId,\n\t\tidList:  toListId,\n\t\tpos: \t card.pos,\n\t\tdesc: \t card.desc,\n\t\tclosed:  card.closed,\n\t\tname: \t debugMode ? (card.name + \" --listId:\"+toListId) : card.name\n\t}, function(newCard) {\n\t\tvar newCardId = newCard._id;\n\n\t\t\x2F\x2F update card with extra attributes\n\t\tvar updateAction = function(callback) {\n\t\t\tupdateCard({\n\t\t\t\tidList:\t\ttoListId,\n\t\t\t\tidBoard:\ttoBoardId,\n\t\t\t\tidCard:\t\tnewCardId,\n\t\t\t\tupdates:\t_.map(\n\t\t\t\t\tcard.labels,\n\t\t\t\t\tfunction(label){\n\t\t\t\t\t\treturn {\"addToSet\":{labels:label}};\n\t\t\t\t\t}\n\t\t\t\t)\n\t\t\t});\n\t\t};\n\n\t\t\x2F\x2F copy checklists\n\t\tvar checklistModels = cardModel.checklistList.models;\n\t\t\x2F\x2Ffor(var i=0; i\x3CchecklistModels.length; i++) {\n\t\t\x2F\x2F\tcopyChecklist(toBoardId, toListId, newCardId, checklistModels[i], log);\n\t\t\x2F\x2F}\n\n\t\tvar copyQueue = _.map(checklistModels, function(checklistModel) {\n\t\t\treturn function(callback) {\n\t\t\t\tcopyChecklist(toBoardId, toListId, newCardId, checklistModel, callback);\n\t\t\t};\n\t\t});\n\n\t\tcallback();\n\t\tcallAfterDone([updateAction].concat(copyQueue), callback);\n\t});\n};\n\n\x2F** Copies a checklist and all its tasks to a different card. *\x2F\nvar copyChecklist = function(toBoardId, toListId, toCardId, checklistModel, callback) {\n\tvar checklist = checklistModel.toJSON();\n\t\n\t\x2F\x2F create a new checklist (add it to the board)\n\tcreateChecklist({\n\t\tidBoard: toBoardId,\n\t\tname: debugMode ? (checklist.name + \" --cardId:\"+toCardId) : checklist.name\n\t}, function(newChecklist) {\n\t\tvar newChecklistId = newChecklist._id;\n\t\t\n\t\t\x2F\x2F add the checklist to the card (separate step)\n\t\taddChecklistToCard({\n\t\t\tidBoard: toBoardId,\n\t\t\tidList: toListId,\n\t\t\tidCard: toCardId,\n\t\t\tidChecklist: newChecklistId\n\t\t}, function() {\t\t\t\n\t\t\t\x2F\x2F copy tasks to checklist\n\t\t\tvar taskModels = checklistModel.checkItemList.models;\n\t\t\t\x2F\x2Ffor(var i=0; i\x3CtaskModels.length; i++) {\n\t\t\t\x2F\x2F\tvar task = taskModels[i].toJSON();\n\t\t\t\x2F\x2F\taddTaskToChecklist({\n\t\t\t\x2F\x2F\t\tidChecklist: \tnewChecklistId,\n\t\t\t\x2F\x2F\t\tname:\t\t \ttask.name,\n\t\t\t\x2F\x2F\t\tpos:\t\t \ttask.pos,\n\t\t\t\x2F\x2F\t\tidBoard: \t \ttoBoardId\n\t\t\t\x2F\x2F\t\t\x2F\x2FidPlaceholder: \t\"???\"\n\t\t\t\x2F\x2F\t});\n\t\t\t\x2F\x2F}\n\n\t\t\tvar addTaskQueue = _.map(taskModels, function(taskModel) {\n\t\t\t\treturn function(callback) {\n\t\t\t\t\tvar task = taskModel.toJSON();\n\t\t\t\t\taddTaskToChecklist({\n\t\t\t\t\t\tidChecklist: \tnewChecklistId,\n\t\t\t\t\t\tname:\t\t \ttask.name,\n\t\t\t\t\t\tpos:\t\t \ttask.pos,\n\t\t\t\t\t\tidBoard: \t \ttoBoardId\n\t\t\t\t\t\t\x2F\x2FidPlaceholder: \t\"???\"\n\t\t\t\t\t});\n\t\t\t\t};\n\t\t\t});\n\t\t\tcallAfterDone(addTaskQueue, callback);\n\t\t});\n\t});\n};\n\n\x2F** Creates a new board with the given name. \n\t@param board.name\n\t@param board.desc\n\t@param board.labelNames\n\t@param board.idOrganization\n\t@param board.prefs\n\t@param board.privacy\n\t@param callback\n*\x2F\nvar createBoard = function(board, callback) {\n\tvar board = board || {};\n\tboard.privacy = board.privacy || \"private\";\n\tvar attributes = {\n\t\t\"name\": board.name,\n\t\t\"desc\": board.desc,\n\t\t\"labelNames\": board.labelNames,\n\t\t\"prefs\": board.prefs,\n\t\t\"closed\": false, \n\t\t\"prefs\": {\n\t\t\t\"permissionLevel\" : board.privacy\n\t\t}\n\t};\n\n\tif(board.idOrganization){\n\t\tattributes.idOrganization = board.idOrganization;\n\t}\n\n\tpost({\n\t\turl: \"\x2Fapi\x2Fboard\",\n\t\tsuccess: callback,\n\t\tmethod: \"create\",\n\t\tdata: {\n\t\t\t\"attrs\": attributes,\n\t\t\t\"idParents\":[]\n\t\t}\n\t});\n};\n\n\x2F** Creates a new list with the given name on the given board. \n\t@param list.idBoard\n\t@param list.name\n\t@param list.pos\n\t@param list.closed\n\t@param callback\n*\x2F\nvar createList = function(list, callback) {\n\tpost({\n\t\turl: \"\x2Fapi\x2Flist\",\n\t\tsuccess: callback,\n\t\tmethod: \"create\",\n\t\tdata: {\n\t\t\t\"attrs\":{\n\t\t\t\t\"name\": list.name,\n\t\t\t\t\"pos\":  list.pos,\n\t\t\t\t\"closed\": list.closed || false\n\t\t\t},\n\t\t\t\"idParents\":[list.idBoard]\n\t\t}\n\t});\n};\n\n\x2F** Creates a card with the given name on the given board. \n\t@param card.idBoard\n\t@param card.idList\n\t@param card.closed\n\t@param card.desc\n\t@param card.name\n\t@param callback\n*\x2F\nvar createCard = function(card, callback) {\n\tpost({\n\t\turl: \"\x2Fapi\x2Fcard\",\n\t\tsuccess: callback,\n\t\tmethod: \"create\",\n\t\tdata: {\n\t\t\t\"attrs\": card,\n\t\t\t\"idParents\":[card.idList, card.idBoard]\n\t\t}\n\t});\n};\n\n\n\x2F** Updates a card\n\t@param card.idList\n\t@param card.idBoard\n\t@param card.idCard\n\t@param card.updates\n\t@param callback\n*\x2F\nvar updateCard = function(card, callback) {\n\tpost({\n\t\turl: \"\x2Fapi\x2Fcard\x2F\" + card.idCard,\n\t\tsuccess: callback,\n\t\tmethod: \"update\",\n\t\tdata: {\n\t\t\t\"updates\": card.updates,\n\t\t\t\"idParents\":[card.idList, card.idBoard]\n\t\t}\n\t});\n};\n\n\n\x2F** Creates a checklist on the given card. \n\t@param checklist.idBoard\n\t@param checklist.name\n\t@param callback\n*\x2F\nvar createChecklist = function(checklist, callback) {\n\tpost({\n\t\turl: \"\x2Fapi\x2Fchecklist\",\n\t\tsuccess: callback,\n\t\tmethod: \"create\",\n\t\tdata: {\n\t\t\t\"attrs\":{\n\t\t\t\t\"name\": checklist.name\n\t\t\t},\n\t\t\t\"idParents\":[checklist.idBoard]\n\t\t}\n\t});\n};\n\n\x2F** Adds a task to a given checklist \n\t@param task.idChecklist\n\t@param task.name\n\t@param task.pos\n\t@param task.idBoard\n\t@param task.idPlaceholder\n\t@param callback\n*\x2F\nvar addTaskToChecklist = function(task, callback) {\n\tpost({\n\t\turl: \"\x2Fapi\x2Fchecklist\x2F\" + task.idChecklist,\n\t\tsuccess: callback,\n\t\tmethod: \"addTask\",\n\t\tdata: {\n\t\t\t\"name\": task.name,\n\t\t\t\"type\": \"check\",\n\t\t\t\"pos\": task.pos,\n\t\t\t\"idParents\": [task.idBoard],\n\t\t\t\"id\": task.idPlaceholder\n\t\t}\n\t});\n};\n\n\x2F** Add Checklist to Card\n\t@param card.idBoard\n\t@param card.idList\n\t@param card.idCard\n\t@param card.idChecklist\n*\x2F\nvar addChecklistToCard = function (card, callback){\n\tupdateCard({\n\t\tidBoard:\tcard.idBoard,\n\t\tidList: \tcard.idList,\n\t\tidCard: \tcard.idCard,\n\t\tupdates: [\n\t\t\t{ \"addToSet\": {\t\"idChecklists\": card.idChecklist }}\n\t\t]\n\t}, callback);\n};\n\n\n\x2F** Archive all lists in the given board *\x2F\nvar archiveAll = function(idBoard) {\n\t\n};\n\n\x2F** Archives the given list. *\x2F\nvar archiveList = function(idBoard, idList, callback) {\n\tupdateList({\n\t\tid: idList,\n\t\tupdates: [\n\t\t\t{ \"set\": { \"closed\": true }}\n\t\t],\n\t\tidBoard: idBoard\n\t}, callback);\n};\n\n\x2F** Updates a list.\n\t@param list.id\n\t@param list.updates\n\t@param list.idBoard\n\t@param callback\n*\x2F\nvar updateList = function(list, callback) {\n\tpost({\n\t\turl: \"\x2Fapi\x2Flist\x2F\" + list.id,\n\t\tsuccess: callback,\n\t\tmethod: \"update\",\n\t\tdata: {\n\t\t\t\"updates\": list.updates,\n\t\t\t\"idParents\":[list.idBoard]\n\t\t}\n\t});\n};\n\n\x2F** Gets all current data for the given board. *\x2F\nvar getBoardData = function(idBoard, callback) {\n\t$.get(\"\x2Fdata\x2Fboard\x2F\" + idBoard + \"\x2Fcurrent\", callback);\n};\n\n\x2F** A simplified POST. \n\t@param args.url\n\t@param args.data\n\t@param args.method\n\t@param args.success\n*\x2F\nvar post = function(args) {\n\n\tvar isToken = function(s) { return s.indexOf(\"token=\") === 0; };\n\tvar tokenKeyValue = _.find(document.cookie.split(\x2F\\W*;\\W*\x2F), isToken);\n\tvar token = unescape(tokenKeyValue.split(\"=\")[1]);\n\n\t$.ajax({\n\t\ttype: \"post\",\n\t\tdataType: \"json\",\n\t\tcontentType: \"application\x2Fjson\",\n\t\tprocessData: false,\n\t\turl: args.url,\n\t\tdata: JSON.stringify({\n\t\t\t\"token\": token,\n\t\t\t\"method\": args.method,\n\t\t\t\"data\": args.data\n\t\t}),\n\t\tsuccess: args.success\n\t});\n};\n\n\n\x2F*******************\n * Utility\n *******************\x2F\n\n\x2F** Invokes a callback after all the given asynchronous functions have completed. All asynchronous functions must accept a single callback argument. *\x2F\nvar callAfterDone = function(queue, callback) {\n\n\tvar count = queue.length;\n\n\tif(count === 0) {\n\t\tcallback();\n\t}\n\telse {\n\t\tvar decAndCheck = function() {\n\t\t\tif(--count \x3C= 0) {\n\t\t\t\tcallback();\n\t\t\t}\n\t\t};\n\n\t\tfor(var i=0; i\x3Cqueue.length; i++) {\n\t\t\tqueue[i](decAndCheck);\n\t\t}\n\t}\n};";