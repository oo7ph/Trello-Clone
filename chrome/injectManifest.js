/** Uses injectScript to inject the source of scripts that need access to the host page's Javascript. This is a workaround for Chrome's sandboxing restriction. To embed our functionality into the Trello page, we need to interact with the page's JS. */
injectScript(livequery_source);
injectScript(trello_clone_board_source);
injectScript(trello_clone_button_source);
