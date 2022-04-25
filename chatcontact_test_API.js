/* test */

"use strict";

import restAPI from "./lib/restAPI.js";
const RESTAPI_TIMEOUT = 5000;

import { _stdout, _stdout_log, _stdout_table, _stderror } from "./lib/stdout.js";
const INFO = true;
const DEBUG = true;

const API_SERVER = "xxxxx.xxxxxxxx.xx";

(async () => {

	// Initizalise the chat channel object
	const channels = [{ server: "xx.xx.avayacloud.com", id: "XXXXXXX", auth: "Chatapp_0x:xxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx", }];
	await restAPI(
		`https://${API_SERVER}/initChatChannel`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			json: true,
			body: {
				channel_info: channels[0],
			},
			timeout: RESTAPI_TIMEOUT,
		}
	).then(async (data) => {
		if (INFO) _stdout(`initChatChannel success ${JSON.stringify(data)}`);
	}
	).catch((error) => {
		if (INFO | DEBUG) _stdout_log(error);
	});

	// Trigger the workflow to assign an agent based on the attributes
	await restAPI(
		`https://${API_SERVER}/aquireAgent`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			json: true,
			body: {
				profile: { customerIdentifier: "test123@demo.com", displayName: "Tomohiro Iwasa", firstName: "Tomohiro", lastName: "Iwasa", emailAddress: "test123@demo.com", contactNumber: "1234567890" },
				attributes: { "language": "", "device": "", "customerType": "", "location": "Japan" },
			},
			timeout: RESTAPI_TIMEOUT,
		}
	).then(async (data) => {
		if (INFO) _stdout(`aquireAgent success ${JSON.stringify(data)}`);
	}).catch((error) => {
		if (INFO | DEBUG) _stdout_log(error);
	});

	await new Promise(resolve => setTimeout(resolve, 10000));

	// Send a message to the agent
	await restAPI(
		`https://${API_SERVER}/sendMessageToAgent`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			json: true,
			body: {
				customerIdentifier: "test123@demo.com",
				text: "カードの融資枠を増やしたいのですが、どうすればいいですか？",
			},
			timeout: RESTAPI_TIMEOUT,
		}
	).then(async (data) => {
		if (INFO | DEBUG) _stdout(`sendMessageToAgent success ${JSON.stringify(data)}`);
	}).catch((error) => {
		if (INFO | DEBUG) _stdout_log(error);
	});

	await new Promise(resolve => setTimeout(resolve, 10000));

	// Release the agent and get the customer back to Chatbot
	await restAPI(
		`https://${API_SERVER}/releaseAgent`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			json: true,
			body: {
				customerIdentifier: "test123@demo.com",
			},
			timeout: RESTAPI_TIMEOUT,
		}
	).then((data) => {
		if (INFO | DEBUG) _stdout(`releaseAgent success ${JSON.stringify(data)}`);
	}).catch((error) => {
		if (INFO | DEBUG) _stdout_log(error);
	});
})();
