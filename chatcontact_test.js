/* 
* CCaaS Public Chat Channel Connector
* (C) 2022, Tomohiro Iwasa, tiwasa@avaya.com
* This code is licensed under the MIT License
*/

"use strict";

import { _stdout, _stdout_log, _stdout_table, _stderror } from "./lib/stdout.js";
const DEBUG = false;
const INFO = true;

import ChatContact from "./chatcontact.js";
const CHANNEL_ID = 0
const channels = [{ server: "xx.xx.avayacloud.com", id: "XXXXXXX", auth: "Chatapp_0x:xxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx", }];
let chatContact = new ChatContact(channels[CHANNEL_ID]);

// Agent connection test
(async () => {
	try {
		// Trigger the workflow to assign an agent based on the attributes
		if (!chatContact.aquireAgent({ customerIdentifier: "test123@demo.com", displayName: "Tomohiro Iwasa", firstName: "Tomohiro", lastName: "Iwasa", emailAddress: "test123@demo.com", contactNumber: "1234567890" }, { "language": "", "device": "", "customerType": "", "location": "Japan" })) {
			if (INFO | DEBUG) _stderror("aquireAgent error");
			return;
		}

		await new Promise(resolve => setTimeout(resolve, 20000));

		// Send a message to the agent
		chatContact.sendMessageToAgent("test123@demo.com", "カードの融資枠を増やしたいのですが、どうすればいいですか？");

		await new Promise(resolve => setTimeout(resolve, 10000));

		// Release the agent and get the customer back to Chatbot
		chatContact.releaseAgent("test123@demo.com");
	}
	catch (error) {
		if (INFO | DEBUG) _stderror(error);
	}
})();
