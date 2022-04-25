/* 
* CCaaS Public Chat Channel Connector
* (C) 2022, Tomohiro Iwasa, tiwasa@avaya.com
* This code is licensed under the MIT License
*/

"use strict";

//import fs from "fs";
//import https from "https";
import http from "http";
import express from "express";
import bodyParser from "body-parser";

import { _stdout, _stdout_log, _stdout_table, _stderror } from "./lib/stdout.js";
const INFO = true;
const DEBUG = true;

//const PORT = 443;
const PORT = 8080;

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("port", PORT);
app.set("view engine", "ejs");
app.set('trust proxy', true);

/*
https.createServer({
	key: fs.readFileSync("/home/share/certificates/private.key"),
	cert: fs.readFileSync("/home/share/certificates/server.crt"),
	ca: fs.readFileSync("/home/share/certificates/ca.crt"),
	requestCert: true,
	rejectUnauthorized: false
}, app).listen(PORT, () => { _stdout(`Server listening on port ${PORT}`); });
*/

http.createServer(app).listen(PORT, () => { _stdout(`Server listening on port ${PORT}`); });

// GKE health check
app.get('/', (req, resp) => {
	if (DEBUG) _stdout(`/GKE health check`);
	return resp.sendStatus(200);
});

process.once("beforeExit", () => {
	if (INFO | DEBUG) _stdout("beforeExit");
});

import ChatContact from "./chatcontact.js";
let chatContact = null;

app.get("/webhook", async (req, resp) => {
	resp.sendStatus(200).end();
	if (INFO | DEBUG) _stdout(`ChatContact /webhook`);
	if (DEBUG) _stdout_log(req);
	await chatContact.receiveMessage(CHANNEL_ID);
});

app.post("/initChatChannel", async (req, resp) => {
	chatContact = new ChatContact(req.body.channel_info);
	resp.send({ result: (chatContact ? true : false) }).end();
	if (INFO | DEBUG) _stdout(`/initChatChannel ${(!chatContact ? 'failue' : 'success')} ${JSON.stringify({ channel_info: req.body.channel_info })}`);
})

app.post("/aquireAgent", async (req, resp) => {
	let customerIdentifier = req.body.profile.customerIdentifier;
	if (!chatContact) {
		resp.send({ result: false, error: "chatContact = null", customerIdentifier: customerIdentifier }).end();
		if (INFO | DEBUG) _stdout(`/aquireAgent ${JSON.stringify({ result: false, error: 'chatContact null', customerIdentifier: customerIdentifier })}`);
		return;
	}
	try {
		await chatContact.aquireAgent(req.body.profile, req.body.attributes).then((result) => {
			resp.send({ result: result, customerIdentifier: req.body.profile.customerIdentifier }).end();
			if (INFO | DEBUG) _stdout(`/aquireAgent ${JSON.stringify({ result: result, customerIdentifier: customerIdentifier })}`);
		});
	} catch (error) {
		resp.send({ result: false, error: error, customerIdentifier: customerIdentifier }).end();
		if (INFO | DEBUG) _stdout(`/aquireAgent ${JSON.stringify({ result: false, error: error, customerIdentifier: customerIdentifier })}`);
	}
});

app.post("/sendMessageToAgent", async (req, resp) => {
	let customerIdentifier = req.body.customerIdentifier;
	if (!chatContact) {
		resp.send({ result: false, error: "chatContact = null", customerIdentifier: customerIdentifier }).end();
		if (INFO | DEBUG) _stdout(`/sendMessageToAgent ${JSON.stringify({ result: false, error: 'chatContact null', customerIdentifier: customerIdentifier })}`);
		return;
	}
	try {
		await chatContact.sendMessageToAgent(customerIdentifier, req.body.text).then((result) => {
			resp.send({ result: result, customerIdentifier: customerIdentifier }).end();
			if (INFO | DEBUG) _stdout(`/sendMessageToAgent ${JSON.stringify({ result: result, customerIdentifier: customerIdentifier })}`);
		});
	} catch (error) {
		resp.send({ result: false, error: error, customerIdentifier: customerIdentifier }).end();
		if (INFO | DEBUG) _stdout(`/sendMessageToAgent ${JSON.stringify({ result: false, error: error, customerIdentifier: customerIdentifier })}`);
	}
});

app.post("/releaseAgent", async (req, resp) => {
	let customerIdentifier = req.body.customerIdentifier;
	if (!chatContact) {
		resp.send({ result: false, error: "chatContact = null", customerIdentifier: customerIdentifier }).end();
		if (INFO | DEBUG) _stdout(`/releaseAgent ${JSON.stringify({ result: false, error: 'chatContact null', customerIdentifier: customerIdentifier })}`);
		return;
	};
	try {
		await chatContact.releaseAgent(customerIdentifier).then((result) => {
			resp.send({ result: result, customerIdentifier: customerIdentifier }).end();
			if (INFO | DEBUG) _stdout(`/releaseAgent ${JSON.stringify({ result: result, customerIdentifier: customerIdentifier })}`);
		});
	} catch (error) {
		resp.send({ result: false, error: error, customerIdentifier: customerIdentifier }).end();
		if (INFO | DEBUG) _stdout(`/releaseAgent ${JSON.stringify({ result: false, error: error, customerIdentifier: customerIdentifier })}`);
	}
});


